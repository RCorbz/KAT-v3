"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HomepageAddonCardProps {
    addon: any
}

export function HomepageAddonCard({ addon }: HomepageAddonCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col cursor-pointer transition-all duration-300 ${isExpanded ? 'bg-zinc-800/80 border-blue-500/30 shadow-lg' : 'hover:bg-zinc-800/40'}`}
        >
            <div className="flex justify-between items-start gap-2 mb-1">
                <h3 className="font-bold text-[10px] sm:text-xs text-white uppercase tracking-tight leading-tight flex-1">
                    {addon.name}
                </h3>
                <span className="text-emerald-400 font-bold text-xs sm:text-sm shrink-0">
                    +${parseInt(addon.price) || 0}
                </span>
            </div>

            {!isExpanded && (
                <div className="flex justify-center mt-2">
                    <div className="w-6 h-1 bg-zinc-800 rounded-full opacity-50"></div>
                </div>
            )}

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="overflow-hidden"
                    >
                        <div className="pt-3 pb-1 border-t border-zinc-800/50 mt-3 flex flex-col gap-3">
                            <p className="text-[10px] text-zinc-400 leading-tight uppercase font-medium tracking-wide">
                                {addon.description || `Enhance your visit with ${addon.name}.`}
                            </p>

                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-bold">
                                    <Clock className="w-3 h-3" />
                                    +{addon.duration} MINS
                                </span>
                                <Button size="sm" variant="ghost" className="h-7 text-[10px] font-black uppercase text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-2 border border-blue-500/20">
                                    Ask Dr. Ben
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
