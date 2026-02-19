import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SuccessPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center space-y-6">
            <CheckCircle2 className="h-24 w-24 text-green-500 animate-bounce" />
            <h1 className="text-3xl font-bold">Booking Confirmed!</h1>
            <p className="text-muted-foreground text-lg">
                You're all set. We've sent a confirmation text to your phone.
            </p>
            <Button asChild size="lg" className="w-full max-w-sm mt-8">
                <Link href="/">Return to Home</Link>
            </Button>
        </div>
    )
}
