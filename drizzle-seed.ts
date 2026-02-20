import "dotenv/config";
import { db } from "./db";
import { clinics, services, intakeQuestions } from "./db/schema";

async function seed() {
    console.log("Seeding database with default Drizzle data...");

    const clinicId = "seed-clinic-weatherford";
    await db.insert(clinics).values({
        id: clinicId,
        slug: "weatherford-tx",
        name: "KAT Clinic Weatherford HQ",
        address: "123 Trucker Way",
        city: "Weatherford",
        state: "TX",
        zip: "76086",
        phone: "888-555-1234",
        isActive: true,
        doctorName: "Dr. Ben",
        doctorEmail: "ben@kat-clinic.com"
    }).onConflictDoNothing();

    console.log("Seeded Weatherford clinic.");

    await db.insert(services).values({
        id: "seed-service-dot",
        clinicId: clinicId,
        name: "DOT Physical",
        price: '85.00',
        duration: 30,
        isUpsell: false
    }).onConflictDoNothing();

    console.log("Seeded DOT Physical service.");

    await db.insert(intakeQuestions).values({
        id: "seed-question-1",
        text: "What is your CDL number?",
        jsonKey: "cdl_number",
        type: "text",
        isActive: true,
        order: 1
    }).onConflictDoNothing();

    console.log("Seeded basic intake question.");

    console.log("Seed complete! The 404 error should now be resolved.");
    process.exit(0);
}

seed().catch(e => {
    console.error("Seed failed:", e);
    process.exit(1);
});
