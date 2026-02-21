import { db } from "@/db"
import { intakeQuestions } from "@/db/schema"
import { FormBuilderClient } from "./FormBuilderClient"

export default async function FormBuilderPage() {
    const questions = await db.query.intakeQuestions.findMany({
        orderBy: (intakeQuestions, { asc }) => [asc(intakeQuestions.order)]
    })

    return <FormBuilderClient questions={questions} />
}
