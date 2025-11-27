import { NextRequest, NextResponse } from "next/server";
import { getGoogleAI } from "@/ai/genkit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { success: false, error: "Text is required" },
        { status: 400 }
      );
    }

    // Limit text length to prevent abuse
    const maxLength = 5000;
    const truncatedText =
      text.length > maxLength ? text.slice(0, maxLength) : text;

    const ai = getGoogleAI();

    // Use Gemini 2.0 Flash with audio output
    const model = ai.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        // @ts-ignore - responseModalities is supported but not in types yet
        responseModalities: ["AUDIO"],
        // @ts-ignore - speechConfig is supported but not in types yet
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Kore",
            },
          },
        },
      },
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Please read the following text aloud clearly and naturally:\n\n${truncatedText}`,
            },
          ],
        },
      ],
    });

    const response = result.response;

    // Check if we have audio data in the response
    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new Error("No audio content generated");
    }

    // Find the inline data part with audio
    let audioDataUri: string | null = null;

    for (const part of candidate.content.parts) {
      // @ts-ignore - inlineData may contain audio
      if (part.inlineData?.mimeType?.startsWith("audio/")) {
        // @ts-ignore
        const mimeType = part.inlineData.mimeType;
        // @ts-ignore
        const base64Data = part.inlineData.data;
        audioDataUri = `data:${mimeType};base64,${base64Data}`;
        break;
      }
    }

    if (!audioDataUri) {
      // Fallback: Use Web Speech API on client or return an error
      // For server-side, we'll use an alternative approach with Google Cloud TTS
      // For now, return a message that TTS is not available
      console.log(
        "No audio in Gemini response, parts:",
        JSON.stringify(candidate.content.parts, null, 2)
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Text-to-speech audio generation not available. The model did not return audio output.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        audioDataUri,
      },
    });
  } catch (error) {
    console.error("Text-to-speech error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to generate speech",
      },
      { status: 500 }
    );
  }
}
