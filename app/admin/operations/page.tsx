import prisma from "@/lib/prisma"
import { updateService, updateSchedule } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function OperationsPage() {
    const clinics = await prisma.clinic.findMany({
        include: { services: true, schedules: true }
    })

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold">Operations</h1>

            {clinics.map(clinic => (
                <div key={clinic.id} className="space-y-6">
                    <h2 className="text-xl font-semibold">{clinic.name}</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Services */}
                        <Card>
                            <CardHeader><CardTitle>Services</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {clinic.services.map(service => (
                                    <form key={service.id} action={async (formData) => {
                                        "use server"
                                        const price = Number(formData.get("price"))
                                        const duration = Number(formData.get("duration"))
                                        await updateService(service.id, { price, duration, isActive: true })
                                    }} className="flex items-end gap-4 border-b pb-4 last:border-0">
                                        <div className="flex-1 space-y-2">
                                            <Label>{service.name}</Label>
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <Label className="text-xs">Price ($)</Label>
                                                    <Input name="price" defaultValue={String(service.price)} type="number" step="0.01" />
                                                </div>
                                                <div className="flex-1">
                                                    <Label className="text-xs">Mins</Label>
                                                    <Input name="duration" defaultValue={service.duration} type="number" />
                                                </div>
                                            </div>
                                        </div>
                                        <Button type="submit" size="sm">Save</Button>
                                    </form>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Schedules */}
                        <Card>
                            <CardHeader><CardTitle>Schedules</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {clinic.schedules.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map(schedule => (
                                    <form key={schedule.id} action={async (formData) => {
                                        "use server"
                                        const openTime = formData.get("openTime") as string
                                        const closeTime = formData.get("closeTime") as string
                                        const isActive = formData.get("isActive") === "on"
                                        await updateSchedule(schedule.id, { openTime, closeTime, isActive })
                                    }} className="flex items-center gap-4 border-b pb-4 last:border-0">
                                        <div className="w-10 font-bold">
                                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][schedule.dayOfWeek]}
                                        </div>
                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                            <Input name="openTime" defaultValue={schedule.openTime} type="time" />
                                            <Input name="closeTime" defaultValue={schedule.closeTime} type="time" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch name="isActive" defaultChecked={schedule.isActive} />
                                        </div>
                                        <Button type="submit" size="sm">Save</Button>
                                    </form>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ))}
        </div>
    )
}
