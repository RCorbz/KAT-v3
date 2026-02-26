import { db } from "./db/index.js";
import { services, intakeForms } from "./db/schema.js";

async function check() {
    const allServices = await db.query.services.findMany({
        with: {
            intakeForm: true
        }
    });

    console.log("Services and their attached forms:");
    allServices.forEach(s => {
        console.log(`- ${s.name}: ${s.intakeFormId ? s.intakeForm?.name : "NONE"}`);
    });

    const allForms = await db.query.intakeForms.findMany({
        with: {
            questions: true
        }
    });

    console.log("\nIntake Forms and question counts:");
    allForms.forEach(f => {
        console.log(`- ${f.name}: ${f.questions.length} questions`);
    });

    process.exit(0);
}

check();
