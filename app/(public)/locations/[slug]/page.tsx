import { db } from "@/db"
import { eq } from "drizzle-orm"
import { clinics } from "@/db/schema"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Phone, CalendarClock } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function LocationPage({ params }: { params: { slug: string } }) {
    const clinicRows = await db.query.clinics.findMany({
        where: eq(clinics.slug, params.slug),
        with: { schedules: true }
    })
    const clinic = clinicRows[0]

    if (!clinic) return notFound()

    return (
        <div className="min-h-screen bg-background py-12 px-4 flex flex-col items-center">
            <h1 className="text-4xl font-bold mb-4 text-center">{clinic.name}</h1>

            <div className="flex gap-6 flex-wrap justify-center mb-12">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-5 w-5" />
                    <span>{clinic.address}, {clinic.city}, {clinic.state} {clinic.zip}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-5 w-5" />
                    <a href={`tel:${clinic.phone}`} className="hover:underline">{clinic.phone}</a>
                </div>
            </div>

            {!clinic.isActive ? (
                <Card className="max-w-md w-full border-emerald-100 bg-emerald-50/30 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-emerald-800 text-center flex flex-col items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Coming Soon
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-emerald-900/70 font-medium">
                            We are currently preparing this location to serve the local trucking community.
                        </p>
                        <div className="p-3 bg-white rounded-lg border border-emerald-100 font-bold text-emerald-600">
                            Targeting: {clinic.openDate ? new Date(clinic.openDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : 'Fall 2026'}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6 text-center">
                    <p className="text-lg">Accepting Walk-ins and Appointments.</p>
                    <Button asChild size="lg" className="h-14 text-xl px-8 bg-green-600 hover:bg-green-700">
                        <Link href={`/get-my-card?clinic=${clinic.slug}`}>
                            Book Appointment Here
                        </Link>
                    </Button>
                </div>
            )}

            {/* Schedule Display */}
            {clinic.isActive && (
                <div className="mt-12 w-full max-w-sm">
                    <h3 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2">
                        <CalendarClock className="h-5 w-5" /> Hours
                    </h3>
                    <div className="space-y-2 border rounded-lg p-4 bg-card">
                        {clinic.schedules.sort((a: any, b: any) => a.dayOfWeek - b.dayOfWeek).map((s: any) => (
                            <div key={s.id} className="flex justify-between text-sm">
                                <span className="font-medium">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][s.dayOfWeek]}</span>
                                <span>{s.isActive ? `${s.openTime} - ${s.closeTime}` : 'Closed'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
