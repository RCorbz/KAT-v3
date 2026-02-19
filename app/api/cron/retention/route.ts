import prisma from "@/lib/prisma"
import { plivoClient } from "@/lib/plivo"
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

            const appointments = await prisma.appointment.findMany({
                where: {
                    startTime: {
                        gte: startRange,
                        lte: endRange
                    },
                    status: "completed"
                },
                include: { user: true }
            })

            console.log(`Campaign ${campaign.phaseName}: Found ${appointments.length} appointments from 2 years ago matching range.`)

            for (const appt of appointments) {
                const user = appt.user
                if (!user.phone) continue

                // Check for duplicate send
                // This logic assumes "phase" is unique per user per cycle.
                // If a user has multiple appointments, this might need refinement (e.g. check log date vs appt date).
                // For MVP, simplistic check: has this user received this phase's message RECENTLY? 
                // Or just ever? "Prevent duplicate sends in the same phase."
                // I'll check if a log exists for this user + phase.
                // If users renew every 2 years, we might want to allow sending again after 2 years.
                // But `RetentionLog` is simple. I'll check if log exists.
                // Better: check if log exists created > 1 year ago?
                // For now, strict check.

                const existingLog = await prisma.retentionLog.findFirst({
                    where: {
                        userId: user.id,
                        campaign: campaign.phaseName
                    }
                })

                if (existingLog) continue

                // Prepare SMS
                const message = campaign.smsTemplate
                    .replace("{FirstName}", user.name || "Driver")
                    .replace("{attachmentUrl}", "https://kat-clinic.com/get-my-card") // Mock URL

                // Send SMS via Plivo
                try {
                    await plivoClient.messages.create(
                        process.env.PLIVO_PROXY_NUMBER!, // src
                        user.phone, // dst
                        message
                    )

                    // Log it
                    await prisma.retentionLog.create({
                        data: {
                            userId: user.id,
                            campaign: campaign.phaseName,
                            status: "sent"
                        }
                    })
                    sentCount++
                } catch (smsError) {
                    console.error(`Failed to send SMS to ${user.phone}`, smsError)
                }
            }
        }

        return NextResponse.json({ success: true, sentCount })
    } catch (error) {
        console.error("Cron Job Error", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
