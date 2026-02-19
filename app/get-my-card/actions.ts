"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createAppointment(formData: any) {
    // formData contains: answers, date, timeSlot, upsellAccepted, userDetails
    const { answers, date, timeSlot, upsellAccepted, userDetails, clinicId } = formData

    // 1. Find or Create User
    // For MVP, simplistic upsert by email. Real world needs auth or stronger check.
    let user = await prisma.user.findUnique({ where: { email: userDetails.email } })

    if (!user) {
        user = await prisma.user.create({
            data: {
                email: userDetails.email,
                name: userDetails.name,
                phone: userDetails.phone,
            }
        })
    } else {
        // Update phone/name if changed?
        await prisma.user.update({
            where: { id: user.id },
            data: { name: userDetails.name, phone: userDetails.phone }
        })
    }

    // 2. Resolve Services
    const clinic = await prisma.clinic.findUnique({
        where: { id: clinicId },
        include: { services: true }
    })

    if (!clinic) throw new Error("Clinic not found")

    const baseService = clinic.services.find(s => !s.isUpsell)
    const upsellService = clinic.services.find(s => s.isUpsell)

    const servicesToConnect = [{ id: baseService?.id! }]
    if (upsellAccepted && upsellService) {
        servicesToConnect.push({ id: upsellService.id })
    }

    // 3. Create Appointment
    // Parse date and timeSlot to Date objects
    // date is ISO string from JSON?
    const bookingDate = new Date(date)
    const [hours, minutes] = timeSlot.split(":").map(Number)
    const startTime = new Date(bookingDate)
    startTime.setHours(hours, minutes, 0, 0)

    const totalDuration = (baseService?.duration || 30) + (upsellAccepted ? (upsellService?.duration || 15) : 0)
    const endTime = new Date(startTime.getTime() + totalDuration * 60000)

    // Double booking check
    const conflict = await prisma.appointment.findFirst({
        where: {
            clinicId: clinicId,
            startTime: {
                lt: endTime
            },
            endTime: {
                gt: startTime
            },
            status: {
                not: "cancelled"
            }
        }
    })

    if (conflict) {
        return { error: "Slot already taken", status: 409 }
    }

    await prisma.appointment.create({
        data: {
            userId: user.id,
            clinicId: clinicId,
            startTime,
            endTime,
            services: {
                connect: servicesToConnect // M-N relation support
            },
            // Save intake answers? Schema doesn't have field for it.
            // Maybe save as JSON in a new field or just rely on IntakeQuestion for UI?
            // Prompt said "Auto-check the UI form boxes". 
            // Usually we store the answers.
            // I will assume for now we just create the appointment. 
            // Ideally schema needs `intakeAnswers Json?`
        }
    })

    revalidatePath("/get-my-card")
    redirect("/get-my-card/success")
}
