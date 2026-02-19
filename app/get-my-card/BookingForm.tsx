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
import { createAppointment } from "./actions"
import { toast } from "sonner"

type Question = { id: string; text: string; jsonKey: string; type: string }
type Service = { id: string; name: string; price: any; duration: number; isUpsell: boolean; description?: string }
type Clinic = { id: string; services: Service[]; schedules: any[] }

export function BookingForm({ questions, clinic }: { questions: Question[], clinic: Clinic }) {
    const [isRecording, setIsRecording] = useState(false)
    const [showUpsell, setShowUpsell] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
    const [bookingStage, setBookingStage] = useState<'intake' | 'time' | 'review'>('intake')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm({
        defaultValues: {
            answers: {},
            date: new Date(),
            timeSlot: "",
            upsellAccepted: false,
            name: "",
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

    const baseService = clinic.services.find(s => !s.isUpsell)
    const upsellService = clinic.services.find(s => s.isUpsell)

    const handleIntakeSubmit = () => {
        // Validate user details
        const { name, email, phone } = form.getValues()
        if (!name || !email || !phone) {
            toast.error("Please fill in your details")
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
        const data = {
            answers: form.getValues().answers,
            date: selectedDate,
            timeSlot: form.getValues().timeSlot,
            upsellAccepted: form.getValues().upsellAccepted,
            userDetails: {
                name: form.getValues().name,
                email: form.getValues().email,
                phone: form.getValues().phone
            },
            clinicId: clinic.id
        }

        try {
            await createAppointment(data)
            // Redirect handled in server action
        } catch (e) {
            console.error(e)
            setIsSubmitting(false)
            toast.error("Booking failed. Please try again.")
        }
    }

    const slots = ["09:00", "09:30", "10:00", "10:30", "11:00"] // Mock

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
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input {...form.register("name")} placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input {...form.register("email")} type="email" placeholder="john@example.com" />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input {...form.register("phone")} type="tel" placeholder="(555) 555-5555" />
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
                        {slots.map(time => (
                            <Button key={time} variant="outline" onClick={() => handleTimeSelect(time)}>
                                {time}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {bookingStage === 'review' && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Confirm Booking</h2>
                    <Card>
                        <CardContent className="pt-6 space-y-2">
                            <p><strong>Service:</strong> {baseService?.name} (${String(baseService?.price)})</p>
                            {form.watch("upsellAccepted") && (
                                <p className="text-green-600"><strong>+ {upsellService?.name}:</strong> ${String(upsellService?.price)}</p>
                            )}
                            <p><strong>Time:</strong> {selectedDate?.toDateString()} at {form.watch("timeSlot")}</p>
                            <p><strong>Total Duration:</strong> {baseService?.duration! + (form.watch("upsellAccepted") ? upsellService?.duration! : 0)} mins</p>
                            <p><strong>Client:</strong> {form.watch("name")}</p>
                        </CardContent>
                    </Card>
                    <Button onClick={handleFinalSubmit} disabled={isSubmitting} className="w-full h-14 text-xl bg-green-600 hover:bg-green-700">
                        {isSubmitting ? "Bookings..." : "Confirm Booking"}
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
