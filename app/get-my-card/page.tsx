import prisma from "@/lib/prisma"
import { BookingForm } from "./BookingForm"
import { notFound } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function GetMyCardPage({ searchParams }: { searchParams: Promise<{ clinic?: string }> | { clinic?: string } }) {
    const resolvedParams = await searchParams
    const clinicSlug = resolvedParams?.clinic || "weatherford-tx" // Default to seed HQ

    // Fetch active intake questions
    const questions = await prisma.intakeQuestion.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
    })

    const clinic = await prisma.clinic.findUnique({
        where: { slug: clinicSlug },
        include: {
            schedules: true,
            services: true
        }
    })

    // If clinic doesn't exist or isn't active (unless user is admin? No, public flow)
    // Prompt: "SLC ... completely disable the booking flow"
    if (!clinic) return notFound()

    // If inactive, maybe redirect to location page which shows "Coming Soon"?
    // Or show "Coming Soon" here.
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
                />
            </main>
        </div>
    )
}
