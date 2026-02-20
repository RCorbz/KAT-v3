import { Client } from 'pg';
import bcrypt from 'bcryptjs';

// Connection String from .env
const DATABASE_URL = "postgresql://postgres:ckFhDJefcYhBYOugNCxVTckqZvTyQOKT@hopper.proxy.rlwy.net:55522/railway";

async function main() {
    console.log("Connecting to PostgreSQL...");
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();

    const email = "admin@kat-v3.com";
    const rawPassword = "KatAdmin2026!";
    const name = "Primary Admin";

    // BetterAuth uses standard bcrypt/argon2. We'll generate a bcrypt hash.
    console.log("Generating password hash...");
    const hash = await bcrypt.hash(rawPassword, 10);

    try {
        console.log("Inserting user record...");
        const userRes = await client.query(
            `INSERT INTO "User" ("id", "name", "email", "emailVerified", "image", "createdAt", "updatedAt", "role") 
             VALUES (gen_random_uuid()::text, $1, $2, false, null, NOW(), NOW(), 'admin') 
             RETURNING id`,
            [name, email]
        );

        const userId = userRes.rows[0].id;
        console.log(`User created with ID: ${userId}`);

        console.log("Inserting account record...");
        await client.query(
            `INSERT INTO "Account" ("id", "userId", "accountId", "providerId", "accessToken", "refreshToken", "expiresAt", "password", "createdAt", "updatedAt") 
             VALUES (gen_random_uuid()::text, $1, $2, 'credential', null, null, null, $3, NOW(), NOW())`,
            [userId, email, hash]
        );

        console.log("\n=============================================");
        console.log(" ADMIN PROVISIONING COMPLETE (RAW SQL)");
        console.log("=============================================");
        console.log(` Navigate to : http://localhost:3000/sign-in`);
        console.log(` Email       : ${email}`);
        console.log(` Password    : ${rawPassword}`);
        console.log("=============================================\n");
    } catch (err) {
        if (err.code === '23505') {
            console.log("User already exists! Updating role to admin...");
            await client.query(`UPDATE "User" SET role = 'admin' WHERE email = $1`, [email]);
            console.log("Role update complete.");
        } else {
            console.error("Database Error:", err);
        }
    } finally {
        await client.end();
    }
}

main().catch(console.error);
