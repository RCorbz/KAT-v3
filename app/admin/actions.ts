"use server"

import { db } from "@/db"
import { eq, desc, and, gte, lte } from "drizzle-orm"
import { services, clinicSchedules, clinics, campaignSettings, reviews, appointments, intakeQuestions } from "@/db/schema"
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
    await db.update(services).set({
        price: data.price.toString(),
        duration: data.duration,
    }).where(eq(services.id, id))
    revalidatePath("/admin/operations")
}

export async function updateSchedule(id: string, data: { openTime: string, closeTime: string, isActive: boolean }) {
    await checkAdmin()
    await db.update(clinicSchedules).set(data).where(eq(clinicSchedules.id, id))
    revalidatePath("/admin/operations")
}

export async function createClinic(data: { name: string, address: string, city: string, state: string, zip: string, phone: string }) {
    await checkAdmin()
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    await db.insert(clinics).values({
        id: crypto.randomUUID(),
        ...data,
        slug,
        isActive: true
    })
    revalidatePath("/admin/operations")
}

export async function updateClinic(id: string, data: { name: string, address: string, city: string, state: string, zip: string, phone: string, isActive: boolean }) {
    await checkAdmin()
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    await db.update(clinics).set({
        ...data,
        slug
    }).where(eq(clinics.id, id))
    revalidatePath("/admin/operations")
}

export async function updateClinicDoctorInfo(id: string, data: { doctorName?: string, doctorPicUrl?: string, doctorBio?: string, doctorPhone?: string, doctorEmail?: string, doctorType?: string, additionalInfo?: string }) {
    await checkAdmin()

    let parsedAdditionalInfo = undefined
    if (data.additionalInfo) {
        try {
            parsedAdditionalInfo = JSON.parse(data.additionalInfo)
        } catch (e) {
            console.error("Failed to parse additionalInfo JSON", e)
        }
    }

    await db.update(clinics).set({
        doctorName: data.doctorName,
        doctorPicUrl: data.doctorPicUrl,
        doctorBio: data.doctorBio,
        doctorPhone: data.doctorPhone,
        doctorEmail: data.doctorEmail,
        doctorType: data.doctorType,
        ...(parsedAdditionalInfo !== undefined && { additionalInfo: parsedAdditionalInfo })
    }).where(eq(clinics.id, id))
    revalidatePath("/admin/operations")
}

export async function createService(data: { clinicId: string, name: string, price: number, duration: number, isUpsell: boolean }) {
    await checkAdmin()
    await db.insert(services).values({
        id: crypto.randomUUID(),
        clinicId: data.clinicId,
        name: data.name,
        price: data.price.toString(),
        duration: data.duration,
        isUpsell: data.isUpsell
    })
    revalidatePath("/admin/operations")
}

export async function deleteService(id: string) {
    await checkAdmin()
    await db.delete(services).where(eq(services.id, id))
    revalidatePath("/admin/operations")
}

export async function createSchedule(data: { clinicId: string, dayOfWeek: number, openTime: string, closeTime: string }) {
    await checkAdmin()
    await db.insert(clinicSchedules).values({
        id: crypto.randomUUID(),
        ...data,
        isActive: true
    })
    revalidatePath("/admin/operations")
}

export async function deleteSchedule(id: string) {
    await checkAdmin()
    await db.delete(clinicSchedules).where(eq(clinicSchedules.id, id))
    revalidatePath("/admin/operations")
}

export async function upsertCampaignSetting(clinicId: string, data: { id?: string, phaseName: string, triggerDays: number, smsTemplate: string, emailTemplate: string, sendSms: boolean, sendEmail: boolean, isActive: boolean }) {
    await checkAdmin()
    if (data.id) {
        await db.update(campaignSettings).set({
            triggerDays: data.triggerDays,
            smsTemplate: data.smsTemplate,
            emailTemplate: data.emailTemplate,
            sendSms: data.sendSms,
            sendEmail: data.sendEmail,
            isActive: data.isActive
        }).where(eq(campaignSettings.id, data.id))
    } else {
        await db.insert(campaignSettings).values({
            id: crypto.randomUUID(),
            clinicId,
            phaseName: data.phaseName,
            triggerDays: data.triggerDays,
            smsTemplate: data.smsTemplate,
            emailTemplate: data.emailTemplate,
            sendSms: data.sendSms,
            sendEmail: data.sendEmail,
            isActive: data.isActive
        }).onConflictDoUpdate({
            target: [campaignSettings.clinicId, campaignSettings.phaseName],
            set: {
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
    await db.delete(campaignSettings).where(eq(campaignSettings.id, id))
    revalidatePath("/admin/campaigns")
}

export async function testCampaignPhase(campaignId: string, testPhone: string, testEmail: string) {
    await checkAdmin()
    const campaigns = await db.select().from(campaignSettings).where(eq(campaignSettings.id, campaignId))
    const campaign = campaigns[0]

    if (!campaign) throw new Error("Campaign not found")

    let result = { sms: false, email: false }
    const { CommunicationService } = await import("@/lib/communication");

    if (testPhone) {
        const message = campaign.smsTemplate
            .replace("{FirstName}", "[Test User]")
            .replace("{attachmentUrl}", "https://kat-clinic.com/test-link")

        try {
            const res = await CommunicationService.sendSms({
                to: testPhone,
                body: message,
                clinicId: campaign.clinicId
            });

            const status = res.mock ? "success (mocked)" : "success";
            await db.update(campaignSettings).set({ lastTestSmsStatus: status, lastTestSmsAt: new Date() }).where(eq(campaignSettings.id, campaignId))
            result.sms = true

        } catch (smsError) {
            console.error("Test SMS Error", smsError)
            await db.update(campaignSettings).set({ lastTestSmsStatus: "error", lastTestSmsAt: new Date() }).where(eq(campaignSettings.id, campaignId))
        }
    }

    if (testEmail) {
        const htmlMessage = campaign.emailTemplate
            .replace("{FirstName}", "[Test User]")
            .replace("{attachmentUrl}", "https://kat-clinic.com/test-link")

        try {
            const emailRes = await CommunicationService.sendEmail({
                to: testEmail,
                subject: `TEST: KAT Clinic (Phase: ${campaign.phaseName})`,
                html: htmlMessage,
                clinicId: campaign.clinicId
            })

            const status = emailRes.mock ? "success (mocked)" : "success";
            await db.update(campaignSettings).set({ lastTestEmailStatus: status, lastTestEmailAt: new Date() }).where(eq(campaignSettings.id, campaignId))
            result.email = true

        } catch (emailError) {
            console.error("Test Email Error", emailError)
            await db.update(campaignSettings).set({ lastTestEmailStatus: "error", lastTestEmailAt: new Date() }).where(eq(campaignSettings.id, campaignId))
        }
    }

    revalidatePath("/admin/campaigns")
    return result
}

export async function processFeedback(id: string, action: 'approve' | 'reject') {
    await checkAdmin()
    await db.update(reviews).set({ status: action === 'approve' ? 'approved' : 'rejected' }).where(eq(reviews.id, id))
    revalidatePath("/admin/reputation")
}

/* Intake Question CRUD */
export async function createIntakeQuestion(data: { text: string, jsonKey: string, type: string, order?: number }) {
    await checkAdmin();
    await db.insert(intakeQuestions).values({
        id: crypto.randomUUID(),
        ...data,
        isActive: true
    });
    revalidatePath("/admin/form-builder");
    revalidatePath("/get-my-card");
}

export async function updateIntakeQuestion(id: string, data: Partial<{ text: string, jsonKey: string, type: string, order: number, isActive: boolean }>) {
    await checkAdmin();
    await db.update(intakeQuestions).set(data).where(eq(intakeQuestions.id, id));
    revalidatePath("/admin/form-builder");
    revalidatePath("/get-my-card");
}

export async function deleteIntakeQuestion(id: string) {
    await checkAdmin();
    await db.delete(intakeQuestions).where(eq(intakeQuestions.id, id));
    revalidatePath("/admin/form-builder");
    revalidatePath("/get-my-card");
}

export async function autoTagReview(id: string, text: string) {
    await checkAdmin();
    if (!text || text.trim().length === 0) return;
    try {
        const { model } = await import("@/lib/vertex");
        const prompt = `Analyze the following customer review and categorize the primary sentiment or reason into a single 1-2 word phrase (e.g., "Wait Time", "Staff", "Speed", "Professionalism", "Pricing"). If it's a mix, pick the most dominant one. Do not output anything else but the category phrase.\n\nReview: "${text}"`;
        const res = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
        const theme = res.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().replace(/['"]/g, '');
        if (theme) {
            await db.update(reviews).set({ aiTheme: theme }).where(eq(reviews.id, id));
        }
    } catch (e) {
        console.error("Failed to auto-tag review:", e);
    }
}

