import { Client } from 'pg';

const DATABASE_URL = "postgresql://postgres:ckFhDJefcYhBYOugNCxVTckqZvTyQOKT@hopper.proxy.rlwy.net:55522/railway";

async function main() {
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();

    try {
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log("Tables in database:");
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
main();
