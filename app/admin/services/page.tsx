import { db } from "@/db"
import { eq } from "drizzle-orm"
import { clinics, services, intakeForms } from "@/db/schema"
import { ServicesManager } from "../ServicesManager"

export const dynamic = 'force-dynamic'

export default async function ServicesPage() {
    const headquarterClinic = await db.query.clinics.findFirst({
        where: eq(clinics.slug, "weatherford-tx")
    })

    let allServices: any[] = []
    let allForms: any[] = []
    if (headquarterClinic) {
        allServices = await db.query.services.findMany({
            where: eq(services.clinicId, headquarterClinic.id),
            orderBy: (services: any, { asc }: any) => [asc(services.order)]
        })
        allForms = await db.query.intakeForms.findMany({
            where: eq(intakeForms.clinicId, headquarterClinic.id),
        })
    }

    if (!headquarterClinic) {
        return <div className="p-8">Clinic not found.</div>
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Service Management</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your service offerings, pricing, and durations. Services marked "Show on Homepage" will appear dynamically on the primary booking funnel.
                </p>
            </div>

            <ServicesManager
                clinicId={headquarterClinic.id}
                initialServices={allServices}
                forms={allForms}
            />
        </div>
    )
}
