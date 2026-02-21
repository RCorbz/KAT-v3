"use server"

import { db } from "@/db"
import { eq, and, lt, gt, ne } from "drizzle-orm"
import { users, clinics, services as servicesSchema, appointments, appointmentServices } from "@/db/schema"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createAppointment(formData: any) {
    // formData contains: answers, date, timeSlot, upsellAccepted, userDetails
    const { answers, date, timeSlot, upsellAccepted, userDetails, clinicId } = formData

    // 1. Find or Create User
    const existingUsers = await db.select().from(users).where(eq(users.email, userDetails.email))
    let user = existingUsers[0]

    let userId = user?.id

    if (!user) {
        userId = crypto.randomUUID()
        await db.insert(users).values({
            id: userId,
            email: userDetails.email,
            name: `${userDetails.firstName} ${userDetails.lastName}`.trim(),
            phone: userDetails.phone,
        })
    } else {
        // Update phone/name if changed?
        await db.update(users).set({
            name: `${userDetails.firstName} ${userDetails.lastName}`.trim(),
            phone: userDetails.phone
        }).where(eq(users.id, userId))
    }

    // 2. Resolve Services
    const clinicRows = await db.select().from(clinics).where(eq(clinics.id, clinicId))
    const clinic = clinicRows[0]

    if (!clinic) throw new Error("Clinic not found")

    const clinicServices = await db.select().from(servicesSchema).where(eq(servicesSchema.clinicId, clinicId))

    const baseService = clinicServices.find(s => !s.isUpsell)
    const upsellService = clinicServices.find(s => s.isUpsell)

    const servicesToConnect = []
    if (baseService) servicesToConnect.push({ id: baseService.id })
    if (upsellAccepted && upsellService) {
        servicesToConnect.push({ id: upsellService.id })
    }

    // 3. Create Appointment
    // Parse date and timeSlot to Date objects
    const bookingDate = new Date(date)
    const [hours, minutes] = timeSlot.split(":").map(Number)
    const startTime = new Date(bookingDate)
    startTime.setHours(hours, minutes, 0, 0)

    const totalDuration = (baseService?.duration || 30) + (upsellAccepted ? (upsellService?.duration || 15) : 0)
    const endTime = new Date(startTime.getTime() + totalDuration * 60000)

    // Double booking check
    const conflictSlots = await db.select().from(appointments).where(
        and(
            eq(appointments.clinicId, clinicId),
            lt(appointments.startTime, endTime),
            gt(appointments.endTime, startTime),
            ne(appointments.status, "cancelled")
        )
    )

    if (conflictSlots.length > 0) {
        return { error: "Slot already taken", status: 409 }
    }

    const appointmentId = crypto.randomUUID()
    await db.insert(appointments).values({
        id: appointmentId,
        userId: userId,
        clinicId: clinicId,
        startTime,
        endTime,
        status: "booked",
        intakeAnswers: answers // Save the answers json!
    })

    if (servicesToConnect.length > 0) {
        await db.insert(appointmentServices).values(
            servicesToConnect.map(s => ({
                appointmentId,
                serviceId: s.id
            }))
        )
    }

    revalidatePath("/get-my-card")
    return { success: true, appointmentId }
}
