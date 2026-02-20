import { model } from "@/lib/vertex";
import { db } from "@/db"
import { eq } from "drizzle-orm"
import { intakeQuestions } from "@/db/schema"

import { Buffer } from "buffer";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get("audio") as File;

        if (!audioFile) {
            return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
        }

        // Convert audio to base64
        const buffer = Buffer.from(await audioFile.arrayBuffer());
        const base64Audio = buffer.toString("base64");

        // Fetch active intake questions to guide the AI
        const questions = await db.query.intakeQuestions.findMany({
            where: eq(intakeQuestions.isActive, true),
            orderBy: (intakeQuestions, { asc }) => [asc(intakeQuestions.order)],
        });

        const questionText = questions.map(q => `- ${q.text} (Key: ${q.jsonKey}, Type: ${q.type})`).join("\n");

        const prompt = `
      You are a medical intake assistant for CDL drivers.
      Listen to the following audio and extract answers for these questions:
      ${questionText}

      Return a JSON object where keys are the 'Key' specified above, and values are the extracted answers.
      For boolean types, return true/false.
      For text types, return the text spoken.
      For date types, return ISO string if possible, or null.
      
      If the audio is unclear, return null for that key.
      Return ONLY the JSON.
    `;

        const result = await model.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: audioFile.type || "audio/webm",
                                data: base64Audio,
                            },
                        },
                    ],
                },
            ],
        });

        const response = result.response;
        const text = response.candidates?.[0].content.parts[0].text;

        if (!text) {
            throw new Error("No response from AI");
        }

        // Clean up markdown code blocks if present
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(jsonString);

        return NextResponse.json(data);
    } catch (error) {
        console.error("Voice parsing error:", error);
        // Fallback for graceful degradation per Segment B
        return NextResponse.json({ confidence: "low" }, { status: 200 });
    }
}
