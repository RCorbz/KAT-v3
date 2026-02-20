"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

// Auth check helper
const checkAdmin = async () => {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session || session.user.role !== 'admin') {
        throw new Error("Unauthorized")
    }
}

export async function updateService(id: string, data: { price: number, duration: number, isActive: boolean }) {
    await checkAdmin()
    await prisma.service.update({
        where: { id },
        data: {
            price: data.price,
            duration: data.duration,
            // isActive is not on Service model in schema, only isUpsell. Assuming broad update capability.
            // Oh, schema has `isActive` on Clinic and Schedule, but not Service.
            // I'll ignore isActive for Service for now or add it if needed.
        }
    })
    revalidatePath("/admin/operations")
}

export async function updateSchedule(id: string, data: { openTime: string, closeTime: string, isActive: boolean }) {
    await checkAdmin()
    await prisma.clinicSchedule.update({
        where: { id },
        data
    })
    revalidatePath("/admin/operations")
}

export async function createClinic(data: { name: string, address: string, city: string, state: string, zip: string, phone: string }) {
    await checkAdmin()
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    await prisma.clinic.create({
        data: {
            ...data,
            slug,
            isActive: true
        }
    })
    revalidatePath("/admin/operations")
}

export async function updateClinic(id: string, data: { name: string, address: string, city: string, state: string, zip: string, phone: string, isActive: boolean }) {
    await checkAdmin()
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    await prisma.clinic.update({
        where: { id },
        data: {
            ...data,
            slug
        }
    })
    revalidatePath("/admin/operations")
}

export async function updateClinicDoctorInfo(id: string, data: { doctorName?: string, doctorPicUrl?: string, doctorBio?: string, doctorPhone?: string, doctorEmail?: string, doctorType?: string, additionalInfo?: string }) {
    await checkAdmin()

    // Parse additionalInfo JSON string if provided
    let parsedAdditionalInfo = undefined
    if (data.additionalInfo) {
        try {
            parsedAdditionalInfo = JSON.parse(data.additionalInfo)
        } catch (e) {
            console.error("Failed to parse additionalInfo JSON", e)
        }
    }

    await prisma.clinic.update({
        where: { id },
        data: {
            doctorName: data.doctorName,
            doctorPicUrl: data.doctorPicUrl,
            doctorBio: data.doctorBio,
            doctorPhone: data.doctorPhone,
            doctorEmail: data.doctorEmail,
            doctorType: data.doctorType,
            ...(parsedAdditionalInfo !== undefined && { additionalInfo: parsedAdditionalInfo })
        }
    })
    revalidatePath("/admin/operations")
}

export async function createService(data: { clinicId: string, name: string, price: number, duration: number, isUpsell: boolean }) {
    await checkAdmin()
    await prisma.service.create({
        data
    })
    revalidatePath("/admin/operations")
}

export async function deleteService(id: string) {
    await checkAdmin()
    await prisma.service.delete({
        where: { id }
    })
    revalidatePath("/admin/operations")
}

export async function createSchedule(data: { clinicId: string, dayOfWeek: number, openTime: string, closeTime: string }) {
    await checkAdmin()
    await prisma.clinicSchedule.create({
        data: {
            ...data,
            isActive: true
        }
    })
    revalidatePath("/admin/operations")
}

export async function deleteSchedule(id: string) {
    await checkAdmin()
    await prisma.clinicSchedule.delete({
        where: { id }
    })
    revalidatePath("/admin/operations")
}

export async function upsertCampaignSetting(clinicId: string, data: { id?: string, phaseName: string, triggerDays: number, smsTemplate: string, emailTemplate: string, sendSms: boolean, sendEmail: boolean, isActive: boolean }) {
    await checkAdmin()
    if (data.id) {
        await prisma.campaignSettings.update({
            where: { id: data.id },
            data: {
                triggerDays: data.triggerDays,
                smsTemplate: data.smsTemplate,
                emailTemplate: data.emailTemplate,
                sendSms: data.sendSms,
                sendEmail: data.sendEmail,
                isActive: data.isActive
            }
        })
    } else {
        await prisma.campaignSettings.upsert({
            where: { clinicId_phaseName: { clinicId, phaseName: data.phaseName } },
            update: {
                triggerDays: data.triggerDays,
                smsTemplate: data.smsTemplate,
                emailTemplate: data.emailTemplate,
                sendSms: data.sendSms,
                sendEmail: data.sendEmail,
                isActive: data.isActive
            },
            create: {
                clinicId,
                phaseName: data.phaseName,
                triggerDays: data.triggerDays,
                smsTemplate: data.smsTemplate,
                emailTemplate: data.emailTemplate,
                sendSms: data.sendSms,
                sendEmail: data.sendEmail,
                isActive: data.isActive
            }
        })
    }
    revalidatePath("/admin/campaigns")
}

export async function deleteCampaignSetting(id: string) {
    await checkAdmin()
    await prisma.campaignSettings.delete({
        where: { id }
    })
    revalidatePath("/admin/campaigns")
}

export async function testCampaignPhase(campaignId: string, testPhone: string, testEmail: string) {
    await checkAdmin()
    const campaign = await prisma.campaignSettings.findUnique({
        where: { id: campaignId }
    })

    if (!campaign) throw new Error("Campaign not found")

    let result = { sms: false, email: false }

    if (testPhone) {
        const message = campaign.smsTemplate
            .replace("{FirstName}", "[Test User]")
            .replace("{attachmentUrl}", "https://kat-clinic.com/test-link")

        const hasPlivo = process.env.PLIVO_PROXY_NUMBER && process.env.PLIVO_AUTH_ID && process.env.PLIVO_AUTH_TOKEN

        if (!hasPlivo) {
            // Mock Mode
            await prisma.campaignSettings.update({
                where: { id: campaignId },
                data: { lastTestSmsStatus: "success (mocked)", lastTestSmsAt: new Date() }
            })
            result.sms = true
        } else {
            try {
                const { plivoClient } = await import("@/lib/plivo");
                await plivoClient.messages.create(
                    process.env.PLIVO_PROXY_NUMBER!,
                    testPhone,
                    message
                )
                result.sms = true
                await prisma.campaignSettings.update({
                    where: { id: campaignId },
                    data: { lastTestSmsStatus: "success", lastTestSmsAt: new Date() }
                })
            } catch (smsError) {
                console.error("Test SMS Error", smsError)
                await prisma.campaignSettings.update({
                    where: { id: campaignId },
                    data: { lastTestSmsStatus: "error", lastTestSmsAt: new Date() }
                })
            }
        }
    }

    if (testEmail) {
        const htmlMessage = campaign.emailTemplate
            .replace("{FirstName}", "[Test User]")
            .replace("{attachmentUrl}", "https://kat-clinic.com/test-link")

        const hasResend = process.env.RESEND_API_KEY

        if (!hasResend) {
            // Mock Mode
            await prisma.campaignSettings.update({
                where: { id: campaignId },
                data: { lastTestEmailStatus: "success (mocked)", lastTestEmailAt: new Date() }
            })
            result.email = true
        } else {
            try {
                const { sendEmail } = await import("@/lib/email");
                const emailRes = await sendEmail({
                    to: testEmail,
                    subject: `TEST: KAT Clinic (Phase: ${campaign.phaseName})`,
                    html: htmlMessage
                })
                if (emailRes.success) {
                    result.email = true
                    await prisma.campaignSettings.update({
                        where: { id: campaignId },
                        data: { lastTestEmailStatus: "success", lastTestEmailAt: new Date() }
                    })
                } else {
                    await prisma.campaignSettings.update({
                        where: { id: campaignId },
                        data: { lastTestEmailStatus: "error", lastTestEmailAt: new Date() }
                    })
                }
            } catch (emailError) {
                console.error("Test Email Error", emailError)
                await prisma.campaignSettings.update({
                    where: { id: campaignId },
                    data: { lastTestEmailStatus: "error", lastTestEmailAt: new Date() }
                })
            }
        }
    }

    revalidatePath("/admin/campaigns")
    return result
}

export async function processFeedback(id: string, action: 'approve' | 'reject') {
    await checkAdmin()
    await prisma.review.update({
        where: { id },
        data: { status: action === 'approve' ? 'approved' : 'rejected' }
    })
    revalidatePath("/admin/reputation")
}
