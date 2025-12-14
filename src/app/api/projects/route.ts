import { NextRequest, NextResponse } from "next/server";
import { validateJWTToken } from "@/lib/jwtAuthService";
import { listCampaigns } from "@/lib/campaignService";
import { getAllUsers } from "@/lib/userService";

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

    let projectIds: string[] = [];

    if (role === "Administrator") {
      // Admins can see all projects from campaigns and users
      const campaigns = await listCampaigns({ role, userId });
      const campaignProjectIds = campaigns
        .map((c: any) => c.projectId)
        .filter(Boolean);
      
      const users = await getAllUsers();
      const userProjectIds = users
        .map((u: any) => u.projectId)
        .filter(Boolean);
      
      projectIds = [...new Set([...campaignProjectIds, ...userProjectIds])];
    } else if (role === "Project Admin" && userProjectId) {
      // Project admins can see their own project
      projectIds = [userProjectId];
    } else {
      // For other roles, get projects from campaigns they can access
      const campaigns = await listCampaigns({
        role,
        userId,
        projectId: userProjectId,
      });
      projectIds = [
        ...new Set(campaigns.map((c: any) => c.projectId).filter(Boolean)),
      ];
    }

    return NextResponse.json({ success: true, data: projectIds });
  } catch (error) {
    console.error("Projects list error", error);
    return NextResponse.json(
      { success: false, error: "Failed to list projects" },
      { status: 500 }
    );
  }
}
