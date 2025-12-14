import { NextRequest, NextResponse } from "next/server";
import {
  getCampaignStatus,
  deleteCampaign,
  cancelCampaign,
  getCampaignById,
} from "@/lib/campaignService";
import { validateJWTToken } from "@/lib/jwtAuthService";

export async function GET(
  _request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const status = await getCampaignStatus(params.campaignId);
    if (!status) {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: status });
  } catch (error) {
    console.error("Bulk status error", error);
    return NextResponse.json(
      { success: false, error: "Failed to load campaign status" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const action = request.nextUrl.searchParams.get("action") || "delete";
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

    const campaign = await getCampaignById(params.campaignId);
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );
    }

    if (
      tokenResult.user.role === "Agent" ||
      tokenResult.user.role === "Auditor" ||
      tokenResult.user.role === "QA Analyst"
    ) {
      if (campaign.createdBy !== tokenResult.user.username) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    if (action === "cancel") {
      const canceled = await cancelCampaign(params.campaignId);
      if (!canceled) {
        return NextResponse.json(
          { success: false, error: "Failed to cancel campaign" },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, data: { canceled: true } });
    }

    const deleted = await deleteCampaign(params.campaignId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Failed to delete campaign" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error("Bulk delete/cancel error", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete/cancel campaign" },
      { status: 500 }
    );
  }
}
