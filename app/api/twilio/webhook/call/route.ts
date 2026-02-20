import twilio from "twilio";
import { NextResponse } from "next/server";

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(req: Request) {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const formData = await req.formData();

    // Convert formData to object for easier logging/access
    const data = Object.fromEntries(formData.entries());
    console.log("Twilio Webhook", action, data);

    const twilioNumber = process.env.DEFAULT_TWILIO_NUMBER;
    const drBenNumber = process.env.DR_BEN_CELL_NUMBER;
    const appUrl = process.env.BETTER_AUTH_URL;

    if (!twilioNumber || !drBenNumber || !appUrl) {
        console.error("Missing Twilio configuration");
        return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
    }

    if (!action) {
        // Initial Call
        // Forward to Dr. Ben
        const twiml = new VoiceResponse();
        twiml.dial({
            action: `${appUrl}/api/twilio/webhook/call?action=status`,
            method: "POST"
        }, drBenNumber);

        return new NextResponse(twiml.toString(), {
            headers: { "Content-Type": "text/xml" }
        });
    }

    if (action === "status") {
        // Handle Dial Status
        const dialCallStatus = data.DialCallStatus as string;
        const caller = data.From as string;

        // "If status is 'busy', 'no-answer', or 'canceled'"
        if (["busy", "no-answer", "canceled", "failed"].includes(dialCallStatus)) {
            const message = "I'm with a client, call you ASAP when we are finished in about 15 minutes or less!";

            try {
                // Initialize client to send SMS
                const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                await client.messages.create({
                    body: message,
                    from: twilioNumber,
                    to: caller
                });
                console.log(`Auto-reply sent to ${caller}`);
            } catch (e) {
                console.error("Failed to send auto-reply SMS", e);
            }
        }

        const twiml = new VoiceResponse();
        // Return empty TwiML to end gracefully
        return new NextResponse(twiml.toString(), {
            headers: { "Content-Type": "text/xml" }
        });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
