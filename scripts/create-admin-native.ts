import "dotenv/config";
import { auth } from '../lib/auth';
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

// 1. Setup DB connection
const sql = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(sql);

async function main() {
    console.log("Updating password natively through BetterAuth to ensure hash format compatibility...");

    // The BetterAuth server object gives us access to internal API methods
    // Alternatively, we can just use auth.api.signUpEmail() if the user didn't exist, 
    // but since the user does exist, we can force a password update or just re-run signup
    // and let it overwrite.

    const email = "admin@kat-v3.com";
    const password = "KatAdmin2026!";

    // Delete existing account and user so we can cleanly recreate using BetterAuth itself
    console.log("Cleaning up old raw-SQL records...");
    await db.delete(users).where(eq(users.email, email));

    console.log("Delegating admin account creation to BetterAuth native API...");
    try {
        const res = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name: "Primary Admin"
            }
        });
        console.log("User officially created via BetterAuth engine:", res?.user?.id);
    } catch (err: any) {
        console.error("BETTER AUTH CRASHED:", err);
        const fs = await import('fs');
        fs.writeFileSync('error-log.txt', String(err) + "\n\n" + JSON.stringify(err, null, 2) + "\n\nCAUSE:\n" + String(err.cause));
        process.exit(1);
    }

    console.log("Elevating user role to 'admin'...");
    await db.update(users).set({ role: 'admin' }).where(eq(users.email, email));

    console.log("Done! You can now log in.");
}

main().catch(console.error);
