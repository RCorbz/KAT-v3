"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useAnimationControls } from "framer-motion"
import { Star } from "lucide-react"

interface Review {
    id: string
    reviewerName: string | null
    rating: number
    feedbackText: string | null
}

export function ReviewTicker({ reviews }: { reviews: Review[] }) {
    const controls = useAnimationControls()
    const [width, setWidth] = useState(0)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (ref.current) {
            setWidth(ref.current.scrollWidth)
        }
    }, [reviews])

    useEffect(() => {
        const startAnimation = async () => {
            await controls.start({
                x: -width / 2,
                transition: {
                    duration: 20,
                    ease: "linear",
                    repeat: Infinity,
                }
            })
        }
        if (width > 0) {
            startAnimation()
        }
    }, [width, controls])


    // Duplicate reviews for seamless loop
    const duplicatedReviews = [...reviews, ...reviews]

    return (
        <div className="w-full overflow-hidden bg-zinc-950 py-3 border-y border-zinc-900/50">
            <motion.div
                ref={ref}
                className="flex gap-12 whitespace-nowrap"
                animate={controls}
                initial={{ x: 0 }}
            >
                {duplicatedReviews.map((review, i) => (
                    <div key={`${review.id}-${i}`} className="flex items-center gap-3">
                        <div className="flex gap-0.5">
                            {[...Array(5)].map((_, j) => (
                                <Star key={j} className="h-3 w-3 fill-emerald-400 text-emerald-400" />
                            ))}
                        </div>
                        <span className="font-bold text-[10px] tracking-tight text-zinc-300 uppercase">
                            "{review.feedbackText}"
                        </span>
                        <span className="text-[10px] font-black italic text-zinc-500">— {review.reviewerName}</span>
                    </div>
                ))}
            </motion.div>
        </div>
    )
}
