import { NextRequest, NextResponse } from "next/server";
import { getReportRows } from "@/lib/campaignService";

export async function GET(
  _request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const rows = await getReportRows(params.campaignId);
    const data = rows.map(({ job, audit }) => ({
      rowIndex: job.rowIndex,
      status: job.status,
      error: job.error,
      payload: job.payload,
      retries: job.retries,
      durationMs: job.durationMs,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      agentName: audit?.agentName ?? job.payload?.full_name ?? "",
      agentUserId: audit?.agentUserId ?? job.payload?.employee_id ?? "",
      callId: audit?.callId ?? job.payload?.rid_phone ?? "",
      overallScore: audit?.overallScore ?? null,
      maxPossibleScore: audit?.maxPossibleScore ?? null,
      recordingUrl: audit?.audioUrl ?? job.payload?.recording_url ?? "",
      auditResults: audit?.auditResults ?? [],
      transcript: audit?.transcript ?? "",
      englishTranslation: audit?.englishTranslation ?? "",
      tokenUsage: audit?.tokenUsage ?? null,
      auditDurationMs: audit?.auditDurationMs ?? null,
      callDate: audit?.callDate ?? null,
      customerName: audit?.customerName ?? job.payload?.customer_name ?? "",
      campaignName: audit?.campaignName ?? job.payload?.campaign_name ?? "",
    }));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Bulk jobs error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
