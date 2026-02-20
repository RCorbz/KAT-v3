import prisma from "@/lib/prisma"
import { OperationsClient } from "./OperationsClient"

export default async function OperationsPage() {
    const rawClinics = await prisma.clinic.findMany({
        include: { services: true, schedules: true },
        orderBy: { name: 'asc' }
    })

    const clinics = rawClinics.map(clinic => ({
        ...clinic,
        services: clinic.services.map(service => ({
            ...service,
            price: Number(service.price)
        }))
    }))

    return <OperationsClient clinics={clinics} />
}
