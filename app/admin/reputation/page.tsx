import { db } from "@/db"
import { reviews } from "@/db/schema"
import { eq, desc, isNull } from "drizzle-orm"
import { processFeedback, autoTagReview } from "../actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function ReputationPage() {
    const untaggedReviews = await db.query.reviews.findMany({
        where: isNull(reviews.aiTheme),
        columns: { id: true, feedbackText: true }
    })

    if (untaggedReviews.length > 0) {
        await Promise.allSettled(
            untaggedReviews.map((r: any) => autoTagReview(r.id, r.feedbackText || ""))
        )
    }

    const pendingReviews = await db.query.reviews.findMany({
        where: eq(reviews.status, "pending"),
        with: {
            appointment: {
                with: { user: true }
            }
        },
        orderBy: [desc(reviews.createdAt)]
    })

    const promoters = pendingReviews.filter((r: any) => r.rating === 5)
    const needsResponse = pendingReviews.filter((r: any) => r.rating < 5)

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold">Reputation Triage</h1>

            {pendingReviews.length === 0 && <p className="text-muted-foreground">No pending reviews.</p>}

            <div className="grid lg:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-emerald-700">Super Promoters (5 ★)</h2>
                    {promoters.length === 0 && <p className="text-sm text-muted-foreground bg-zinc-50 p-4 rounded-lg border border-dashed">No 5-star reviews pending.</p>}
                    <div className="space-y-4">
                        {promoters.map((review: any) => (
                            <Card key={review.id} className="border-emerald-100 bg-emerald-50/10">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {review.appointment?.user?.name || review.reviewerName || "Anonymous"} - {review.rating} Stars
                                    </CardTitle>
                                    {review.aiTheme && <Badge variant="default" className="bg-emerald-600">{review.aiTheme}</Badge>}
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{review.feedbackText}</p>
                                    <p className="text-xs text-muted-foreground mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                                </CardContent>
                                <CardFooter className="flex gap-2">
                                    <form action={processFeedback.bind(null, review.id, 'approve')}><Button size="sm" variant="default" className="gap-2"><Check className="h-4 w-4" /> Approve</Button></form>
                                    <form action={processFeedback.bind(null, review.id, 'reject')}><Button size="sm" variant="outline" className="gap-2 text-zinc-500 hover:text-red-600"><X className="h-4 w-4" /> Dismiss</Button></form>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4 text-red-700">Needs Response (1-4 ★)</h2>
                    {needsResponse.length === 0 && <p className="text-sm text-muted-foreground bg-zinc-50 p-4 rounded-lg border border-dashed">No critical reviews pending.</p>}
                    <div className="space-y-4">
                        {needsResponse.map((review: any) => (
                            <Card key={review.id} className="border-red-100 bg-red-50/10">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {review.appointment?.user?.name || review.reviewerName || "Anonymous"} - {review.rating} Stars
                                    </CardTitle>
                                    {review.aiTheme && <Badge variant="destructive">{review.aiTheme}</Badge>}
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm font-medium">{review.feedbackText}</p>
                                    <p className="text-xs text-muted-foreground mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                                </CardContent>
                                <CardFooter className="flex gap-2">
                                    <form action={processFeedback.bind(null, review.id, 'approve')}><Button size="sm" variant="destructive" className="gap-2"><Check className="h-4 w-4" /> Acknowledge</Button></form>
                                    <form action={processFeedback.bind(null, review.id, 'reject')}><Button size="sm" variant="outline" className="gap-2 text-zinc-500 hover:text-red-600"><X className="h-4 w-4" /> Dismiss</Button></form>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
