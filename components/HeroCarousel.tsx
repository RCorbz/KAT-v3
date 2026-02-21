"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface HeroCarouselProps {
    doctorName: string | null
    doctorBio: string | null
    doctorPicUrl: string | null
}

export function HeroCarousel({ doctorName, doctorBio, doctorPicUrl }: HeroCarouselProps) {
    const [index, setIndex] = useState(0)

    const slides = [
        { type: "text", content: "GET YOUR CARD." },
        { type: "text", content: "GET BACK ON THE ROAD." },
        { type: "doc", name: doctorName, bio: doctorBio, pic: doctorPicUrl }
    ]

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % slides.length)
        }, 4000) // 1s zoom in, 2s pause, 1s zoom out
        return () => clearInterval(timer)
    }, [slides.length])

    const slideVariants: any = {
        initial: { x: "-100%", opacity: 0, scale: 0.8 },
        animate: {
            x: 0,
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.8,
                ease: "easeOut"
            }
        },
        exit: {
            x: "100%",
            opacity: 0,
            scale: 1.1,
            transition: {
                duration: 0.8,
                ease: "easeIn"
            }
        }
    }

    return (
        <div className="relative h-48 w-full flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
                {index === 0 && (
                    <motion.div
                        key="slide0"
                        variants={slideVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="absolute inset-0 flex flex-col items-center justify-center px-6"
                    >
                        <h1 className="text-5xl font-black italic tracking-tighter text-white drop-shadow-2xl text-center leading-none">
                            GET YOUR<br /><span className="text-blue-500">CARD.</span>
                        </h1>
                    </motion.div>
                )}

                {index === 1 && (
                    <motion.div
                        key="slide1"
                        variants={slideVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="absolute inset-0 flex flex-col items-center justify-center px-6"
                    >
                        <h1 className="text-4xl font-black italic tracking-tighter text-zinc-100 drop-shadow-2xl text-center leading-none">
                            GET BACK ON<br />THE ROAD.
                        </h1>
                    </motion.div>
                )}

                {index === 2 && (
                    <motion.div
                        key="slide2"
                        variants={slideVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="absolute inset-0 flex flex-col items-center justify-center px-4"
                    >
                        <div className="flex items-center gap-4 bg-zinc-950/40 backdrop-blur-md p-4 rounded-2xl border border-zinc-800/50 shadow-2xl">
                            <div className="w-16 h-16 rounded-full border-2 border-emerald-500/50 overflow-hidden flex-shrink-0 bg-zinc-800">
                                {doctorPicUrl ? (
                                    <img src={doctorPicUrl} alt={doctorName || "Doctor"} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-xl text-zinc-600">
                                        {doctorName?.charAt(0) || "D"}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <h2 className="text-base font-bold text-white leading-tight mb-1 truncate">{doctorName || "Dr. Ben"}</h2>
                                <p className="text-[10px] text-zinc-400 line-clamp-3 leading-tight italic">
                                    "{doctorBio || "Certified Medical Examiner ensuring you stay on the road Safely."}"
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
