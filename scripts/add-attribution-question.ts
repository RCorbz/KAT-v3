import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { intakeQuestions } from '../db/schema';
import crypto from "crypto";
import { eq } from "drizzle-orm";

// Setup DB connection
const sql = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(sql);

async function main() {
    console.log("Seeding attribution intake question...");

    const existing = await db.select().from(intakeQuestions).where(eq(intakeQuestions.jsonKey, "howDidYouHear"));
    if (existing.length > 0) {
        console.log("Question already exists. Skipping.");
        return;
    }

    await db.insert(intakeQuestions).values({
        id: crypto.randomUUID(),
        text: "How did you hear about us?",
        jsonKey: "howDidYouHear",
        type: "select",
        isActive: true,
        order: 99,
    });

    console.log("Attribution question seeded successfully!");
}

main().catch(console.error).finally(() => process.exit(0));
