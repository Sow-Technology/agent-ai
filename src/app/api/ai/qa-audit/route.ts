import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if audio is too large for direct processing
    if (body.audioDataUri && body.audioDataUri.length > 6 * 1024 * 1024) {
      // 6MB limit
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
