import { db } from "@/db"
import { reviews } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { processFeedback } from "../actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function ReputationPage() {
    const pendingReviews = await db.query.reviews.findMany({
        where: eq(reviews.status, "pending"),
        with: {
            appointment: {
                with: { user: true }
            }
        },
        orderBy: [desc(reviews.createdAt)]
    })

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold">Reputation Triage</h1>

            {pendingReviews.length === 0 && <p className="text-muted-foreground">No pending reviews.</p>}

            <div className="grid gap-6">
                {pendingReviews.map(review => (
                    <Card key={review.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {review.appointment?.user?.name || "Anonymous"} - {review.rating} Stars
                            </CardTitle>
                            {review.aiTheme && (
                                <Badge variant="secondary">{review.aiTheme}</Badge>
                            )}
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">{review.feedbackText}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                                {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                            <form action={processFeedback.bind(null, review.id, 'approve')}>
                                <Button size="sm" variant="default" className="gap-2">
                                    <Check className="h-4 w-4" /> Approve
                                </Button>
                            </form>
                            <form action={processFeedback.bind(null, review.id, 'reject')}>
                                <Button size="sm" variant="destructive" className="gap-2">
                                    <X className="h-4 w-4" /> Reject
                                </Button>
                            </form>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
