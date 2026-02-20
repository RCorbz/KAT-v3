"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignInPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const router = useRouter()
    const [error, setError] = useState("")

    const handleSignIn = async () => {
        await authClient.signIn.email({
            email,
            password
        }, {
            onSuccess: () => {
                router.push("/admin")
            },
            onError: (ctx) => {
                setError(ctx.error.message)
            }
        })
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-100">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Admin Sign In</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Password</Label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <Button onClick={handleSignIn} className="w-full">Sign In</Button>
                </CardContent>
            </Card>
        </div>
    )
}
