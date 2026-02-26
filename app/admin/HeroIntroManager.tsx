"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { updateHeroIntro } from "./actions"
import { Star, MapPin, ListChecks, Save } from "lucide-react"

interface HeroIntroData {
    docBio?: string
    mapUrl?: string
    servicesSummary?: string
    estYear?: string
    heroTitlePart1?: string
    heroTitlePart2?: string
}

interface Props {
    clinicId: string
    initialData: HeroIntroData
}

export function HeroIntroManager({ clinicId, initialData }: Props) {
    const [data, setData] = useState<HeroIntroData>(initialData || {})
    const [isUpdating, setIsUpdating] = useState(false)

    const hasChanges = JSON.stringify(data) !== JSON.stringify(initialData)

    const handleUpdate = async () => {
        setIsUpdating(true)
        const res = await updateHeroIntro(clinicId, data)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Hero Intro updated successfully!")
        }
        setIsUpdating(false)
    }

    return (
        <Card className="border-blue-100 bg-blue-50/10">
            <CardHeader>
                <CardTitle className="text-blue-800 text-lg flex items-center gap-2">
                    <Star className="w-5 h-5 fill-blue-500 text-blue-500" />
                    Hero Intro Section Customization
                </CardTitle>
                <CardDescription>
                    Configure the 3 mandatory templates for the homepage carousel.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Template 1: Doctor Bio */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-blue-900 flex items-center gap-2">
                        <Star className="w-4 h-4" /> Template 1: Doctor Bio
                    </label>
                    <Textarea
                        placeholder="Enter doctor bio for the hero section..."
                        value={data.docBio || ""}
                        onChange={(e) => setData({ ...data, docBio: e.target.value })}
                        className="bg-white"
                    />
                    <p className="text-[10px] text-muted-foreground italic">Overwrites the general doctor bio in the Hero Carousel only.</p>
                </div>

                {/* Template 2: Location Info */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-blue-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Template 2: Google Maps URL
                    </label>
                    <Input
                        placeholder="https://maps.google.com/..."
                        value={data.mapUrl || ""}
                        onChange={(e) => setData({ ...data, mapUrl: e.target.value })}
                        className="bg-white"
                    />
                    <p className="text-[10px] text-muted-foreground italic">Used for the SMS navigation link.</p>
                </div>

                {/* Template 3: Services Summary */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-blue-900 flex items-center gap-2" title="Mandatory as per request">
                        <ListChecks className="w-4 h-4" /> Template 3: Summary of Services
                    </label>
                    <Textarea
                        placeholder="DOT Physicals, Drug Testing, CDL Exams..."
                        value={data.servicesSummary || ""}
                        onChange={(e) => setData({ ...data, servicesSummary: e.target.value })}
                        className="bg-white"
                    />
                    <p className="text-[10px] text-muted-foreground italic">Short list or sentence summarizing what you offer.</p>
                </div>

                {/* BRANDING SECTION */}
                <div className="pt-4 border-t border-blue-200/50 space-y-4">
                    <label className="text-sm font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                        Branding Customization
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Est. Year</label>
                            <Input
                                placeholder="2024"
                                value={data.estYear || ""}
                                onChange={(e) => setData({ ...data, estYear: e.target.value })}
                                className="bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase text-blue-500">Title Accent (Blue)</label>
                            <Input
                                placeholder="TRUCKING"
                                value={data.heroTitlePart2 || ""}
                                onChange={(e) => setData({ ...data, heroTitlePart2: e.target.value })}
                                className="bg-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Title Main Part</label>
                        <Input
                            placeholder="KEEP AMERICA"
                            value={data.heroTitlePart1 || ""}
                            onChange={(e) => setData({ ...data, heroTitlePart1: e.target.value })}
                            className="bg-white"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button
                        onClick={handleUpdate}
                        disabled={isUpdating || !hasChanges}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white gap-2 font-bold shadow-sm transition-all active:scale-95"
                    >
                        {isUpdating ? "Saving..." : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Hero Intro
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
