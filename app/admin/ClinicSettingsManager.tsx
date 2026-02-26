"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { updateClinicSettings } from "./actions"
import { Clock, Save } from "lucide-react"

interface Props {
    clinicId: string
    initialWaitTime: number
}

export function ClinicSettingsManager({ clinicId, initialWaitTime }: Props) {
    const [waitTime, setWaitTime] = useState(initialWaitTime)
    const [isUpdating, setIsUpdating] = useState(false)

    const hasChanges = waitTime !== initialWaitTime

    const handleUpdate = async () => {
        setIsUpdating(true)
        const res = await updateClinicSettings(clinicId, {
            estimatedWaitMinutes: waitTime
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
            <Card className="border-emerald-100 bg-emerald-50/10 h-full">
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
                            className="text-lg font-bold w-full max-w-[120px] text-center"
                        />
                        <span className="text-muted-foreground font-medium">Minutes</span>
                    </div>
                </CardContent>
                <div className="p-6 pt-0 mt-auto flex justify-end">
                    <Button
                        onClick={handleUpdate}
                        disabled={isUpdating || !hasChanges}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white gap-2 font-bold shadow-sm transition-all active:scale-95"
                    >
                        {isUpdating ? "Saving..." : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Live Wait Time
                            </>
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    )
}

