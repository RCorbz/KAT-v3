"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { updateClinicSettings } from "./actions"
import { Clock, DollarSign, Save } from "lucide-react"

interface Props {
    clinicId: string
    initialWaitTime: number
    initialWalkInPrice: string
    initialReservedPrice: string
}

export function ClinicSettingsManager({ clinicId, initialWaitTime, initialWalkInPrice, initialReservedPrice }: Props) {
    const [waitTime, setWaitTime] = useState(initialWaitTime)
    const [walkInPrice, setWalkInPrice] = useState(initialWalkInPrice)
    const [reservedPrice, setReservedPrice] = useState(initialReservedPrice)
    const [isUpdating, setIsUpdating] = useState(false)

    const hasChanges = waitTime !== initialWaitTime || walkInPrice !== initialWalkInPrice || reservedPrice !== initialReservedPrice

    const handleUpdate = async () => {
        setIsUpdating(true)
        const res = await updateClinicSettings(clinicId, {
            estimatedWaitMinutes: waitTime,
            walkInPrice: parseFloat(walkInPrice),
            reservedPrice: parseFloat(reservedPrice)
        })

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Settings updated successfully!")
        }
        setIsUpdating(false)
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="border-emerald-100 bg-emerald-50/10">
                <CardHeader className="pb-3">
                    <CardTitle className="text-emerald-800 text-lg flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Wait Time Monitor
                    </CardTitle>
                    <CardDescription>displayed on the landing page for walk-ins.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Input
                            type="number"
                            min="0"
                            value={waitTime}
                            onChange={(e) => setWaitTime(parseInt(e.target.value) || 0)}
                            className="text-lg font-bold w-24 text-center"
                        />
                        <span className="text-muted-foreground font-medium">Minutes</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-blue-100 bg-blue-50/10">
                <CardHeader className="pb-3">
                    <CardTitle className="text-blue-800 text-lg flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Service Pricing
                    </CardTitle>
                    <CardDescription>Dynamic price points for the two choice paths.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-blue-700 uppercase mb-1 block">Walk-In Price</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={walkInPrice}
                                    onChange={(e) => setWalkInPrice(e.target.value)}
                                    className="pl-8 font-bold text-blue-900 border-blue-200"
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-blue-700 uppercase mb-1 block">Reserved Price</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={reservedPrice}
                                    onChange={(e) => setReservedPrice(e.target.value)}
                                    className="pl-8 font-bold text-blue-900 border-blue-200"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="md:col-span-2 flex justify-end">
                <Button
                    onClick={handleUpdate}
                    disabled={isUpdating || !hasChanges}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white gap-2 px-8 py-6 h-auto text-lg font-bold shadow-xl transition-all active:scale-95"
                >
                    {isUpdating ? "Saving..." : (
                        <>
                            <Save className="w-5 h-5" />
                            Save Live Settings
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
