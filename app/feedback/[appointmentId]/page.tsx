import prisma from "@/lib/prisma"
import { FeedbackForm } from "@/components/FeedbackForm"
import { notFound } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function FeedbackPage({ params }: { params: { appointmentId: string } }) {
    const appointment = await prisma.appointment.findUnique({
        where: { id: params.appointmentId },
        include: { clinic: true }
    })

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
