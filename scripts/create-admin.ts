import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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
    const updated = await prisma.user.updateMany({
        where: { email },
        data: { role: "admin" }
    });

    console.log(`Updated ${updated.count} user(s).`);
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
    .finally(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
