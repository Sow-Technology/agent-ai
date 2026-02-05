import { NextRequest, NextResponse } from "next/server";
import { validateJWTToken } from "@/lib/jwtAuthService";
import CallAudit from "@/models/CallAudit";
import connectDB from "@/lib/mongoose";

/**
 * GET /api/audits/stats - Get aggregated dashboard statistics
 *
 * This endpoint is optimized for dashboard rendering by performing
 * aggregations at the database level instead of fetching all records.
 *
 * Logic matches the client-side calculations in DashboardTabContent:
 * - Pass threshold: overallScore >= 80
 * - Fatal error: auditResults.type === "Fatal" && score < 80
 * - ZTP (Zero Tolerance Policy): overallScore === 0
 */
export async function GET(request: NextRequest) {
  try {
    // Ensure database connection
    await connectDB();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const campaignName = searchParams.get("campaignName");
    const auditType = searchParams.get("auditType") as "ai" | "manual" | null;

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

    // Date range filter using createdAt (same as client-side uses auditDate which maps to createdAt)
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) {
        matchQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of day (23:59:59.999)
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        matchQuery.createdAt.$lte = endOfDay;
      }
    }

    // Campaign filter
    if (campaignName && campaignName !== "all") {
      matchQuery.campaignName = campaignName;
    }

    // Audit type filter
    if (auditType) {
      matchQuery.auditType = auditType;
    }

    // Role-based filtering (matches audits route filtering logic)
    if (currentUser) {
      const username = currentUser.username;
      const userId = currentUser.id;

      if (currentUser.role === "Agent") {
        // Agent sees audits where they are the subject - use $in for better index usage
        const agentIds = [username, userId].filter(Boolean);
        if (agentIds.length > 0) {
          matchQuery.agentUserId = { $in: agentIds };
        }
      } else if (currentUser.role === "Auditor") {
        // Auditor sees audits they performed - use $in for better index usage
        const auditorIds = [username, userId].filter(Boolean);
        if (auditorIds.length > 0) {
          matchQuery.auditedBy = { $in: auditorIds };
        }
      } else if (
        currentUser.role === "Project Admin" ||
        currentUser.role === "Manager"
      ) {
        // Project Admin and Manager see all audits within their project
        if (currentUser.projectId) {
          matchQuery.projectId = currentUser.projectId;
        }
      }
      // super_admin sees all - no additional filter
    }

    // Log the match query for debugging (can remove in production)
    console.log("Stats API - matchQuery:", JSON.stringify(matchQuery));

    // Run aggregation pipeline for all stats with timeout protection
    const aggregationPipeline: Array<Record<string, any>> = [
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
                aiAudits: {
                  $sum: { $cond: [{ $eq: ["$auditType", "ai"] }, 1, 0] },
                },
                manualAudits: {
                  $sum: { $cond: [{ $eq: ["$auditType", "manual"] }, 1, 0] },
                },
                // Pass is >= 80 (matching client-side logic)
                passCount: {
                  $sum: { $cond: [{ $gte: ["$overallScore", 80] }, 1, 0] },
                },
                // ZTP is score === 0 (matching client-side logic)
                ztpCount: {
                  $sum: { $cond: [{ $eq: ["$overallScore", 0] }, 1, 0] },
                },
              },
            },
          ],
          // Fatal errors analysis - type === "Fatal" && score < 80
          fatalErrors: [
            {
              $unwind: {
                path: "$auditResults",
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $match: {
                "auditResults.type": "Fatal",
                "auditResults.score": { $lt: 80 },
              },
            },
            {
              $group: {
                _id: null,
                totalFatalErrors: { $sum: 1 },
                fatalAuditIds: { $addToSet: "$_id" },
              },
            },
            {
              $project: {
                totalFatalErrors: 1,
                fatalAuditsCount: { $size: "$fatalAuditIds" },
              },
            },
          ],
          // Daily audits trend (grouped by date)
          dailyTrend: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                audits: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
            { $project: { date: "$_id", audits: 1, _id: 0 } },
          ],
          // Daily fatal errors trend
          dailyFatalTrend: [
            {
              $unwind: {
                path: "$auditResults",
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $match: {
                "auditResults.type": "Fatal",
                "auditResults.score": { $lt: 80 },
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                fatalErrors: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
            { $project: { date: "$_id", fatalErrors: 1, _id: 0 } },
          ],
          // Top QA issues - parameters with score < 80 (matching client-side logic)
          topIssues: [
            {
              $unwind: {
                path: "$auditResults",
                preserveNullAndEmptyArrays: false,
              },
            },
            { $match: { "auditResults.score": { $lt: 80 } } },
            {
              $group: {
                _id: "$auditResults.parameterName",
                count: { $sum: 1 },
                totalScore: { $sum: "$auditResults.score" },
                criticalCount: {
                  $sum: { $cond: [{ $lt: ["$auditResults.score", 50] }, 1, 0] },
                },
                type: { $first: "$auditResults.type" },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
              $project: {
                parameter: "$_id",
                count: 1,
                avgScore: {
                  $round: [{ $divide: ["$totalScore", "$count"] }, 1],
                },
                critical: { $gt: ["$criticalCount", 0] },
                type: 1,
                _id: 0,
              },
            },
          ],
          // Agent performance (matches client-side agentScores calculation)
          agentPerformance: [
            {
              $group: {
                _id: { agentUserId: "$agentUserId", agentName: "$agentName" },
                totalScore: { $sum: "$overallScore" },
                auditCount: { $sum: 1 },
                // Pass is >= 80 (matching client-side logic)
                passCount: {
                  $sum: { $cond: [{ $gte: ["$overallScore", 80] }, 1, 0] },
                },
              },
            },
            {
              $project: {
                agentId: "$_id.agentUserId",
                agentName: "$_id.agentName",
                avgScore: {
                  $round: [{ $divide: ["$totalScore", "$auditCount"] }, 1],
                },
                audits: "$auditCount",
                pass: "$passCount",
                fail: { $subtract: ["$auditCount", "$passCount"] },
                _id: 0,
              },
            },
            { $sort: { avgScore: -1 } },
          ],
          // Campaign performance (matches client-side campaignScores calculation)
          campaignPerformance: [
            {
              $group: {
                _id: "$campaignName",
                totalScore: { $sum: "$overallScore" },
                auditCount: { $sum: 1 },
                // Check for fatal errors in each audit for compliance
                complianceIssues: {
                  $sum: {
                    $cond: [
                      {
                        $gt: [
                          {
                            $size: {
                              $filter: {
                                input: { $ifNull: ["$auditResults", []] },
                                as: "r",
                                cond: {
                                  $and: [
                                    { $eq: ["$$r.type", "Fatal"] },
                                    { $lt: ["$$r.score", 80] },
                                  ],
                                },
                              },
                            },
                          },
                          0,
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
            {
              $project: {
                name: { $ifNull: ["$_id", "Uncategorized"] },
                avgScore: {
                  $round: [{ $divide: ["$totalScore", "$auditCount"] }, 1],
                },
                audits: "$auditCount",
                // Compliance = (auditCount - complianceIssues) / auditCount * 100
                compliance: {
                  $round: [
                    {
                      $multiply: [
                        {
                          $divide: [
                            { $subtract: ["$auditCount", "$complianceIssues"] },
                            "$auditCount",
                          ],
                        },
                        100,
                      ],
                    },
                    1,
                  ],
                },
                _id: 0,
              },
            },
            { $sort: { audits: -1 } },
          ],
          // Training needs - agents with lowest scores on specific parameters
          trainingNeeds: [
            {
              $unwind: {
                path: "$auditResults",
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $group: {
                _id: {
                  agentUserId: "$agentUserId",
                  agentName: "$agentName",
                  param: "$auditResults.parameterName",
                },
                totalScore: { $sum: "$auditResults.score" },
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                agentId: "$_id.agentUserId",
                agentName: "$_id.agentName",
                param: "$_id.param",
                avgScore: {
                  $round: [{ $divide: ["$totalScore", "$count"] }, 1],
                },
                count: 1,
                _id: 0,
              },
            },
            { $sort: { avgScore: 1 } },
            { $limit: 20 },
          ],
          // Sentiment distribution (matching client-side logic)
          sentiment: [
            {
              $group: {
                _id: null,
                totalAudits: { $sum: 1 },
                positive: {
                  $sum: { $cond: [{ $gte: ["$overallScore", 85] }, 1, 0] },
                },
                neutral: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $gte: ["$overallScore", 70] },
                          { $lt: ["$overallScore", 85] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                negative: {
                  $sum: { $cond: [{ $lt: ["$overallScore", 70] }, 1, 0] },
                },
              },
            },
          ],
        },
      },
    ];

    // Execute aggregation with timeout protection (30 seconds max)
    const aggregationResult = await CallAudit.aggregate(
      aggregationPipeline as any,
      {
        maxTimeMS: 30000, // 30 second timeout to prevent hanging
        allowDiskUse: true, // Allow using disk for large aggregations
      },
    );

    // Handle empty aggregation result
    const stats = aggregationResult?.[0] || null;

    // Log for debugging
    console.log(
      "Stats API - aggregation returned:",
      stats ? "data" : "empty",
      "totalAudits:",
      stats?.overview?.[0]?.totalAudits || 0,
    );

    // Process results with safe defaults
    const overview = stats?.overview?.[0] || {
      totalAudits: 0,
      totalScore: 0,
      aiAudits: 0,
      manualAudits: 0,
      passCount: 0,
      ztpCount: 0,
    };
    const fatalData = stats?.fatalErrors?.[0] || {
      totalFatalErrors: 0,
      fatalAuditsCount: 0,
    };
    const sentimentData = stats?.sentiment?.[0] || {
      totalAudits: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
    };

    const totalAudits = overview.totalAudits || 0;
    const overallQAScore =
      totalAudits > 0
        ? parseFloat((overview.totalScore / totalAudits).toFixed(1))
        : 0;
    const fatalRate =
      totalAudits > 0
        ? parseFloat(
            ((fatalData.fatalAuditsCount / totalAudits) * 100).toFixed(1),
          )
        : 0;
    const ztpRate =
      totalAudits > 0
        ? parseFloat(((overview.ztpCount / totalAudits) * 100).toFixed(1))
        : 0;
    const passRate =
      totalAudits > 0
        ? parseFloat(((overview.passCount / totalAudits) * 100).toFixed(1))
        : 0;

    // Agent performance: split into top and underperforming
    const allAgents = stats?.agentPerformance || [];
    const topAgents = allAgents.slice(0, 5);
    const underperformingAgents = allAgents
      .filter((a: any) => a.avgScore < 80)
      .slice(-5)
      .reverse();

    // Training needs: find the agent with the lowest score on any parameter
    const trainingNeedsList = stats?.trainingNeeds || [];
    const primaryTrainingNeed =
      trainingNeedsList.length > 0
        ? {
            agentName: trainingNeedsList[0].agentName,
            lowestParam: trainingNeedsList[0].param,
          }
        : null;

    // Build training needs list for modal (bottom 5 agents by score)
    const trainingNeedsForModal = underperformingAgents.map((agent: any) => {
      // Find worst parameter for this agent
      const agentParams = trainingNeedsList.filter(
        (t: any) => t.agentId === agent.agentId,
      );
      const worstParam = agentParams.length > 0 ? agentParams[0] : null;

      return {
        agentName: agent.agentName,
        agentId: agent.agentId,
        score: agent.avgScore,
        lowestParam: worstParam?.param || "N/A",
        lowestParamScore: worstParam?.avgScore || 0,
      };
    });

    // Fill in missing dates for daily trends
    const dailyAuditsTrend = stats?.dailyTrend || [];
    const dailyFatalTrend = stats?.dailyFatalTrend || [];

    // Generate all dates in range and fill with 0s for missing dates
    let filledDailyAuditsTrend = dailyAuditsTrend;
    let filledDailyFatalTrend = dailyFatalTrend;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dateMap = new Map(
        dailyAuditsTrend.map((d: any) => [d.date, d.audits]),
      );
      const fatalDateMap = new Map(
        dailyFatalTrend.map((d: any) => [d.date, d.fatalErrors]),
      );

      filledDailyAuditsTrend = [];
      filledDailyFatalTrend = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        filledDailyAuditsTrend.push({
          date: dateStr,
          audits: dateMap.get(dateStr) || 0,
        });
        filledDailyFatalTrend.push({
          date: dateStr,
          fatalErrors: fatalDateMap.get(dateStr) || 0,
        });
      }
    }

    // Process top issues - filter out FATAL/CRITICAL group
    const topIssues = (stats?.topIssues || []).filter((issue: any) => {
      const normalizedParam =
        issue.parameter?.toUpperCase().replace(/\s/g, "") || "";
      return normalizedParam !== "FATAL/CRITICAL";
    });

    // Calculate Pareto data from top issues
    const totalFailures = topIssues.reduce(
      (sum: number, i: any) => sum + i.count,
      0,
    );
    let cumulative = 0;
    const paretoData = topIssues.slice(0, 10).map((issue: any) => {
      const frequencyPercentage =
        totalFailures > 0 ? (issue.count / totalFailures) * 100 : 0;
      cumulative += issue.count;
      const cumulativePct =
        totalFailures > 0 ? (cumulative / totalFailures) * 100 : 0;
      return {
        parameter: issue.parameter,
        count: issue.count,
        frequencyPercentage: parseFloat(frequencyPercentage.toFixed(1)), // percent of total for this parameter
        cumulativeCount: cumulative, // cumulative raw count up to this parameter
        percentage: parseFloat(cumulativePct.toFixed(1)), // cumulative percentage (backwards compatible)
        cumulativePercentage: parseFloat(cumulativePct.toFixed(1)),
      };
    });

    // Sentiment percentages
    const sentimentPercentages = {
      positive:
        totalAudits > 0
          ? parseFloat(
              ((sentimentData.positive / totalAudits) * 100).toFixed(1),
            )
          : 0,
      neutral:
        totalAudits > 0
          ? parseFloat(((sentimentData.neutral / totalAudits) * 100).toFixed(1))
          : 0,
      negative:
        totalAudits > 0
          ? parseFloat(
              ((sentimentData.negative / totalAudits) * 100).toFixed(1),
            )
          : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        // Overview metrics
        overallQAScore,
        totalAudits,
        aiAudits: overview.aiAudits || 0,
        manualAudits: overview.manualAudits || 0,
        passRate,
        passCount: overview.passCount || 0,

        // Fatal errors
        fatalRate,
        totalFatalErrors: fatalData.totalFatalErrors || 0,
        fatalAuditsCount: fatalData.fatalAuditsCount || 0,

        // ZTP
        ztpCount: overview.ztpCount || 0,
        ztpRate,

        // Training needs
        trainingNeeds: primaryTrainingNeed,
        trainingNeedsList: trainingNeedsForModal,

        // Charts data
        dailyAuditsTrend: filledDailyAuditsTrend,
        dailyFatalTrend: filledDailyFatalTrend,
        topIssues: topIssues.slice(0, 5).map((issue: any) => ({
          id: issue.parameter,
          reason: issue.parameter,
          count: issue.count,
          critical: issue.critical,
          avgScore: issue.avgScore,
          subParameters: [],
          suggestion: `Average score: ${issue.avgScore}%. Focus on improving this parameter.`,
        })),
        paretoData,

        // Performance data
        agentPerformance: {
          topAgents: topAgents.map((a: any) => ({
            id: a.agentId,
            name: a.agentName,
            score: a.avgScore,
            audits: a.audits,
            pass: a.pass,
            fail: a.fail,
          })),
          underperformingAgents: underperformingAgents.map((a: any) => ({
            id: a.agentId,
            name: a.agentName,
            score: a.avgScore,
            audits: a.audits,
            pass: a.pass,
            fail: a.fail,
          })),
        },
        campaignPerformance: (stats?.campaignPerformance || []).map(
          (c: any) => ({
            name: c.name,
            score: c.avgScore,
            compliance: c.compliance,
            audits: c.audits,
          }),
        ),

        // Sentiment
        sentiment: sentimentPercentages,

        // Compliance data
        compliance: {
          interactionsWithIssues: fatalData.fatalAuditsCount || 0,
          totalAuditedInteractionsForCompliance: totalAudits,
          complianceRate:
            totalAudits > 0
              ? parseFloat(
                  (
                    ((totalAudits - fatalData.fatalAuditsCount) / totalAudits) *
                    100
                  ).toFixed(1),
                )
              : 0,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching audit stats:", error);

    // Provide more specific error messages
    let errorMessage = "Failed to fetch audit statistics";
    let statusCode = 500;

    if (error?.name === "MongooseError" || error?.name === "MongoError") {
      if (error.message?.includes("buffering timed out") || error.code === 50) {
        errorMessage =
          "Database query timed out. Please try with a smaller date range.";
        statusCode = 504;
      } else if (error.message?.includes("connection")) {
        errorMessage = "Database connection error. Please try again.";
        statusCode = 503;
      }
    } else if (error?.code === "ECONNRESET" || error?.code === "ETIMEDOUT") {
      errorMessage = "Request timed out. Please try with a smaller date range.";
      statusCode = 504;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode },
    );
  }
}
