"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Save, GripVertical } from "lucide-react"
import { createService, updateService, deleteService } from "./actions"
import { toast } from "sonner"

type Service = {
    id: string
    clinicId: string
    name: string
    description: string | null
    price: string
    duration: number
    isUpsell: boolean
    showOnHomepage: boolean
    order: number
    type: string
}

export function ServicesManager({ clinicId, initialServices }: { clinicId: string; initialServices: Service[] }) {
    const [services, setServices] = useState<Service[]>(initialServices.sort((a, b) => a.order - b.order))
    const [isSaving, setIsSaving] = useState(false)

    const handleCreate = async () => {
        setIsSaving(true)
        try {
            await createService({
                clinicId,
                name: "New Service",
                price: 0,
                duration: 15,
                isUpsell: false,
                showOnHomepage: true,
                order: services.length,
                type: 'walkin'
            })
            toast.success("Service created")
            // In a real app we'd refresh the data here, or let the server action revalidatePath handle it if wrapped in a transition.
            // For immediate local feedback, reloading is safest if not using transitions.
            window.location.reload()
        } catch (e) {
            toast.error("Failed to create service")
        } finally {
            setIsSaving(false)
        }
    }

    const handleUpdate = async (id: string, updates: Partial<Service>) => {
        // Optimistic UI update
        setServices(current => current.map(s => s.id === id ? { ...s, ...updates } : s))

        try {
            await updateService(id, {
                ...updates,
                description: updates.description === null ? undefined : updates.description,
                price: updates.price ? parseFloat(updates.price) : undefined
            })
            // Rely on revalidatePath
        } catch (e) {
            toast.error("Failed to update service")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this service?")) return
        setIsSaving(true)
        try {
            await deleteService(id)
            setServices(current => current.filter(s => s.id !== id))
            toast.success("Service deleted")
        } catch (e) {
            toast.error("Failed to delete service")
        } finally {
            setIsSaving(false)
        }
    }

    // Split services for UI clarity
    const mainServices = services.filter(s => !s.isUpsell).sort((a, b) => a.order - b.order)
    const addonServices = services.filter(s => s.isUpsell).sort((a, b) => a.order - b.order)

    const renderServiceRow = (s: Service) => (
        <div key={s.id} className="flex flex-col gap-4 p-4 mb-4 bg-white border rounded-lg shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                    {/* Column 1: Core Details */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-zinc-500">Service Name</label>
                            <Input
                                value={s.name}
                                onChange={(e) => handleUpdate(s.id, { name: e.target.value })}
                                placeholder="e.g. DOT Physical"
                                className="font-bold"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-zinc-700">Add-on (Upsell)</label>
                            <Switch checked={s.isUpsell} onCheckedChange={(c) => handleUpdate(s.id, { isUpsell: c })} />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-zinc-700">Show on Homepage</label>
                            <Switch checked={s.showOnHomepage} onCheckedChange={(c) => handleUpdate(s.id, { showOnHomepage: c })} />
                        </div>
                    </div>

                    {/* Column 2: Pricing & Timing */}
                    <div className="space-y-4 lg:col-span-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-zinc-500">Price ($)</label>
                                <Input
                                    type="number"
                                    value={s.price}
                                    onChange={(e) => handleUpdate(s.id, { price: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-zinc-500">Duration (Mins)</label>
                                <Input
                                    type="number"
                                    value={s.duration}
                                    onChange={(e) => handleUpdate(s.id, { duration: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-zinc-500">Homepage Description (Marketing Hook)</label>
                            <Textarea
                                value={s.description || ""}
                                onChange={(e) => handleUpdate(s.id, { description: e.target.value })}
                                placeholder="e.g. Requires ~30 mins + $125. Walk-in anytime."
                                className="h-20 resize-none"
                            />
                        </div>
                    </div>

                    {/* Column 3: Routing & Display Order */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-zinc-500">CTA Flow Type</label>
                            <Select value={s.type} onValueChange={(val) => handleUpdate(s.id, { type: val })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="walkin">Walk-in (Call Modal)</SelectItem>
                                    <SelectItem value="reserved">Reserved (Form UI)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-zinc-500">Sort Order</label>
                            <Input
                                type="number"
                                value={s.order || 0}
                                onChange={(e) => handleUpdate(s.id, { order: parseInt(e.target.value) || 0 })}
                            />
                            <p className="text-[10px] text-zinc-400 mt-1">Lower numbers appear first.</p>
                        </div>
                    </div>

                </div>

                {/* Actions */}
                <div className="flex shrink-0">
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    )

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Homepage Services & Add-ons</CardTitle>
                    <CardDescription>Manage the active services displayed on the homepage funnel.</CardDescription>
                </div>
                <Button onClick={handleCreate} disabled={isSaving} className="bg-zinc-900 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    <div>
                        <h3 className="text-lg font-bold mb-4 border-b pb-2">Main Funnel Services</h3>
                        {mainServices.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 bg-zinc-50 rounded-lg border border-dashed">No main services configured.</div>
                        ) : (
                            <div className="space-y-4">
                                {mainServices.map(renderServiceRow)}
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="text-lg font-bold mb-4 border-b pb-2 mt-8">Add-on Services (Carousel)</h3>
                        {addonServices.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 bg-zinc-50 rounded-lg border border-dashed">No add-on services configured.</div>
                        ) : (
                            <div className="space-y-4">
                                {addonServices.map(renderServiceRow)}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
