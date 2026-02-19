import prisma from "@/lib/prisma"
import { ReviewTicker } from "@/components/ReviewTicker"
import Link from "next/link"
import { Phone } from "lucide-react"
import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic' // Ensure fresh reviews

export default async function HomePage() {
    const reviews = await prisma.review.findMany({
        where: { isFeatured: true },
        select: {
            id: true,
            reviewerName: true,
            rating: true,
            feedbackText: true
        }
    })

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {/* Hero Section */}
            <section className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-6 bg-gradient-to-b from-primary/10 to-background">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-primary">
                    Keep America Trucking
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                    DOT Physicals & Health Services for the Modern Driver. Fast, efficient, and built for your schedule.
                </p>

                <div className="flex flex-col w-full max-w-xs gap-4">
                    <Button asChild size="lg" className="w-full text-lg h-14 bg-green-600 hover:bg-green-700 pulse-animation">
                        <Link href="/get-my-card">
                            Get My Card Now
                        </Link>
                    </Button>

                    <Button asChild variant="outline" size="lg" className="w-full text-lg h-14 border-primary text-primary hover:bg-primary/10">
                        <a href={`tel:${process.env.PLIVO_PROXY_NUMBER}`}>
                            <Phone className="mr-2 h-5 w-5" />
                            Call Dr. Ben
                        </a>
                    </Button>
                </div>
            </section>

            {/* Ticker Tape */}
            <section className="w-full">
                <ReviewTicker reviews={reviews} />
            </section>

            {/* Features / Info (Optional but good for landing) */}
            <section className="py-12 px-4 space-y-8 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
                        <h3 className="font-bold text-xl mb-2">No Wait Time</h3>
                        <p className="text-muted-foreground">Book your slot, walk in, get out. We respect your clock.</p>
                    </div>
                    <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
                        <h3 className="font-bold text-xl mb-2">Driver Focused</h3>
                        <p className="text-muted-foreground">Designed specifically for CDL holders. We know the regulations.</p>
                    </div>
                    <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
                        <h3 className="font-bold text-xl mb-2">Instant Cert</h3>
                        <p className="text-muted-foreground">Walk out with your medical card in hand (and on your phone).</p>
                    </div>
                </div>
            </section>
        </div>
    )
}
