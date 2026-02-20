import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: schema.users,
            account: schema.accounts,
            session: schema.sessions,
            verification: schema.verifications
        },
    }),
    emailAndPassword: {
        enabled: true,
    },
    plugins: [
        admin()
    ],
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: ["http://localhost:3000", "https://*.railway.app"]
});
