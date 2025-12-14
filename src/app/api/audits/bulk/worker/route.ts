import { NextRequest, NextResponse } from "next/server";
import { runBulkWorkerOnce } from "@/lib/bulkWorker";

export async function POST(_request: NextRequest) {
  try {
    const result = await runBulkWorkerOnce();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Bulk worker error", error);
    return NextResponse.json(
      { success: false, error: "Worker failed" },
      { status: 500 }
    );
  }
}
