"use server"

import { db } from "@/db"
import { eq, and, lt, gt, ne, gte, lte } from "drizzle-orm"
import { users, clinics, services as servicesSchema, appointments, appointmentServices, clinicSchedules } from "@/db/schema"
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
        status: "reserved",
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

export async function getAvailableSlots(clinicId: string, date: Date, serviceDuration: number) {
    // 1. Get schedule for day of week
    const dayOfWeek = date.getDay()
    const scheduleRows = await db.select().from(clinicSchedules).where(
        and(
            eq(clinicSchedules.clinicId, clinicId),
            eq(clinicSchedules.dayOfWeek, dayOfWeek),
            eq(clinicSchedules.isActive, true)
        )
    )
    const schedule = scheduleRows[0]
    if (!schedule) return []

    // 2. Parse open/close times
    const [openH, openM] = schedule.openTime.split(":").map(Number)
    const [closeH, closeM] = schedule.closeTime.split(":").map(Number)

    const startTime = new Date(date)
    startTime.setHours(openH, openM, 0, 0)

    const endTime = new Date(date)
    endTime.setHours(closeH, closeM, 0, 0)

    // 3. Get existing appointments for this day
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const existingAppointments = await db.select().from(appointments).where(
        and(
            eq(appointments.clinicId, clinicId),
            gte(appointments.startTime, dayStart),
            lte(appointments.endTime, dayEnd),
            ne(appointments.status, "cancelled")
        )
    )

    // 4. Generate slots (every 30 mins)
    const slots: string[] = []
    let current = new Date(startTime)

    while (current.getTime() + serviceDuration * 60000 <= endTime.getTime()) {
        const slotStart = new Date(current)
        const slotEnd = new Date(current.getTime() + serviceDuration * 60000)

        // Check for conflicts
        const isConflict = existingAppointments.some(appt => {
            return (slotStart < appt.endTime && slotEnd > appt.startTime)
        })

        if (!isConflict) {
            slots.push(formatTime(current))
        }

        // Increment by 30 mins
        current = new Date(current.getTime() + 30 * 60000)
    }

    return slots
}

function formatTime(date: Date) {
    return date.toTimeString().slice(0, 5) // "HH:MM"
}
