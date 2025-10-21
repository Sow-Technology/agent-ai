import { NextRequest, NextResponse } from "next/server";

export const route = {
  body: {
    sizeLimit: "12mb",
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.audioUrl) {
      return NextResponse.json(
        { success: false, error: "audioUrl is required" },
        { status: 400 }
      );
    }

    // For Netlify compatibility, we'll need to fetch the audio from cloud storage
    // This avoids the 6MB payload limit
    const audioResponse = await fetch(body.audioUrl);
    if (!audioResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch audio from URL" },
        { status: 400 }
      );
    }

    // Convert to base64 for processing
    const arrayBuffer = await audioResponse.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    // Get content type from response
    const contentType =
      audioResponse.headers.get("content-type") || "audio/wav";

    // Create data URI
    const audioDataUri = `data:${contentType};base64,${base64Audio}`;

    // Check size after fetching
    if (audioDataUri.length > 10 * 1024 * 1024) {
      // 10MB limit for cloud-fetched audio data URI (route-level body limit is 12MB)
      return NextResponse.json(
        { success: false, error: "Audio file too large even after fetching" },
        { status: 413 }
      );
    }

    // Process with the QA audit flow
    const { qaAuditCall } = await import("@/ai/flows/qa-audit-flow");
    const auditBody = {
      ...body,
      audioDataUri: audioDataUri,
    };

    const result = await qaAuditCall(auditBody);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Cloud QA Audit API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process QA audit from cloud storage",
      },
      { status: 500 }
    );
  }
}
