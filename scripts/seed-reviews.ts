import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { reviews } from '../db/schema';
import crypto from "crypto";

// Setup DB connection
const sql = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(sql);

async function main() {
    console.log("Seeding mock reviews for reputation triage...");

    const mockReviews = [
        {
            id: crypto.randomUUID(),
            reviewerName: "John Doe",
            rating: 5,
            feedbackText: "Amazing experience! The clinic was fast and the doctor was very professional. Highly recommend their DOT physicals.",
            status: "pending",
        },
        {
            id: crypto.randomUUID(),
            reviewerName: "Alice Smith",
            rating: 5,
            feedbackText: "Super quick and easy. I was in and out in 20 minutes.",
            status: "pending",
        },
        {
            id: crypto.randomUUID(),
            reviewerName: "Bob Johnson",
            rating: 2,
            feedbackText: "The waiting time was terrible. I had an appointment at 2 PM but didn't get seen until 3 PM. Unacceptable for a trucker on a tight schedule.",
            status: "pending",
        },
        {
            id: crypto.randomUUID(),
            reviewerName: "Carol White",
            rating: 2,
            feedbackText: "Doctor was rude and the front desk didn't know what they were doing. Never coming back here.",
            status: "pending",
        }
    ];

    await db.insert(reviews).values(mockReviews);

    console.log("Reviews seeded successfully!");
}

main().catch(console.error).finally(() => process.exit(0));
