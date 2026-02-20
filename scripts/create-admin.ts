import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
    const email = "admin@kat-v3.com";
    const password = "KatAdmin2026!";
    const name = "Primary Admin";

    console.log(`Sending signup request to Local BetterAuth API...`);
    const res = await fetch("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name })
    });

    if (!res.ok) {
        const errorText = await res.text();
        if (errorText.includes("already exists") || errorText.includes("USER_ALREADY_EXISTS")) {
            console.log(`User ${email} already exists. Proceeding to update role.`);
        } else {
            console.error("Failed to create user:", errorText);
            process.exit(1);
        }
    } else {
        console.log("User created successfully via BetterAuth.");
    }

    // Update their role to "admin" 
    console.log(`Setting role field to "admin" within the database...`);
    const resultSet = await db.update(users)
        .set({ role: "admin" })
        .where(eq(users.email, email))
        .returning();

    console.log(`Updated ${resultSet.length} user(s).`);
    console.log("\n=============================================");
    console.log(" ADMIN PROVISIONING COMPLETE");
    console.log("=============================================");
    console.log(` Navigate to : http://localhost:3000/sign-in`);
    console.log(` Email       : ${email}`);
    console.log(` Password    : ${password}`);
    console.log("=============================================\n");
}

main()
    .catch(console.error)
    .finally(() => {
        process.exit(0);
    });
