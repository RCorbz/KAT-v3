const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        const res = await pool.query("SELECT id, name, slug, \"heroIntro\" FROM clinic");
        console.log(`Found ${res.rows.length} clinics:`);
        res.rows.forEach(r => {
            console.log(`- ID: ${r.id}, Name: ${r.name}, Slug: ${r.slug}`);
            console.log(`  Hero Intro: ${JSON.stringify(r.heroIntro, null, 2)}`);
        });
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

run();
