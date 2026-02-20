import { db } from "@/db"
import { eq, and, gte, lte } from "drizzle-orm"
import { campaignSettings, appointments, retentionLogs } from "@/db/schema"

import { NextResponse } from "next/server"
import { addDays, startOfDay, endOfDay, subYears } from "date-fns"
import { CommunicationService } from "@/lib/communication"

export async function GET(req: Request) {
    // 1. Security Check
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const campaigns = await db.select().from(campaignSettings).where(eq(campaignSettings.isActive, true))
        let sentCount = 0

        for (const campaign of campaigns) {
            // Find users due in `triggerDays`
            // Due Date = Last Appointment + 2 Years
            // So Last Appointment = Due Date - 2 Years
            // Target Last Appt Date = (Now + triggerDays) - 2 Years

            const now = new Date()
            const targetDueDate = addDays(now, campaign.triggerDays)
            const targetLastApptDate = subYears(targetDueDate, 2)

            // We search for appointments on that specific day (or range if cron runs daily)
            // Let's use a 24h window for the target last appt date
            const startRange = startOfDay(targetLastApptDate)
            const endRange = endOfDay(targetLastApptDate)

            // Only pull appointments that matched this campaign's clinicId
            const fetchedAppointments = await db.query.appointments.findMany({
                where: and(
                    eq(appointments.clinicId, campaign.clinicId),
                    gte(appointments.startTime, startRange),
                    lte(appointments.startTime, endRange),
                    eq(appointments.status, "completed")
                ),
                with: { user: true },
                limit: 100 // Batch limit for scalability
            })

            console.log(`Campaign ${campaign.clinicId} - ${campaign.phaseName}: Found ${fetchedAppointments.length} appointments from 2 years ago matching range.`)

            await Promise.allSettled(fetchedAppointments.map(async (appt: any) => {
                const user = appt.user
                if (!user) return

                const existingLogs = await db.select().from(retentionLogs).where(and(
                    eq(retentionLogs.userId, user.id),
                    eq(retentionLogs.campaign, campaign.phaseName)
                ))

                if (existingLogs.length > 0) return

                let success = false;

                if (campaign.sendSms && user.phone) {
                    const message = campaign.smsTemplate
                        .replace("{FirstName}", user.name || "Driver")
                        .replace("{attachmentUrl}", "https://kat-clinic.com/get-my-card")

                    try {
                        const smsRes = await CommunicationService.sendSms({
                            to: user.phone,
                            body: message,
                            clinicId: campaign.clinicId
                        });
                        if (smsRes.success) success = true;
                    } catch (smsError) {
                        console.error(`Failed to send SMS to ${user.phone}`, smsError)
                    }
                }

                if (campaign.sendEmail && user.email) {
                    const htmlMessage = campaign.emailTemplate
                        .replace("{FirstName}", user.name || "Driver")
                        .replace("{attachmentUrl}", "https://kat-clinic.com/get-my-card")

                    try {
                        const emailResult = await CommunicationService.sendEmail({
                            to: user.email,
                            subject: `Important Update from KAT Clinic (Phase: ${campaign.phaseName})`,
                            html: htmlMessage,
                            clinicId: campaign.clinicId
                        })
                        if (emailResult.success) {
                            success = true;
                        }
                    } catch (emailError) {
                        console.error(`Failed to send Email to ${user.email}`, emailError)
                    }
                }

                if (success) {
                    try {
                        await db.insert(retentionLogs).values({
                            id: crypto.randomUUID(),
                            userId: user.id,
                            campaign: campaign.phaseName,
                            status: "sent"
                        })
                        sentCount++
                    } catch (logError) {
                        // ignore unique constraint violation if fired concurrently
                        console.error(`Failed to create retention log for ${user.id}`, logError)
                    }
                }
            }))
        }

        return NextResponse.json({ success: true, sentCount })
    } catch (error) {
        console.error("Cron Job Error", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
