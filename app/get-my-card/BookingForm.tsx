"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon, Mic, Loader2 } from "lucide-react"
import { createAppointment, getAvailableSlots } from "./actions"
import { toast } from "sonner"
import { InputMask } from "@react-input/mask"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const formSchema = z.object({
    answers: z.record(z.string(), z.any()).optional(),
    date: z.date(),
    timeSlot: z.string(),
    upsellAccepted: z.boolean(),
    firstName: z.string().min(2, "First name is too short"),
    lastName: z.string().min(2, "Last name is too short"),
    email: z.string().email("Please enter a valid email address").regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/, "Please enter a valid email domain (e.g. .com)"),
    phone: z.string().min(14, "Please enter a valid phone number")
})

type Question = { id: string; text: string; jsonKey: string; type: string }
type Service = { id: string; name: string; price: any; duration: number; isUpsell: boolean; description?: string | null; type: string }
type Clinic = { id: string; services: Service[]; schedules: any[] }

export function BookingForm({ questions, clinic, initialServiceId }: { questions: Question[], clinic: Clinic, initialServiceId?: string }) {
    const [isRecording, setIsRecording] = useState(false)
    const [showUpsell, setShowUpsell] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
    const [bookingStage, setBookingStage] = useState<'intake' | 'time' | 'review'>('intake')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [isLoadingSlots, setIsLoadingSlots] = useState(false)

    const router = useRouter()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            answers: {},
            date: new Date(),
            timeSlot: "",
            upsellAccepted: false,
            firstName: "",
            lastName: "",
            email: "",
            phone: ""
        }
    })

    const startVoiceIntake = async () => {
        setIsRecording(true)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            const audioChunks: BlobPart[] = []

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data)
            }

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
                const formData = new FormData()
                formData.append("audio", audioBlob)

                const response = await fetch("/api/intake/parse", {
                    method: "POST",
                    body: formData,
                })
                const data = await response.json()

                if (data && typeof data === 'object') {
                    const currentAnswers = form.getValues().answers as Record<string, any>
                    form.setValue("answers", { ...currentAnswers, ...data })
                }
                setIsRecording(false)
            }

            mediaRecorder.start()
            setTimeout(() => mediaRecorder.stop(), 5000)
        } catch (e) {
            console.error(e)
            setIsRecording(false)
            toast.error("Voice intake failed. Please try again or type your answers.")
        }
    }

    const baseService = initialServiceId
        ? clinic.services.find(s => s.id === initialServiceId)
        : clinic.services.find(s => !s.isUpsell)
    const upsellService = clinic.services.find(s => s.isUpsell)

    useEffect(() => {
        if (selectedDate && baseService) {
            const fetchSlots = async () => {
                setIsLoadingSlots(true)
                try {
                    const slots = await getAvailableSlots(clinic.id, selectedDate, baseService.duration)
                    setAvailableSlots(slots)
                } catch (e) {
                    console.error(e)
                    toast.error("Failed to load available times")
                } finally {
                    setIsLoadingSlots(false)
                }
            }
            fetchSlots()
        }
    }, [selectedDate, clinic.id, baseService?.duration])

    const handleIntakeSubmit = async () => {
        const isValid = await form.trigger(["firstName", "lastName", "email", "phone"])
        if (!isValid) {
            toast.error("Please fill in your valid details")
            return
        }
        setBookingStage('time')
    }

    const handleTimeSelect = (time: string) => {
        form.setValue("timeSlot", time)
        if (upsellService) {
            setShowUpsell(true)
        } else {
            setBookingStage('review')
        }
    }

    const handleUpsellDecision = (accepted: boolean) => {
        form.setValue("upsellAccepted", accepted)
        setShowUpsell(false)
        setBookingStage('review')
    }

    const handleFinalSubmit = async () => {
        setIsSubmitting(true)
        const vals = form.getValues()
        const data = {
            answers: vals.answers,
            date: selectedDate,
            timeSlot: vals.timeSlot,
            upsellAccepted: vals.upsellAccepted,
            userDetails: {
                firstName: vals.firstName,
                lastName: vals.lastName,
                email: vals.email,
                phone: vals.phone
            },
            clinicId: clinic.id,
            serviceId: baseService?.id
        }

        try {
            const res = await createAppointment(data)
            if (res?.error) {
                toast.error(res.error)
                setIsSubmitting(false)
            } else if (res?.success) {
                router.push("/get-my-card/success")
            }
        } catch (e) {
            console.error(e)
            setIsSubmitting(false)
            toast.error("Booking failed. Please try again.")
        }
    }

    const slots = availableSlots

    return (
        <div className="space-y-6">
            {bookingStage === 'intake' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Medical Intake</h2>
                        <Button
                            type="button"
                            variant={isRecording ? "destructive" : "secondary"}
                            onClick={startVoiceIntake}
                            className="gap-2"
                        >
                            {isRecording ? <Loader2 className="animate-spin h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            {isRecording ? "Listening..." : "Auto-Fill with Voice"}
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {questions.map(q => (
                            <div key={q.id} className="space-y-2">
                                <Label>{q.text}</Label>
                                {q.type === 'boolean' ? (
                                    <div className="flex gap-4">
                                        <Button
                                            type="button"
                                            variant={form.watch(`answers.${q.jsonKey}` as any) === true ? "default" : "outline"}
                                            onClick={() => form.setValue(`answers.${q.jsonKey}` as any, true)}
                                        >Yes</Button>
                                        <Button
                                            type="button"
                                            variant={form.watch(`answers.${q.jsonKey}` as any) === false ? "default" : "outline"}
                                            onClick={() => form.setValue(`answers.${q.jsonKey}` as any, false)}
                                        >No</Button>
                                    </div>
                                ) : q.type === 'select' ? (
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        {...form.register(`answers.${q.jsonKey}` as any)}
                                    >
                                        <option value="">Select an option...</option>
                                        {(q as any).options?.map((opt: string) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <Input
                                        {...form.register(`answers.${q.jsonKey}` as any)}
                                        placeholder="Type or speak..."
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="font-semibold">Your Details</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input {...form.register("firstName")} placeholder="John" />
                                {form.formState.errors.firstName && <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input {...form.register("lastName")} placeholder="Doe" />
                                {form.formState.errors.lastName && <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>}
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label>Email</Label>
                                <Input {...form.register("email")} type="email" placeholder="john@example.com" />
                                {form.formState.errors.email && <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>}
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label>Phone</Label>
                                <InputMask
                                    component={Input}
                                    mask="(___) ___-____"
                                    replacement={{ _: /\d/ }}
                                    type="tel"
                                    placeholder="(555) 555-5555"
                                    {...form.register("phone")}
                                />
                                {form.formState.errors.phone && <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>}
                            </div>
                        </div>
                    </div>

                    <Button onClick={handleIntakeSubmit} className="w-full h-12 text-lg">
                        Next: Select Time
                    </Button>
                </div>
            )}

            {bookingStage === 'time' && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Select Appointment</h2>
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md border mx-auto"
                    />
                    <div className="grid grid-cols-3 gap-2">
                        {isLoadingSlots ? (
                            <div className="col-span-3 flex justify-center py-8">
                                <Loader2 className="animate-spin h-6 w-6 text-emerald-600" />
                            </div>
                        ) : slots.length > 0 ? (
                            slots.map(time => (
                                <Button key={time} variant="outline" onClick={() => handleTimeSelect(time)} className="h-12 border-emerald-100 hover:border-emerald-500 hover:bg-emerald-50">
                                    {time}
                                </Button>
                            ))
                        ) : (
                            <div className="col-span-3 text-center py-8 bg-zinc-50 rounded-lg border border-dashed">
                                <p className="text-sm text-muted-foreground">No availability found for this date.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {bookingStage === 'review' && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Confirm Booking</h2>
                    <Card className="border-blue-100 bg-blue-50/10">
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-blue-100">
                                <div>
                                    <p className="font-bold text-blue-900">{baseService?.name}</p>
                                    {baseService?.type === 'reserved' && (
                                        <p className="text-xs text-blue-600">Reserved Discount Applied</p>
                                    )}
                                </div>
                                <p className="text-xl font-black text-blue-900">${baseService?.price ? Number(baseService.price).toFixed(2).replace(/\.00$/, '') : "99"}</p>
                            </div>

                            {form.watch("upsellAccepted") && (
                                <div className="flex justify-between items-center text-emerald-700">
                                    <p className="font-semibold">+ {upsellService?.name}</p>
                                    <p className="font-bold">${String(upsellService?.price)}</p>
                                </div>
                            )}

                            <div className="space-y-1 text-sm text-zinc-600">
                                <p><strong>When:</strong> {selectedDate?.toDateString()} at {form.watch("timeSlot")}</p>
                                <p><strong>Duration:</strong> {baseService?.duration! + (form.watch("upsellAccepted") ? upsellService?.duration! : 0)} mins</p>
                                <p><strong>Driver:</strong> {form.watch("firstName")} {form.watch("lastName")}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Button onClick={handleFinalSubmit} disabled={isSubmitting} className="w-full h-14 text-xl bg-blue-600 hover:bg-blue-700 text-white font-black italic rounded-xl">
                        {isSubmitting ? "PROCESSING..." : "CONFIRM & SAVE"}
                    </Button>
                </div>
            )}

            <Dialog open={showUpsell} onOpenChange={setShowUpsell}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Driver Tune-Up Offer</DialogTitle>
                        <DialogDescription>
                            Add a {upsellService?.description} for just ${String(upsellService?.price)}?
                            This adds {upsellService?.duration} mins to your appointment.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => handleUpsellDecision(false)}>No thanks</Button>
                        <Button onClick={() => handleUpsellDecision(true)}>Yes, Add It</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
