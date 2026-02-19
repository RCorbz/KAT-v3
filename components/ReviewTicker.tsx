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
        <div className="w-full overflow-hidden bg-zinc-900 py-2 border-b border-zinc-800">
            <motion.div
                ref={ref}
                className="flex gap-8 whitespace-nowrap"
                animate={controls}
                initial={{ x: 0 }}
            >
                {duplicatedReviews.map((review, i) => (
                    <div key={`${review.id}-${i}`} className="flex items-center gap-2 text-white">
                        <div className="flex">
                            {[...Array(review.rating)].map((_, j) => (
                                <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                        </div>
                        <span className="font-medium text-sm">
                            "{review.feedbackText}" - {review.reviewerName}
                        </span>
                    </div>
                ))}
            </motion.div>
        </div>
    )
}
