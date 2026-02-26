import { db } from "@/db"
import { eq, and } from "drizzle-orm"
import { intakeQuestions, clinics, clinicSchedules, services } from "@/db/schema"
import { BookingForm } from "./BookingForm"
import { notFound } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function GetMyCardPage({ searchParams }: { searchParams: Promise<{ clinic?: string, serviceId?: string }> | { clinic?: string, serviceId?: string } }) {
    const resolvedParams = await searchParams
    const clinicSlug = resolvedParams?.clinic || "weatherford-tx" // Default to seed HQ
    const serviceId = resolvedParams?.serviceId

    const clinicRow = await db.query.clinics.findFirst({
        where: eq(clinics.slug, clinicSlug),
        with: {
            schedules: true,
            services: true
        }
    })
    const clinic = clinicRow

    // Find the current service if serviceId is provided, or default to the first "reserved" service
    const currentService = serviceId
        ? clinic?.services.find(s => s.id === serviceId)
        : clinic?.services.find(s => s.type === 'reserved')

    let questions: any[] = []

    if (currentService?.intakeFormId) {
        questions = await db.query.intakeQuestions.findMany({
            where: and(
                eq(intakeQuestions.formId, currentService.intakeFormId),
                eq(intakeQuestions.isActive, true)
            ),
            orderBy: (intakeQuestions, { asc }) => [asc(intakeQuestions.order)],
        })
    } else {
        // Fallback: fetch all active questions if no form is attached
        questions = await db.query.intakeQuestions.findMany({
            where: eq(intakeQuestions.isActive, true),
            orderBy: (intakeQuestions, { asc }) => [asc(intakeQuestions.order)],
        })
    }

    // If clinic doesn't exist or isn't active (unless user is admin? No, public flow)
    if (!clinic) return notFound()

    if (!clinic.isActive) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <h1 className="text-2xl font-bold mb-2">Location Not Open Yet</h1>
                <p>The {clinic.name} location is opening soon.</p>
            </div>
        )
    }

    const serializedClinic = {
        ...clinic,
        services: clinic.services.map(s => ({
            ...s,
            price: Number(s.price)
        }))
    }

    return (
        <div className="flex flex-col min-h-screen bg-background pb-20"> {/* pb-20 for bottom nav */}
            <header className="p-4 border-b bg-background sticky top-0 z-10">
                <h1 className="text-xl font-bold">Get My Card</h1>
                <p className="text-sm text-muted-foreground">{clinic.name}</p>
            </header>

            <main className="flex-1 p-4">
                <BookingForm
                    questions={questions}
                    clinic={serializedClinic}
                    initialServiceId={currentService?.id}
                />
            </main>
        </div>
    )
}
