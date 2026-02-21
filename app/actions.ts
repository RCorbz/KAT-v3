"use server"

import { db } from "@/db"
import { appointments, clinics } from "@/db/schema"
import { eq } from "drizzle-orm"
import { CommunicationService } from "@/lib/communication"

export async function initiateWalkIn(phone: string, clinicId: string) {
    try {
        const clinic = await db.query.clinics.findFirst({
            where: eq(clinics.id, clinicId)
        })

        if (!clinic) throw new Error("Clinic not found")

        const startTime = new Date()
        const endTime = new Date(startTime.getTime() + 30 * 60000)

        // 1. Create a "walkin" status appointment/lead
        await db.insert(appointments).values({
            id: crypto.randomUUID(),
            userId: "walkin_lead", // Placeholder or create a guest user if needed
            clinicId: clinicId,
            status: "walkin",
            startTime: startTime,
            endTime: endTime,
            intakeAnswers: { phone, type: "walkin_call_ahead" }
        })

        // 2. Send SMS thank you
        const message = `Thanks for choosing ${clinic.name}! We're looking forward to seeing you soon. We're getting things ready for your visit.`

        await CommunicationService.sendSms({
            to: phone,
            body: message,
            clinicId: clinicId
        })

        return { success: true }
    } catch (e: any) {
        console.error("Walk-in initiation failed:", e)
        return { error: e.message }
    }
}
