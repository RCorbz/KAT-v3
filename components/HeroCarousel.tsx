"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, MessageSquare, ListChecks } from "lucide-react"

interface HeroCarouselProps {
    doctorName: string | null
    doctorBio: string | null
    doctorPicUrl: string | null
    heroIntro?: {
        docBio?: string
        mapUrl?: string
        servicesSummary?: string
    } | null
    clinicAddress?: string
    clinicPhone?: string
}

export function HeroCarousel({
    doctorName,
    doctorBio,
    doctorPicUrl,
    heroIntro,
    clinicAddress,
    clinicPhone
}: HeroCarouselProps) {
    const [index, setIndex] = useState(0)

    // Mandatory Templates mapping
    const slides = [
        { type: "template1" }, // Doctor Bio
        { type: "template2" }, // Location Info & SMS
        { type: "template3" }  // Summary of Services
    ]

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % slides.length)
        }, 5000) // Slightly longer to allow reading content
        return () => clearInterval(timer)
    }, [slides.length])

    const slideVariants: any = {
        initial: { x: "100%", opacity: 0 },
        animate: {
            x: 0,
            opacity: 1,
            transition: {
                duration: 0.8,
                ease: "easeOut"
            }
        },
        exit: {
            x: "-100%",
            opacity: 0,
            transition: {
                duration: 0.8,
                ease: "easeIn"
            }
        }
    }

    // Prepare content
    const bioToUse = heroIntro?.docBio || doctorBio || "Certified Medical Examiner ensuring you stay on the road Safely."
    const servicesToUse = heroIntro?.servicesSummary || "DOT Physicals • Drug Testing • CDL Medical Exams • Sleep Apnea Screening"
    const mapToUse = heroIntro?.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicAddress || "")}`

    // SMS Link Construction: sms:phone?body=message
    const smsMessage = `I need help navigating to the clinic. Can you send me the map link? Here it is for reference: ${mapToUse}`
    const smsLink = `sms:${clinicPhone || ""}?body=${encodeURIComponent(smsMessage)}`

    return (
        <div className="relative h-56 w-full flex items-center justify-center overflow-hidden bg-zinc-900/40 rounded-3xl border border-zinc-800/50">
            <AnimatePresence mode="wait">
                {/* TEMPLATE 1: DOCTOR INFO (50/50 SPLIT) */}
                {index === 0 && (
                    <motion.div
                        key="template1"
                        variants={slideVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="absolute inset-0 flex items-center justify-center px-4"
                    >
                        <div className="flex bg-zinc-950/40 backdrop-blur-md rounded-2xl border border-emerald-500/20 shadow-2xl w-full max-w-[360px] overflow-hidden min-h-[160px]">
                            {/* Left Half: Doctor Pic - DOMINANT FACE */}
                            <div className="w-1/2 relative bg-zinc-800 border-r border-emerald-500/10">
                                {doctorPicUrl ? (
                                    <img
                                        src={doctorPicUrl}
                                        alt={doctorName || "Doctor"}
                                        className="absolute inset-0 w-full h-full object-cover object-top"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-4xl text-zinc-600 uppercase">
                                        {doctorName?.charAt(0) || "D"}
                                    </div>
                                )}
                                {/* Subtle Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-950/20" />
                            </div>

                            {/* Right Half: Text Info */}
                            <div className="w-1/2 p-4 flex flex-col justify-center">
                                <h2 className="text-lg font-black text-white leading-tight mb-2 truncate">
                                    {doctorName || "Dr. Ben"}
                                </h2>
                                <p className="text-[12px] text-zinc-300 line-clamp-4 leading-relaxed italic">
                                    "{bioToUse}"
                                </p>
                                <div className="mt-3 flex items-center gap-2">
                                    <div className="h-px flex-1 bg-emerald-500/30"></div>
                                    <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest whitespace-nowrap">
                                        Medical Examiner
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* TEMPLATE 2: LOCATION & SMS */}
                {index === 1 && (
                    <motion.div
                        key="template2"
                        variants={slideVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="absolute inset-0 flex flex-col items-center justify-center px-6"
                    >
                        <div className="bg-zinc-950/40 backdrop-blur-md p-5 rounded-2xl border border-blue-500/20 shadow-2xl w-full max-w-[340px] text-center">
                            <div className="flex justify-center mb-3">
                                <div className="p-2 bg-blue-500/10 rounded-full border border-blue-500/30">
                                    <MapPin className="w-6 h-6 text-blue-400" />
                                </div>
                            </div>
                            <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-1">Our Location</h2>
                            <p className="text-sm font-bold text-white mb-4 line-clamp-2">
                                {clinicAddress || "Location Information Unavailable"}
                            </p>
                            <a
                                href={smsLink}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase px-4 py-2 rounded-full transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                                Send Map to Phone
                            </a>
                        </div>
                    </motion.div>
                )}

                {/* TEMPLATE 3: SUMMARY OF SERVICES */}
                {index === 2 && (
                    <motion.div
                        key="template3"
                        variants={slideVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="absolute inset-0 flex flex-col items-center justify-center px-6"
                    >
                        <div className="bg-zinc-950/40 backdrop-blur-md p-5 rounded-2xl border border-amber-500/20 shadow-2xl w-full max-w-[340px]">
                            <div className="flex items-center gap-3 mb-3 border-b border-zinc-800 pb-2">
                                <ListChecks className="w-5 h-5 text-amber-500" />
                                <h2 className="text-sm font-black text-white uppercase tracking-tighter">Our Services</h2>
                            </div>
                            <p className="text-xs font-medium text-zinc-300 leading-relaxed text-center py-2">
                                {servicesToUse}
                            </p>
                            <div className="mt-2 flex justify-center">
                                <div className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                    Official FMCSA Provider
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pagination Indicators */}
            <div className="absolute bottom-4 flex gap-1.5">
                {slides.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1 rounded-full transition-all duration-500 ${index === i ? 'w-4 bg-emerald-500' : 'w-1 bg-zinc-700'}`}
                    />
                ))}
            </div>
        </div>
    )
}

