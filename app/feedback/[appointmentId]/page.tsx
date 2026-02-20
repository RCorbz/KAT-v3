import { db } from "@/db"
import { eq } from "drizzle-orm"
import { appointments } from "@/db/schema"
import { FeedbackForm } from "@/components/FeedbackForm"
import { notFound } from "next/navigation"

export const dynamic = 'force-dynamic'
export function generateStaticParams() { return []; }

export default async function FeedbackPage({ params }: { params: Promise<{ appointmentId: string }> | { appointmentId: string } }) {
    // Next.js 15+ evaluates params as a Promise, await resolving it guarantees no undefined properties
    const resolvedParams = await params
    if (!resolvedParams?.appointmentId) return notFound()

    const appointmentRows = await db.query.appointments.findMany({
        where: eq(appointments.id, resolvedParams.appointmentId),
        with: { clinic: true }
    })
    const appointment = appointmentRows[0]

    if (!appointment) return notFound()

    // Fallback if not set in DB
    const googleReviewUrl = appointment.clinic.googleReviewUrl || "https://google.com/maps"

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
            <FeedbackForm
                appointmentId={appointment.id}
                googleReviewUrl={googleReviewUrl}
            />
        </div>
    )
}
