import { plivoClient } from "@/lib/plivo"
import plivo from "plivo"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const url = new URL(req.url)
    const action = url.searchParams.get("action")
    const formData = await req.formData()
    console.log("Plivo Webhook", action, Object.fromEntries(formData))

    if (!action) {
        // Initial Call
        // Forward to Dr. Ben
        const response = new plivo.Response()
        const dial = response.addDial({
            action: `${process.env.BETTER_AUTH_URL}/api/plivo/webhook/call?action=status`,
            method: "POST",
            redirect: true
        })
        dial.addNumber(process.env.DR_BEN_CELL_NUMBER!)

        return new NextResponse(response.toXML(), {
            headers: { "Content-Type": "text/xml" }
        })
    }

    if (action === "status") {
        // Handle Dial Status
        const status = formData.get("DialStatus")
        const caller = formData.get("From") as string

        // "If status is 'busy', 'no-answer', or 'canceled'"
        if (["busy", "no-answer", "canceled", "failed"].includes(String(status))) {
            const message = "I'm with a client, call you ASAP when we are finished in about 15 minutes or less!"

            try {
                await plivoClient.messages.create(
                    process.env.PLIVO_PROXY_NUMBER!, // src must be Plivo number
                    caller,
                    message
                )
                console.log(`Auto-reply sent to ${caller}`)
            } catch (e) {
                console.error("Failed to send auto-reply SMS", e)
            }
        }

        const response = new plivo.Response()
        return new NextResponse(response.toXML(), {
            headers: { "Content-Type": "text/xml" }
        })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
