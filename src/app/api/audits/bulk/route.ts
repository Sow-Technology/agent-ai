import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateJWTToken } from "@/lib/jwtAuthService";
import {
  createCampaignWithJobs,
  listCampaigns,
  getCampaignStatus,
} from "@/lib/campaignService";
import { runBulkWorkerOnce } from "@/lib/bulkWorker";

const rowSchema = z.object({}).passthrough();

const createSchema = z.object({
  campaignName: z.string().min(1).max(200),
  timezone: z.string().min(1).max(100).default("UTC"),
  rows: z.array(rowSchema).min(1),
  qaParameterSetId: z.string().optional(),
  sopId: z.string().optional(),
  projectId: z.string().optional(),
});

function normalizeRow(row: Record<string, any>) {
  return {
    full_name: row.Full_Name ?? row.full_name ?? row["Full Name"],
    employee_id: row.employee_id ?? row.Employee_ID ?? row.employeeId,
    rid_phone: row["RID-Phone #"] ?? row.rid_phone ?? row.callId,
    call_type:
      row["Call Type (Connect/Support) (EG)"] ?? row.call_type ?? row.callType,
    sub_dispo: row.Sub_dispo ?? row.sub_dispo ?? row.subDispo,
    email_id: row.email_id ?? row.email ?? row.Email,
    call_datetime:
      row.call_datetime ?? row.callDateTime ?? row["call_datetime"],
    customer_name: row.customer_name ?? row.customerName,
    client_id: row.client_id ?? row.clientId ?? row.campaign,
    customer_id: row.customer_id ?? row.customerId,
    recording_url:
      row["(S3) recording_url"] ?? row.recording_url ?? row.recordingUrl,
    call_duration: row.call_duration ?? row.callDuration,
    file_no: row["File No"] ?? row.file_no ?? row.fileNo,
  };
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const tokenResult = await validateJWTToken(token);
    if (!tokenResult.valid || !tokenResult.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const rows = parsed.data.rows
      .map(normalizeRow)
      .filter((r) => r.recording_url);
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid rows with recording_url" },
        { status: 400 }
      );
    }

    const campaign = await createCampaignWithJobs({
      name: parsed.data.campaignName,
      timezone: parsed.data.timezone,
      createdBy: tokenResult.user.username,
      projectId: parsed.data.projectId || tokenResult.user.projectId,
      qaParameterSetId: parsed.data.qaParameterSetId,
      sopId: parsed.data.sopId,
      rows,
    });

    // Kick off worker once to start processing; subsequent polling can continue it
    await runBulkWorkerOnce();

    return NextResponse.json({
      success: true,
      data: {
        id: campaign._id.toString(),
        totalJobs: campaign.totalJobs,
        status: campaign.status,
      },
    });
  } catch (error) {
    console.error("Bulk create error", error);
    return NextResponse.json(
      { success: false, error: "Failed to create bulk campaign" },
      { status: 500 }
    );
  }
}

type TokenResultWithUser = {
  valid: true;
  user: {
    id: any;
    username: any;
    email: any;
    role: any;
    projectId: any;
  };
};

function hasUser(result: any): result is TokenResultWithUser {
  return Boolean(result && result.valid && result.user);
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const tokenResult = token
      ? await validateJWTToken(token)
      : { valid: false as const };
    const role = hasUser(tokenResult) ? tokenResult.user.role : null;
    const userId = hasUser(tokenResult) ? tokenResult.user.username : null;
    const projectId = hasUser(tokenResult) ? tokenResult.user.projectId : null;

    const campaigns = await listCampaigns({ role, userId, projectId });

    // Refresh progress/ETA for each campaign to keep dashboard accurate
    const withStatus = await Promise.all(
      campaigns.map(async (c: any) => {
        const status = await getCampaignStatus(c._id.toString());
        return status?.campaign || c;
      })
    );

    return NextResponse.json({ success: true, data: withStatus });
  } catch (error) {
    console.error("Bulk list error", error);
    return NextResponse.json(
      { success: false, error: "Failed to list campaigns" },
      { status: 500 }
    );
  }
}
