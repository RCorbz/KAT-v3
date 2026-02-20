import { db } from "@/db"
import { campaignSettings } from "@/db/schema"
import { sql } from "drizzle-orm"

async function main() {
    console.log('Clearing old CampaignSettings...')
    try {
        await db.execute(sql`TRUNCATE TABLE ${campaignSettings} CASCADE;`)
        console.log('Cleared.')
    } catch (e) {
        console.error('Failed or table not found', e)
    }
}

main()
