import { db } from "./db/index.js";
import { services, intakeForms } from "./db/schema.js";
import { eq } from "drizzle-orm";

async function link() {
    const form = await db.query.intakeForms.findFirst({
        where: eq(intakeForms.name, "Official Test Intake")
    });

    if (!form) {
        console.log("Official Test Intake form not found!");
        process.exit(1);
    }

    const service = await db.query.services.findFirst({
        where: eq(services.name, "DOT Physical")
    });

    if (!service) {
        console.log("DOT Physical service not found!");
        process.exit(1);
    }

    await db.update(services)
        .set({ intakeFormId: form.id })
        .where(eq(services.id, service.id));

    console.log(`Linked ${service.name} to ${form.name}`);
    process.exit(0);
}

link();
