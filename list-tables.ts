import { Pool } from "pg";
import "dotenv/config";

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
        res.rows.forEach(r => console.log("- " + r.table_name));
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

run();
