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

export async function updateCampaign(id: string, data: { triggerDays: number, smsTemplate: string, isActive: boolean }) {
    await checkAdmin()
    await prisma.campaignSettings.update({
        where: { id },
        data
    })
    revalidatePath("/admin/campaigns")
}

export async function processFeedback(id: string, action: 'approve' | 'reject') {
    await checkAdmin()
    await prisma.review.update({
        where: { id },
        data: { status: action === 'approve' ? 'approved' : 'rejected' }
    })
    revalidatePath("/admin/reputation")
}
