import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, languageCode = "en-US", voiceName = "en-US-Studio-O" } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { success: false, error: "Text is required" },
        { status: 400 }
      );
    }

    // Limit text length to prevent abuse (Cloud TTS has a 5000 byte limit per request)
    const maxLength = 5000;
    const truncatedText =
      text.length > maxLength ? text.slice(0, maxLength) : text;

    const apiKey =
      process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Google API key not configured" },
        { status: 500 }
      );
    }

    // Use Google Cloud Text-to-Speech API
    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            text: truncatedText,
          },
          voice: {
            languageCode: languageCode,
            name: voiceName,
            ssmlGender: "FEMALE",
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 1.0,
            pitch: 0,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorData = await ttsResponse.json().catch(() => ({}));
      console.error("Google TTS API error:", errorData);

      // If Studio voice fails, try with a standard voice
      if (ttsResponse.status === 400 && voiceName.includes("Studio")) {
        const fallbackResponse = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              input: {
                text: truncatedText,
              },
              voice: {
                languageCode: languageCode,
                name: "en-US-Standard-C",
                ssmlGender: "FEMALE",
              },
              audioConfig: {
                audioEncoding: "MP3",
                speakingRate: 1.0,
                pitch: 0,
              },
            }),
          }
        );

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const audioDataUri = `data:audio/mp3;base64,${fallbackData.audioContent}`;
          return NextResponse.json({
            success: true,
            data: {
              audioDataUri,
            },
          });
        }
      }

      return NextResponse.json(
        {
          success: false,
          error:
            errorData.error?.message ||
            "Failed to generate speech from Google TTS API",
        },
        { status: ttsResponse.status }
      );
    }

    const ttsData = await ttsResponse.json();
    const audioDataUri = `data:audio/mp3;base64,${ttsData.audioContent}`;

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
