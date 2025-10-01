import { NextRequest, NextResponse } from "next/server";

export interface AuditChatInput {
  auditSummary: string;
  auditTranscription: string;
  userMessage: string;
  chatHistory: Array<{ role: "user" | "model"; content: string }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: AuditChatInput = await request.json();

    const { chatAboutAudit } = await import("@/ai/flows/audit-chat-flow");
    const result = await chatAboutAudit(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Audit chat API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process audit chat" },
      { status: 500 }
    );
  }
}
