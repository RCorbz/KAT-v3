import { db } from "./db/index";
import { clinics } from "./db/schema";
import { eq } from "drizzle-orm";

async function check() {
    const clinic = await db.query.clinics.findFirst({
        where: eq(clinics.slug, "weatherford-tx")
    });

    if (clinic) {
        console.log("Clinic Found:", clinic.name);
        console.log("Hero Intro:", JSON.stringify(clinic.heroIntro, null, 2));
    } else {
        console.log("Clinic not found");
    }
    process.exit(0);
}

check();
