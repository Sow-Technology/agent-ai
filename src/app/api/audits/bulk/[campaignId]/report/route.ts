import { NextRequest, NextResponse } from "next/server";
import { getReportRows, getCampaignById } from "@/lib/campaignService";
import { validateJWTToken } from "@/lib/jwtAuthService";

interface JobRow {
  rowIndex: number;
  status: string;
  error?: string;
  payload: Record<string, any>;
  retries: number;
  durationMs?: number;
  startedAt?: string;
  finishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  agentName?: string;
  agentUserId?: string;
  callId?: string;
  overallScore?: number;
  maxPossibleScore?: number;
  callDate?: string;
  campaignName?: string;
  audioUrl?: string; // from audit
}

export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    let userRole = '';
    if (token) {
        const validation = await validateJWTToken(token);
        if (validation.valid && validation.user) {
            userRole = validation.user.role;
        }
    }

    const searchParams = request.nextUrl.searchParams;
    const includeTokens = searchParams.get("includeTokens") === "true";

    // Only Admin can include tokens
    const shouldIncludeTokens = includeTokens && userRole === "super_admin";

    const rowsData = await getReportRows(params.campaignId);
    
    // Collect all parameter names for dynamic headers
    const allParameterNames = new Set<string>();
    rowsData.forEach((entry: any) => {
      const audit = entry.audit;
      if (audit && audit.auditResults) {
        audit.auditResults.forEach((res: any) => {
          if (res.parameterName) allParameterNames.add(res.parameterName);
        });
      }
    });
    const parameterNamesList = Array.from(allParameterNames);

    const headers = [
      "Employee ID",
      "Process/Campaign",
      "Call Category",
      "Associate Name",
      "Audit ID",
      "Call Duration",
    //   "Audit Date", // Removed or added based on availability? Let's match dashboard 
      "Audit Date",
      "QA/Audited By",
      "Pass/Fail",
      "Audit Duration",
      "Start Time",
      "End Time",
      "Overall Score",
      "Fatal Status",
      "Fatal Count",
      ...parameterNamesList,
    ];

    if (shouldIncludeTokens) {
        headers.push("Input Tokens", "Output Tokens", "Total Tokens");
    }

    const csvRows = [headers.join(",")];

    rowsData.forEach((entry: any) => {
      const audit = entry.audit;
      const job = entry.job;

      // Fallback values from payload if audit missing
      const agentName = audit?.agentName || job?.payload?.full_name || "";
      const agentUserId = audit?.agentUserId || job?.payload?.employee_id || "";
      const campaignName = audit?.campaignName || job?.payload?.campaign || ""; // payload might not have campaign
      const auditId = audit?._id || job?.callAuditId || "";
      const auditDate = audit?.createdAt ? new Date(audit.createdAt) : (job?.finishedAt ? new Date(job.finishedAt) : new Date());
      
      const overallScore = audit?.overallScore ?? 0; // Default to 0 if no audit

      // Logic from dashboard
      let callCategory = "Bad";
      if (overallScore >= 90) callCategory = "Good";
      else if (overallScore >= 80) callCategory = "Average";

      const passFail = overallScore >= 90 ? "Pass" : "Fail";

      // Fatal checks
      const auditResults = audit?.auditResults || [];
      const fatalCount = auditResults.filter((r: any) => r.isFatal || r.severity === "fatal").length;
       let fatalStatus = "Non - Fatal";
        if (fatalCount > 0) {
        fatalStatus = "Fatal";
        } else if (overallScore === 0 && audit) { // Only ZTP if audit exists and score is 0
        fatalStatus = "ZTP";
        } else if (!audit) {
            fatalStatus = ""; // No audit, no fatal status
        }

      const formattedDate = `${auditDate.getDate().toString().padStart(2, "0")}-${(auditDate.getMonth() + 1).toString().padStart(2, "0")}-${auditDate.getFullYear()}`;

      // Durations
      let auditDuration = "";
      if (audit?.auditDurationMs) {
         const d = audit.auditDurationMs;
         auditDuration = new Date(d).toISOString().substr(11, 12); // HH:MM:SS.mmm roughly, or custom format
         // simplified for now, or copy exact helper:
          const hours = Math.floor(d / (1000 * 60 * 60));
          const minutes = Math.floor((d % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((d % (1000 * 60)) / 1000);
          const milliseconds = d % 1000;
          auditDuration = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
      }

      // Start/End times logic omitted or simplified if missing
      const startTime = "";
      const endTime = "";
      
      // Call Duration fallback
      // Try audit.audioDuration, then job payload?
      let callDuration = "";
      if (audit?.audioDuration) {
          const d = parseFloat(audit.audioDuration);
           const minutes = Math.floor(d / 60);
            const seconds = Math.floor(d % 60);
            callDuration = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      }

      // Parameter Scores
        const parameterScoresMap: Record<string, string> = {};
        auditResults.forEach((result: any) => {
        if (result?.parameterName) {
            parameterScoresMap[result.parameterName] =
            result?.score?.toString() || result?.percentage?.toString() || "";
        }
        });

        const parameterScores = parameterNamesList.map(
        (paramName) => parameterScoresMap[paramName] || ""
        );

      const row = [
        agentUserId,
        campaignName,
        callCategory,
        agentName,
        auditId,
        callDuration,
        formattedDate,
        audit ? (audit.auditType === 'ai' ? 'AI' : 'Manual') : '',
        passFail,
        auditDuration,
        startTime,
        endTime,
        overallScore.toString(),
        fatalStatus,
        fatalCount.toString(),
        ...parameterScores,
      ];

      if (shouldIncludeTokens) {
        row.push(
            audit?.tokenUsage?.inputTokens?.toString() || "0",
            audit?.tokenUsage?.outputTokens?.toString() || "0",
            audit?.tokenUsage?.totalTokens?.toString() || "0"
        );
      }
      
      csvRows.push(row.map(v => `"${v}"`).join(","));
    });

    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=campaign-${params.campaignId}.csv`,
      },
    });
  } catch (error) {
    console.error("Bulk report error", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
