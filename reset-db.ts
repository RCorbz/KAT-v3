import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    console.log("Dropping public schema to reset from Prisma to Drizzle...");
    await pool.query("DROP SCHEMA public CASCADE;");
    await pool.query("CREATE SCHEMA public;");
    console.log("Schema reset successfully.");
    await pool.end();
}

run();
