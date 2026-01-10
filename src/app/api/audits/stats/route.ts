import { NextRequest, NextResponse } from "next/server";
import { validateJWTToken } from "@/lib/jwtAuthService";
import CallAudit from "@/models/CallAudit";

/**
 * GET /api/audits/stats - Get aggregated dashboard statistics
 * 
 * This endpoint is optimized for dashboard rendering by performing
 * aggregations at the database level instead of fetching all records.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const campaignName = searchParams.get("campaignName");

    // Get current user from JWT token for role-based filtering
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    let currentUser = null;

    if (token) {
      const tokenResult = await validateJWTToken(token);
      if (tokenResult.valid && tokenResult.user) {
        currentUser = tokenResult.user;
      }
    }

    // Build match query
    const matchQuery: any = {};

    // Date range filter
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) {
        matchQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of day
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        matchQuery.createdAt.$lte = endOfDay;
      }
    }

    // Campaign filter
    if (campaignName && campaignName !== "all") {
      matchQuery.campaignName = campaignName;
    }

    // Role-based filtering
    if (currentUser) {
      if (currentUser.role === "Agent") {
        matchQuery.$or = [
          { agentUserId: currentUser.username },
          { agentUserId: currentUser.id }
        ];
      } else if (currentUser.role === "Auditor") {
        matchQuery.$or = [
          { auditedBy: currentUser.username },
          { auditedBy: currentUser.id }
        ];
      } else if (currentUser.role === "Project Admin" || currentUser.role === "Manager") {
        if (currentUser.projectId) {
          matchQuery.projectId = currentUser.projectId;
        }
      }
      // Administrator sees all - no additional filter
    }

    // Run aggregation pipeline for all stats
    const [stats] = await CallAudit.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          // Basic counts and scores
          overview: [
            {
              $group: {
                _id: null,
                totalAudits: { $sum: 1 },
                totalScore: { $sum: "$overallScore" },
                aiAudits: { $sum: { $cond: [{ $eq: ["$auditType", "ai"] }, 1, 0] } },
                manualAudits: { $sum: { $cond: [{ $eq: ["$auditType", "manual"] }, 1, 0] } },
                passCount: { $sum: { $cond: [{ $gte: ["$overallScore", 80] }, 1, 0] } },
              }
            }
          ],
          // Fatal errors analysis
          fatalErrors: [
            { $unwind: { path: "$auditResults", preserveNullAndEmptyArrays: false } },
            { $match: { "auditResults.type": "Fatal", "auditResults.score": { $lt: 80 } } },
            {
              $group: {
                _id: null,
                totalFatalErrors: { $sum: 1 },
                fatalAudits: { $addToSet: "$_id" }
              }
            },
            {
              $project: {
                totalFatalErrors: 1,
                fatalAuditsCount: { $size: "$fatalAudits" }
              }
            }
          ],
          // ZTP audits (zero tolerance policy - score = 0)
          ztpAudits: [
            { $match: { overallScore: 0 } },
            { $count: "count" }
          ],
          // Daily audits trend
          dailyTrend: [
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                audits: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } },
            { $project: { date: "$_id", audits: 1, _id: 0 } }
          ],
          // Daily fatal errors trend
          dailyFatalTrend: [
            { $unwind: { path: "$auditResults", preserveNullAndEmptyArrays: false } },
            { $match: { "auditResults.type": "Fatal", "auditResults.score": { $lt: 80 } } },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                fatalErrors: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } },
            { $project: { date: "$_id", fatalErrors: 1, _id: 0 } }
          ],
          // Top QA issues (parameters with low scores)
          topIssues: [
            { $unwind: { path: "$auditResults", preserveNullAndEmptyArrays: false } },
            { $match: { "auditResults.score": { $lt: 80 } } },
            {
              $group: {
                _id: "$auditResults.parameterName",
                count: { $sum: 1 },
                avgScore: { $avg: "$auditResults.score" },
                criticalCount: { $sum: { $cond: [{ $lt: ["$auditResults.score", 50] }, 1, 0] } }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
              $project: {
                parameter: "$_id",
                count: 1,
                avgScore: { $round: ["$avgScore", 1] },
                critical: { $gt: ["$criticalCount", 0] },
                _id: 0
              }
            }
          ],
          // Agent performance (top and bottom performers)
          agentPerformance: [
            {
              $group: {
                _id: { agentUserId: "$agentUserId", agentName: "$agentName" },
                totalScore: { $sum: "$overallScore" },
                auditCount: { $sum: 1 },
                passCount: { $sum: { $cond: [{ $gte: ["$overallScore", 80] }, 1, 0] } }
              }
            },
            {
              $project: {
                agentId: "$_id.agentUserId",
                agentName: "$_id.agentName",
                avgScore: { $round: [{ $divide: ["$totalScore", "$auditCount"] }, 1] },
                audits: "$auditCount",
                passCount: 1,
                failCount: { $subtract: ["$auditCount", "$passCount"] },
                _id: 0
              }
            },
            { $sort: { avgScore: -1 } }
          ],
          // Campaign performance
          campaignPerformance: [
            {
              $group: {
                _id: "$campaignName",
                totalScore: { $sum: "$overallScore" },
                auditCount: { $sum: 1 },
                passCount: { $sum: { $cond: [{ $gte: ["$overallScore", 80] }, 1, 0] } }
              }
            },
            {
              $project: {
                name: "$_id",
                avgScore: { $round: [{ $divide: ["$totalScore", "$auditCount"] }, 1] },
                audits: "$auditCount",
                compliance: { $round: [{ $multiply: [{ $divide: ["$passCount", "$auditCount"] }, 100] }, 1] },
                _id: 0
              }
            },
            { $sort: { audits: -1 } }
          ],
          // Training needs (agents with lowest scores on specific parameters)
          trainingNeeds: [
            { $unwind: { path: "$auditResults", preserveNullAndEmptyArrays: false } },
            {
              $group: {
                _id: { agentUserId: "$agentUserId", agentName: "$agentName", param: "$auditResults.parameterName" },
                avgScore: { $avg: "$auditResults.score" },
                count: { $sum: 1 }
              }
            },
            { $match: { avgScore: { $lt: 70 }, count: { $gte: 2 } } },
            { $sort: { avgScore: 1 } },
            { $limit: 10 },
            {
              $project: {
                agentId: "$_id.agentUserId",
                agentName: "$_id.agentName",
                lowestParam: "$_id.param",
                avgScore: { $round: ["$avgScore", 1] },
                _id: 0
              }
            }
          ]
        }
      }
    ]);

    // Process results
    const overview = stats?.overview?.[0] || { totalAudits: 0, totalScore: 0, aiAudits: 0, manualAudits: 0, passCount: 0 };
    const fatalData = stats?.fatalErrors?.[0] || { totalFatalErrors: 0, fatalAuditsCount: 0 };
    const ztpCount = stats?.ztpAudits?.[0]?.count || 0;

    const totalAudits = overview.totalAudits || 0;
    const overallQAScore = totalAudits > 0 ? Math.round((overview.totalScore / totalAudits) * 10) / 10 : 0;
    const fatalRate = totalAudits > 0 ? Math.round((fatalData.fatalAuditsCount / totalAudits) * 1000) / 10 : 0;

    // Agent performance: split into top and underperforming
    const allAgents = stats?.agentPerformance || [];
    const topAgents = allAgents.slice(0, 5);
    const underperformingAgents = allAgents.filter((a: any) => a.avgScore < 80).slice(-5).reverse();

    // Training needs: find the most common training need
    const trainingNeedsList = stats?.trainingNeeds || [];
    const primaryTrainingNeed = trainingNeedsList.length > 0 
      ? { agentName: trainingNeedsList[0].agentName, lowestParam: trainingNeedsList[0].lowestParam }
      : null;

    return NextResponse.json({
      success: true,
      data: {
        // Overview metrics
        overallQAScore,
        totalAudits,
        aiAudits: overview.aiAudits || 0,
        manualAudits: overview.manualAudits || 0,
        passRate: totalAudits > 0 ? Math.round((overview.passCount / totalAudits) * 1000) / 10 : 0,

        // Fatal errors
        fatalRate,
        totalFatalErrors: fatalData.totalFatalErrors || 0,
        fatalAuditsCount: fatalData.fatalAuditsCount || 0,

        // ZTP
        ztpCount,
        ztpRate: totalAudits > 0 ? Math.round((ztpCount / totalAudits) * 1000) / 10 : 0,

        // Training needs
        trainingNeeds: primaryTrainingNeed,
        trainingNeedsList,

        // Charts data
        dailyAuditsTrend: stats?.dailyTrend || [],
        dailyFatalTrend: stats?.dailyFatalTrend || [],
        topIssues: stats?.topIssues || [],

        // Performance data
        agentPerformance: {
          topAgents,
          underperformingAgents
        },
        campaignPerformance: stats?.campaignPerformance || []
      }
    });

  } catch (error) {
    console.error("Error fetching audit stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch audit statistics" },
      { status: 500 }
    );
  }
}
