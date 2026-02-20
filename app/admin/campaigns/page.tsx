import prisma from "@/lib/prisma"
import { RetentionCampaignsClient } from "./RetentionCampaignsClient"

export const dynamic = 'force-dynamic'

export default async function CampaignsPage() {
    // Fetch clinics with their campaigns ordered by triggerDays descending
    const clinics = await prisma.clinic.findMany({
        where: { isActive: true },
        include: {
            campaignSettings: {
                orderBy: { triggerDays: 'desc' }
            }
        },
        orderBy: { name: 'asc' }
    })

    return <RetentionCampaignsClient clinics={clinics} />
}
