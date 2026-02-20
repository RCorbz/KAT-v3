import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('Clearing old CampaignSettings...')
    try {
        await prisma.$executeRaw`TRUNCATE TABLE "CampaignSettings" CASCADE;`
        console.log('Cleared.')
    } catch (e) {
        console.error('Failed or table not found', e)
    }
}

main().finally(() => prisma.$disconnect())
