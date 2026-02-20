import prisma from "@/lib/prisma"
import { plivoClient } from "@/lib/plivo"
import { sendEmail } from "@/lib/email"
import { NextResponse } from "next/server"
import { addDays, startOfDay, endOfDay, subYears } from "date-fns"

export async function GET(req: Request) {
    // 1. Security Check
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const campaigns = await prisma.campaignSettings.findMany({ where: { isActive: true } })
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
            const appointments = await prisma.appointment.findMany({
                where: {
                    clinicId: campaign.clinicId,
                    startTime: {
                        gte: startRange,
                        lte: endRange
                    },
                    status: "completed"
                },
                include: { user: true },
                take: 100 // Batch limit for scalability
            })

            console.log(`Campaign ${campaign.clinicId} - ${campaign.phaseName}: Found ${appointments.length} appointments from 2 years ago matching range.`)

            await Promise.allSettled(appointments.map(async (appt) => {
                const user = appt.user

                const existingLog = await prisma.retentionLog.findFirst({
                    where: {
                        userId: user.id,
                        campaign: campaign.phaseName
                    }
                })

                if (existingLog) return

                let success = false;

                if (campaign.sendSms && user.phone) {
                    const message = campaign.smsTemplate
                        .replace("{FirstName}", user.name || "Driver")
                        .replace("{attachmentUrl}", "https://kat-clinic.com/get-my-card")

                    try {
                        await plivoClient.messages.create(
                            process.env.PLIVO_PROXY_NUMBER!,
                            user.phone,
                            message
                        )
                        success = true;
                    } catch (smsError) {
                        console.error(`Failed to send SMS to ${user.phone}`, smsError)
                    }
                }

                if (campaign.sendEmail && user.email) {
                    const htmlMessage = campaign.emailTemplate
                        .replace("{FirstName}", user.name || "Driver")
                        .replace("{attachmentUrl}", "https://kat-clinic.com/get-my-card")

                    try {
                        const emailResult = await sendEmail({
                            to: user.email,
                            subject: `Important Update from KAT Clinic (Phase: ${campaign.phaseName})`,
                            html: htmlMessage
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
                        await prisma.retentionLog.create({
                            data: {
                                userId: user.id,
                                campaign: campaign.phaseName,
                                status: "sent"
                            }
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
