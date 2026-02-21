"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { initiateWalkIn } from "@/app/actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { InputMask } from "@react-input/mask"

export function ClientCTAs({ clinicId, doctorName }: { clinicId: string, doctorName: string | null }) {
    const [isOpen, setIsOpen] = useState(false)
    const [phone, setPhone] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        const cleanPhone = phone.replace(/\D/g, "")
        if (cleanPhone.length < 10) {
            toast.error("Please enter a valid phone number")
            return
        }

        setIsSubmitting(true)
        const res = await initiateWalkIn(phone, clinicId)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("See you soon! We've sent you a confirmation text.")
            setIsOpen(false)
            setPhone("")
        }
        setIsSubmitting(false)
    }

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black italic rounded-xl h-12 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
                TELL DOC I'M COMING TODAY
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic">CALL AHEAD</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Enter your phone number to let {doctorName || "the doctor"} know you're on the way. We'll send you a confirmation text.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <InputMask
                            mask="(___) ___-____"
                            replacement={{ _: /\d/ }}
                            value={phone}
                            onChange={(e: any) => setPhone(e.target.value)}
                            component={Input}
                            placeholder="(555) 000-0000"
                            className="bg-zinc-900 border-zinc-800 text-white font-bold text-lg h-14"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 font-black italic text-lg"
                        >
                            {isSubmitting ? "SENDING..." : "CONFIRM WALK-IN"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
