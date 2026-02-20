import { model } from "@/lib/vertex";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { appointmentId, rating, feedbackText } = await req.json();

        if (!appointmentId || !rating) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let aiTheme = null;

        // AI Theme Extraction for non-5-star reviews
        if (rating < 5 && feedbackText) {
            try {
                const prompt = `
                Analyze this patient feedback: "${feedbackText}"
                Extract the root cause theme in 2-3 words (e.g., "Wait Time", "Bedside Manner", "Cleanliness", "Price", "Scheduling").
                Return ONLY the theme.
            `;

                const result = await model.generateContent(prompt);
                const response = result.response;
                aiTheme = response.candidates?.[0].content.parts[0].text?.trim() || "Unclassified";
            } catch (aiError) {
                console.error("AI Theme Extraction Failed", aiError);
                aiTheme = "AI Error";
            }
        }

        // Save Review
        // We need to fetch Appointment to get User ID? Or just link to Appointment.
        // Schema links Review to Appointment and User.
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            select: { userId: true }
        });

        if (!appointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

        const review = await prisma.review.create({
            data: {
                appointmentId,
                userId: appointment.userId,
                rating,
                feedbackText,
                aiTheme,
                status: "pending", // Needs approval if < 5? or always? Prompt says "Surfaces it on /admin/reputation".
                isFeatured: false // Only 5-star approved gets featured usually
            }
        });

        return NextResponse.json({ success: true, aiTheme });

    } catch (error) {
        console.error("Feedback processing error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
