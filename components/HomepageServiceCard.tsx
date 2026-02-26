"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ClientCTAs } from "./LandingPageClient"

interface HomepageServiceCardProps {
    service: any
    idx: number
    isFirst: boolean
    waitTime: number
    waitTimeText: string
    waitTimeSubtext: string
    waitColor: string
    clinicId: string
    doctorName: string | null
}

export function HomepageServiceCard({
    service,
    idx,
    isFirst,
    waitTime,
    waitTimeText,
    waitTimeSubtext,
    waitColor,
    clinicId,
    doctorName
}: HomepageServiceCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const cardBorder = isFirst
        ? (waitTime < 15
            ? "border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-emerald-500/5"
            : "border-zinc-700 bg-zinc-900/60")
        : "border-zinc-800 bg-zinc-900/40"

    const numberColor = isFirst ? "text-white" : "text-zinc-300"

    return (
        <div
            onClick={() => setIsExpanded(!isExpanded)}
            className={`relative rounded-2xl border backdrop-blur-md transition-all cursor-pointer overflow-hidden ${cardBorder} ${isExpanded ? 'shadow-xl' : 'active:scale-[0.98]'}`}
        >
            {isFirst && (
                <div className="absolute top-3 right-4 z-10">
                    <span className="bg-emerald-500 text-zinc-950 text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full shadow-lg">Fast Track</span>
                </div>
            )}

            <div className="p-4 sm:p-5">
                <div className="flex w-full items-center">
                    {/* 50% - Service Name */}
                    <div className="w-1/2 flex items-center gap-2 pr-2">
                        <span className={`text-base font-black italic tracking-tighter ${numberColor} opacity-50 shrink-0`}>{idx + 1}.</span>
                        <h2 className={`text-[13px] sm:text-base font-black italic tracking-tight ${numberColor} uppercase truncate`}>
                            {service.name}
                        </h2>
                    </div>

                    {/* 25% - Time Expected */}
                    <div className="w-1/4 flex flex-col items-center border-l border-zinc-800/50">
                        <span className="text-[14px] sm:text-lg font-black text-blue-400 leading-none">
                            {service.duration || "15"}
                        </span>
                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">MIN</span>
                    </div>

                    {/* 25% - Price */}
                    <div className="w-1/4 flex flex-col items-end pl-2 border-l border-zinc-800/50">
                        <div className={`text-lg sm:text-xl font-black ${isFirst ? 'text-white' : 'text-blue-400'}`}>
                            ${parseInt(service.price)}
                        </div>
                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5 whitespace-nowrap">
                            {isFirst ? "TOP VALUE" : "DISCOUNT"}
                        </span>
                    </div>
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 pb-2 border-t border-zinc-800/50 mt-4 space-y-4">
                                <p className="text-xs text-zinc-400 leading-relaxed uppercase font-medium tracking-wide">
                                    {service.description || "Get your medical card quickly and efficiently."}
                                </p>

                                {service.type === 'walkin' ? (
                                    <div className="flex items-center gap-4">
                                        {isFirst && (
                                            <div className="flex flex-col items-center shrink-0 border-r border-zinc-800 pr-4">
                                                <div className={`text-xl font-black tracking-tighter ${waitColor}`}>{waitTimeText}</div>
                                                <div className={`text-[8px] font-bold tracking-widest uppercase ${waitColor} opacity-80`}>{waitTimeSubtext}</div>
                                            </div>
                                        )}
                                        <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                                            <ClientCTAs clinicId={clinicId} doctorName={doctorName} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full" onClick={(e) => e.stopPropagation()}>
                                        <Link href={`/get-my-card?serviceId=${service.id}`}>
                                            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black italic rounded-xl h-11 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                                                15 MINUTE PHYSICAL PLEASE.
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!isExpanded && (
                    <div className="flex justify-center mt-2">
                        <div className="w-8 h-1 bg-zinc-800 rounded-full opacity-30"></div>
                    </div>
                )}
            </div>
        </div>
    )
}
