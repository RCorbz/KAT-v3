import { db } from "@/db"
import { intakeQuestions, intakeForms, clinics } from "@/db/schema"
import { FormBuilderClient } from "./FormBuilderClient"
import { eq } from "drizzle-orm"

export default async function FormBuilderPage({ searchParams }: { searchParams: Promise<{ formId?: string }> }) {
    const { formId } = await searchParams;

    const headquarterClinic = await db.query.clinics.findFirst({
        where: eq(clinics.slug, "weatherford-tx")
    })

    if (!headquarterClinic) {
        return <div className="p-8">Clinic not found.</div>
    }

    const forms = await db.query.intakeForms.findMany({
        where: eq(intakeForms.clinicId, headquarterClinic.id)
    });

    if (formId) {
        const questions = await db.query.intakeQuestions.findMany({
            where: eq(intakeQuestions.formId, formId),
            orderBy: (intakeQuestions, { asc }) => [asc(intakeQuestions.order)]
        });
        const activeForm = forms.find(f => f.id === formId);
        return <FormBuilderClient questions={questions} forms={forms} activeFormId={formId} activeForm={activeForm} clinicId={headquarterClinic.id} />
    }

    return <FormBuilderClient questions={[]} forms={forms} clinicId={headquarterClinic.id} />
}
