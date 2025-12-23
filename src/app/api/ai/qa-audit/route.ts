import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongoose";
import { getAuditByAudioHash } from "@/lib/auditService";

// Increase the API body parser limit so larger base64 audio payloads (data URIs)
// can be accepted. Keep the route-level validation for a practical maximum.

// Body size controlled at reverse proxy (nginx) or use cloud upload flow

const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB limit
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

// Create a hash of the audio content for caching
function createAudioHash(audioDataUri: string): string {
  // Extract the base64 portion from the data URI using safe string operations
  // Avoid Regex on huge strings to prevent "Maximum call stack size exceeded"
  let audioData = audioDataUri;
  
  const commaIdx = audioDataUri.indexOf(",");
  if (audioDataUri.startsWith("data:") && commaIdx > -1) {
    audioData = audioDataUri.substring(commaIdx + 1);
  }
  
  // Create a SHA-256 hash of the audio content
  // For very large strings, we hash in chunks to avoid memory issues
  const hash = crypto.createHash("sha256");
  
  // Process in 1MB chunks to avoid memory pressure
  const CHUNK_SIZE = 1024 * 1024;
  for (let i = 0; i < audioData.length; i += CHUNK_SIZE) {
    hash.update(audioData.substring(i, Math.min(i + CHUNK_SIZE, audioData.length)));
  }
  
  return hash.digest("hex");
}

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

    // Check for cached audit based on audio hash
    let audioHash: string | undefined;
    let fromCache = false;
    
    if (body.audioDataUri && body.audioDataUri !== "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=") {
      await connectDB();
      audioHash = createAudioHash(body.audioDataUri);
      
      // Check for existing audit with same audio + campaign
      const cachedAudit = await getAuditByAudioHash(audioHash, body.campaignName);
      
      if (cachedAudit) {
        console.log(`[Cache Hit] Returning cached audit for audio hash: ${audioHash.substring(0, 16)}...`);
        fromCache = true;
        
        // Transform cached audit back to AI response format
        const cachedResult = {
          agentUserId: cachedAudit.agentUserId,
          campaignName: cachedAudit.campaignName,
          identifiedAgentName: cachedAudit.agentName,
          transcriptionInOriginalLanguage: cachedAudit.transcript,
          englishTranslation: cachedAudit.englishTranslation || cachedAudit.transcript,
          callSummary: "Cached audit result",
          auditResults: cachedAudit.auditResults.map((r: any) => ({
            parameter: r.parameterName,
            score: r.score,
            weightedScore: r.maxScore,
            comments: r.comments,
            type: r.type,
          })),
          overallScore: cachedAudit.overallScore,
          summary: "This audit was retrieved from cache for consistency.",
          callLanguage: "English",
          tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          auditDurationMs: 0,
          audioHash,
          fromCache: true,
        };
        
        return NextResponse.json(cachedResult);
      }
    }

    const result = await callAiWithRetry(body);
    
    // Add audio hash to result for storage
    if (audioHash) {
      result.audioHash = audioHash;
    }
    result.fromCache = false;

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
