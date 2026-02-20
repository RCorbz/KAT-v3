import { Pool } from "pg";
import "dotenv/config";
import { db } from "./db";
import { intakeQuestions } from "./db/schema";
import { eq } from "drizzle-orm";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log("Tables in public schema:");
        console.log(JSON.stringify(res.rows.map(r => r.table_name), null, 2));

        console.log("Testing Drizzle directly...");
        const questions = await db.select().from(intakeQuestions).limit(1);
        console.log("Drizzle success!");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
        process.exit();
    }
}

run();
