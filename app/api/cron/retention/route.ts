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
                include: { user: true },
                take: 100 // Batch limit for scalability
            })

            console.log(`Campaign ${campaign.phaseName}: Found ${appointments.length} appointments from 2 years ago matching range.`)

            await Promise.allSettled(appointments.map(async (appt) => {
                const user = appt.user
                if (!user.phone) return

                const existingLog = await prisma.retentionLog.findFirst({
                    where: {
                        userId: user.id,
                        campaign: campaign.phaseName
                    }
                })

                if (existingLog) return

                const message = campaign.smsTemplate
                    .replace("{FirstName}", user.name || "Driver")
                    .replace("{attachmentUrl}", "https://kat-clinic.com/get-my-card")

                try {
                    await plivoClient.messages.create(
                        process.env.PLIVO_PROXY_NUMBER!,
                        user.phone,
                        message
                    )

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
            }))
        }

        return NextResponse.json({ success: true, sentCount })
    } catch (error) {
        console.error("Cron Job Error", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
