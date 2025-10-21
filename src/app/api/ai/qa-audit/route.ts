import { NextRequest, NextResponse } from "next/server";

// Increase the API body parser limit so larger base64 audio payloads (data URIs)
// can be accepted. Keep the route-level validation for a practical maximum.

export const route = {
  body: {
    sizeLimit: '12mb',
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if audio is too large for direct processing
    if (body.audioDataUri && body.audioDataUri.length > 10 * 1024 * 1024) {
      // 10MB limit (server handles up to 12MB); recommend using cloud storage for larger files
      return NextResponse.json(
        {
          success: false,
          error:
            "Audio file too large for direct processing. Please use cloud storage upload.",
          solution: "Upload audio to cloud storage first, then provide the URL",
        },
        { status: 413 }
      );
    }

    const { qaAuditCall } = await import("@/ai/flows/qa-audit-flow");
    const result = await qaAuditCall(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error("QA Audit API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process QA audit" },
      { status: 500 }
    );
  }
}
