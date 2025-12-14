import { NextRequest, NextResponse } from "next/server";
import { runBulkWorkerOnce } from "@/lib/bulkWorker";

const CRON_KEY = process.env.BULK_CRON_KEY;
const MAX_CYCLES = 5;

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const key = request.headers.get("x-cron-key") || url.searchParams.get("key");
    if (!CRON_KEY || key !== CRON_KEY) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let processed = 0;
    for (let i = 0; i < MAX_CYCLES; i += 1) {
      const result = await runBulkWorkerOnce();
      processed += result.processed || 0;
      if (!result.processed || result.processed === 0) break;
    }

    return NextResponse.json({ success: true, data: { processed } });
  } catch (error) {
    console.error("Bulk cron error", error);
    return NextResponse.json(
      { success: false, error: "Cron worker failed" },
      { status: 500 }
    );
  }
}
