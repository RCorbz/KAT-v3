require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    await client.connect();
    try {
        await client.query('TRUNCATE TABLE "CampaignSettings" CASCADE;');
        console.log("Truncated CampaignSettings");
    } catch (e) {
        console.log("Error:", e.message);
    } finally {
        await client.end();
    }
}
run();
