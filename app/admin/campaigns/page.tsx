import { db } from "@/db"
import { eq } from "drizzle-orm"
import { clinics } from "@/db/schema"
import { RetentionCampaignsClient } from "./RetentionCampaignsClient"

export const dynamic = 'force-dynamic'

export default async function CampaignsPage() {
    // Fetch clinics with their campaigns ordered by triggerDays descending
    const dbClinics = await db.query.clinics.findMany({
        where: eq(clinics.isActive, true),
        with: {
            campaignSettings: {
                orderBy: (campaignSettings, { desc }) => [desc(campaignSettings.triggerDays)]
            }
        },
        orderBy: (clinics, { asc }) => [asc(clinics.name)]
    })

    return <RetentionCampaignsClient clinics={dbClinics} />
}
