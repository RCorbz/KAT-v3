import { db } from "@/db"
import { OperationsClient } from "./OperationsClient"

export default async function OperationsPage() {
    const rawClinics = await db.query.clinics.findMany({
        with: { services: true, schedules: true },
        orderBy: (clinics, { asc }) => [asc(clinics.name)]
    })

    const clinics = rawClinics.map(clinic => ({
        ...clinic,
        services: clinic.services.map((service: any) => ({
            ...service,
            price: Number(service.price)
        }))
    }))

    return <OperationsClient clinics={clinics} />
}
