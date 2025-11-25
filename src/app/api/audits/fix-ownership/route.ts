import { NextRequest, NextResponse } from "next/server";
import { validateJWTToken } from "@/lib/jwtAuthService";
import CallAudit from "@/models/CallAudit";
import connectDB from "@/lib/mongoose";

// POST /api/audits/fix-ownership - Fix audit ownership for admins
// This endpoint allows administrators to reassign audits to the correct users
export async function POST(request: NextRequest) {
  try {
    // Get current user from JWT token
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
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    // Only administrators can use this endpoint
    if (tokenResult.user.role !== "Administrator") {
      return NextResponse.json(
        {
          success: false,
          error: "Only administrators can fix audit ownership",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { auditIds, newAuditedBy } = body;

    if (!auditIds || !Array.isArray(auditIds) || auditIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "auditIds array is required" },
        { status: 400 }
      );
    }

    if (!newAuditedBy || typeof newAuditedBy !== "string") {
      return NextResponse.json(
        { success: false, error: "newAuditedBy (username) is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Update all specified audits
    const result = await CallAudit.updateMany(
      { _id: { $in: auditIds } },
      { $set: { auditedBy: newAuditedBy } }
    );

    return NextResponse.json({
      success: true,
      message: `Updated ${result.modifiedCount} audits`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error fixing audit ownership:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fix audit ownership" },
      { status: 500 }
    );
  }
}

// PATCH /api/audits/fix-ownership - Bulk fix audits with "AI Auditor" to specific user
export async function PATCH(request: NextRequest) {
  try {
    // Get current user from JWT token
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
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    // Only administrators can use this endpoint
    if (tokenResult.user.role !== "Administrator") {
      return NextResponse.json(
        {
          success: false,
          error: "Only administrators can fix audit ownership",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { oldAuditedBy, newAuditedBy } = body;

    if (!oldAuditedBy || typeof oldAuditedBy !== "string") {
      return NextResponse.json(
        { success: false, error: "oldAuditedBy is required" },
        { status: 400 }
      );
    }

    if (!newAuditedBy || typeof newAuditedBy !== "string") {
      return NextResponse.json(
        { success: false, error: "newAuditedBy (username) is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Update all audits with the old auditedBy value to the new one
    const result = await CallAudit.updateMany(
      { auditedBy: oldAuditedBy },
      { $set: { auditedBy: newAuditedBy } }
    );

    return NextResponse.json({
      success: true,
      message: `Updated ${result.modifiedCount} audits from "${oldAuditedBy}" to "${newAuditedBy}"`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error fixing audit ownership:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fix audit ownership" },
      { status: 500 }
    );
  }
}

// GET /api/audits/fix-ownership - Get summary of auditedBy values
export async function GET(request: NextRequest) {
  try {
    // Get current user from JWT token
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
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    // Only administrators can use this endpoint
    if (tokenResult.user.role !== "Administrator") {
      return NextResponse.json(
        {
          success: false,
          error: "Only administrators can view audit ownership summary",
        },
        { status: 403 }
      );
    }

    await connectDB();

    // Get count of audits grouped by auditedBy
    const summary = await CallAudit.aggregate([
      {
        $group: {
          _id: "$auditedBy",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get a sample of audits with details for review
    const sampleAudits = await CallAudit.find({})
      .select("_id agentName campaignName auditedBy auditType createdAt")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      summary: summary.map((item) => ({
        auditedBy: item._id,
        count: item.count,
      })),
      sampleAudits: sampleAudits.map((audit: any) => ({
        id: audit._id.toString(),
        agentName: audit.agentName,
        campaignName: audit.campaignName,
        auditedBy: audit.auditedBy,
        auditType: audit.auditType,
        createdAt: audit.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error getting audit ownership summary:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get audit ownership summary" },
      { status: 500 }
    );
  }
}
