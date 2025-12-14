import { NextRequest, NextResponse } from "next/server";
import { validateJWTToken } from "@/lib/jwtAuthService";
import { listCampaigns } from "@/lib/campaignService";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const tokenResult = token
      ? await validateJWTToken(token)
      : { valid: false as const };

    if (!tokenResult.valid || !tokenResult.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const role = tokenResult.user.role;
    const userId = tokenResult.user.username;
    const userProjectId = tokenResult.user.projectId;

    // Get campaigns user can access
    const campaigns = await listCampaigns({
      role,
      userId,
      projectId: userProjectId,
    });

    // Collect unique projectIds
    const projectIds = [
      ...new Set(campaigns.map((c: any) => c.projectId).filter(Boolean)),
    ];

    return NextResponse.json({ success: true, data: projectIds });
  } catch (error) {
    console.error("Projects list error", error);
    return NextResponse.json(
      { success: false, error: "Failed to list projects" },
      { status: 500 }
    );
  }
}
