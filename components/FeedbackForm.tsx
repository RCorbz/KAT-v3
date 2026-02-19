"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"

interface FeedbackFormProps {
    appointmentId: string
    googleReviewUrl: string
}

export function FeedbackForm({ appointmentId, googleReviewUrl }: FeedbackFormProps) {
    const [rating, setRating] = useState(0)
    const [feedback, setFeedback] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleRating = (value: number) => {
        setRating(value)
        if (value === 5) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            })
            // Redirect immediately
            setTimeout(() => {
                window.location.href = googleReviewUrl || "https://google.com" // Fallback
            }, 1000)
        }
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            await fetch("/api/feedback/process", {
                method: "POST",
                body: JSON.stringify({
                    appointmentId,
                    rating,
                    feedbackText: feedback
                })
            })
            setSubmitted(true)
        } catch (e) {
            console.error(e)
            // Handle error
        } finally {
            setIsSubmitting(false)
        }
    }

    if (submitted) {
        return (
            <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold">Thank You!</h2>
                <p className="text-muted-foreground">Your feedback helps us improve.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-md mx-auto p-6 bg-card rounded-xl shadow-sm border">
            <h2 className="text-2xl font-bold text-center">How was your visit?</h2>

            <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => handleRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                    >
                        <Star
                            className={cn(
                                "w-10 h-10 transition-colors",
                                rating >= star ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                            )}
                        />
                    </button>
                ))}
            </div>

            {rating > 0 && rating < 5 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                    <p className="text-center text-sm text-muted-foreground">
                        We're sorry to hear that. Please tell us how we can do better.
                    </p>
                    <Textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="What went wrong?"
                        rows={4}
                    />
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !feedback.trim()}
                        className="w-full"
                    >
                        {isSubmitting ? "Submitting..." : "Submit Feedback"}
                    </Button>
                </div>
            )}

            {rating === 5 && (
                <p className="text-center text-green-600 font-medium animate-pulse">
                    Redirecting to Google Reviews...
                </p>
            )}
        </div>
    )
}
