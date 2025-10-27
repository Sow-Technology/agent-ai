import { NextRequest, NextResponse } from "next/server";

// Increase the API body parser limit so larger base64 audio payloads (data URIs)
// can be accepted. Keep the route-level validation for a practical maximum.

// Body size controlled at reverse proxy (nginx) or use cloud upload flow

const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB limit
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callAiWithRetry(body: any, attempt: number = 1): Promise<any> {
  try {
    const { qaAuditCall } = await import("@/ai/flows/qa-audit-flow");
    const result = await qaAuditCall(body);
    return result;
  } catch (error) {
    if (attempt < RETRY_ATTEMPTS) {
      console.warn(
        `AI call attempt ${attempt} failed, retrying in ${RETRY_DELAY_MS}ms...`,
        error instanceof Error ? error.message : error
      );
      await delay(RETRY_DELAY_MS * attempt); // Exponential backoff
      return callAiWithRetry(body, attempt + 1);
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if audio is too large for direct processing
    if (body.audioDataUri && body.audioDataUri.length > MAX_AUDIO_SIZE) {
      console.warn(
        `Audio too large: ${(body.audioDataUri.length / (1024 * 1024)).toFixed(
          2
        )}MB`
      );
      return NextResponse.json(
        {
          success: false,
          error: `Audio file too large. Maximum size: ${
            MAX_AUDIO_SIZE / (1024 * 1024)
          }MB. Please use cloud storage upload.`,
          solution: "Upload audio to cloud storage first, then provide the URL",
          audioSize: `${(body.audioDataUri.length / (1024 * 1024)).toFixed(
            2
          )}MB`,
        },
        { status: 413 }
      );
    }

    console.log("Starting QA audit processing...", {
      hasAudio: !!body.audioDataUri,
      audioSize: body.audioDataUri
        ? `${(body.audioDataUri.length / (1024 * 1024)).toFixed(2)}MB`
        : "N/A",
      agentUserId: body.agentUserId,
      campaignName: body.campaignName,
      timestamp: new Date().toISOString(),
    });

    const result = await callAiWithRetry(body);

    console.log("QA audit processing completed successfully");

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = errorMessage.includes("503")
      ? "SERVICE_UNAVAILABLE"
      : errorMessage.includes("500")
      ? "INTERNAL_ERROR"
      : errorMessage.includes("quota")
      ? "QUOTA_EXCEEDED"
      : "UNKNOWN_ERROR";

    console.error("QA Audit API error:", {
      error: errorMessage,
      errorCode,
      timestamp: new Date().toISOString(),
      suggestion:
        errorCode === "SERVICE_UNAVAILABLE"
          ? "Google AI service is temporarily unavailable. Try again in a few moments."
          : errorCode === "QUOTA_EXCEEDED"
          ? "API quota exceeded. Check Google Cloud Console for usage limits."
          : "Unexpected error. Check logs for details.",
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process QA audit",
        errorCode,
        details: errorMessage.substring(0, 500),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
