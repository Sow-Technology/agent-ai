import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    const { textToSpeech } = await import("@/ai/flows/text-to-speech-flow");
    const result = await textToSpeech({ text });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Text-to-speech API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process text-to-speech" },
      { status: 500 }
    );
  }
}
