import os from "os";
import { qaAuditCall } from "@/ai/flows/qa-audit-flow";
import connectDB from "@/lib/mongoose";
import {
  claimJobs,
  markJobFailed,
  markJobSucceeded,
  getCampaignById,
} from "@/lib/campaignService";
import {
  getAllQAParameters,
  getQAParameterById,
} from "@/lib/qaParameterService";
import { createAudit } from "@/lib/auditService";
import type { QAParameterDocument } from "@/lib/models";
import { audioFetchRateLimiter } from "@/lib/geminiRateLimiter";

function getParallelismCap() {
  const max = parseInt(process.env.BULK_AUDIT_MAX_PARALLEL || "1", 10);
  const freeMemRatio = os.freemem() / os.totalmem();
  const load = os.loadavg?.()[0] ?? 0;
  const cpuCount = os.cpus()?.length || 1;
  let allowed = Number.isFinite(max) && max > 0 ? max : 3;
  if (freeMemRatio < 0.2) {
    allowed = Math.max(1, Math.floor(allowed / 2));
  }
  if (load > cpuCount) {
    allowed = Math.max(1, allowed - 1);
  }
  return Math.max(1, allowed);
}

function parseDateWithTimezone(input: string | undefined, timezone: string) {
  if (!input) return new Date();
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return new Date();
  try {
    const locale = parsed.toLocaleString("en-US", { timeZone: timezone });
    const inTz = new Date(locale);
    const diff = parsed.getTime() - inTz.getTime();
    return new Date(parsed.getTime() + diff);
  } catch (e) {
    return parsed;
  }
}

async function fetchAudioDataUri(audioUrl: string) {
  // Apply rate limiting before fetching audio
  await audioFetchRateLimiter.waitForSlot();

  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const base64Audio = Buffer.from(arrayBuffer).toString("base64");
  const contentType = response.headers.get("content-type") || "audio/wav";
  return `data:${contentType};base64,${base64Audio}`;
}

function toAuditParameters(params: QAParameterDocument[] | null) {
  if (!params || params.length === 0) {
    return [
      {
        id: "default",
        name: "Default",
        subParameters: [
          {
            id: "default-1",
            name: "Overall Quality",
            weight: 100,
            type: "Non-Fatal" as const,
          },
        ],
      },
    ];
  }
  return params[0].parameters.map((p) => ({
    id: p.id,
    name: p.name,
    subParameters: p.subParameters.map((s) => ({
      id: s.id,
      name: s.name,
      weight: s.weight,
      type: s.type,
    })),
  }));
}

interface CsvJobPayload {
  full_name?: string;
  employee_id?: string;
  rid_phone?: string;
  call_type?: string;
  sub_dispo?: string;
  email_id?: string;
  call_datetime?: string;
  customer_name?: string;
  client_id?: string;
  customer_id?: string;
  recording_url?: string;
  call_duration?: string;
  file_no?: string;
}

function mapRowToAuditPayload(
  row: CsvJobPayload,
  timezone: string,
  campaignId?: string
) {
  const callDate = parseDateWithTimezone(row.call_datetime, timezone);
  const baseCallId = row.rid_phone || `call-${Date.now()}-${Math.random()}`;
  const callId = campaignId ? `${campaignId}-${baseCallId}` : baseCallId;
  const agentName = row.full_name || "Unknown Agent";
  const agentUserId = row.employee_id || agentName;
  const campaignName = row.client_id || "Bulk Campaign";
  return {
    callDate,
    callId,
    agentName,
    agentUserId,
    customerName: row.customer_name || "",
    campaignId: campaignName,
    campaignName,
    audioUrl: row.recording_url || "",
    callType: row.call_type,
    subDispo: row.sub_dispo,
    callDuration: row.call_duration,
  };
}

export async function runBulkWorkerOnce() {
  await connectDB();
  const limit = getParallelismCap();
  let processedTotal = 0;

  // Process in batches to avoid long single requests, but drain queue when possible
  while (true) {
    const jobs = await claimJobs(limit);
    if (jobs.length === 0) break;

    await Promise.all(
      jobs.map(async (job) => {
        const startedAt = Date.now();
        try {
          const campaign = await getCampaignById(job.campaignId.toString());
          if (!campaign) {
            throw new Error("Campaign missing");
          }

          let activeParams;
          if (campaign.qaParameterSetId) {
            const param = await getQAParameterById(campaign.qaParameterSetId);
            activeParams = param ? [param] : await getAllQAParameters();
          } else {
            activeParams = await getAllQAParameters();
          }
          const auditParameters = toAuditParameters(activeParams);

          const mapped = mapRowToAuditPayload(
            job.payload as CsvJobPayload,
            campaign.timezone || "UTC",
            campaign._id.toString()
          );

          if (!mapped.audioUrl) {
            throw new Error("Missing recording URL");
          }

          const audioDataUri = await fetchAudioDataUri(mapped.audioUrl);

          const qaResult = await qaAuditCall({
            agentUserId: mapped.agentUserId,
            campaignName: mapped.campaignName,
            audioDataUri,
            callLanguage: "English",
            auditParameters,
            applyRateLimit: campaign.applyRateLimit,
          } as any);

          const auditResults = (qaResult.auditResults || []).map(
            (result: any) => ({
              parameterId: result.parameter || "unknown",
              parameterName: result.parameter || "Unknown",
              score: typeof result.score === "number" ? result.score : 0,
              maxScore:
                typeof result.weightedScore === "number" &&
                result.weightedScore > 0
                  ? result.weightedScore
                  : 100,
              type: (result.type as any) || "Non-Fatal",
              comments: result.comments,
            })
          );

          const savedAudit = await createAudit({
            callId: mapped.callId,
            agentName: mapped.agentName,
            agentUserId: mapped.agentUserId,
            customerName: mapped.customerName,
            callDate: mapped.callDate,
            campaignId: mapped.campaignId,
            campaignName: mapped.campaignName,
            projectId: campaign.projectId,
            auditResults,
            overallScore: qaResult.overallScore || 0,
            maxPossibleScore: 100,
            transcript:
              qaResult.englishTranslation ||
              qaResult.transcriptionInOriginalLanguage,
            englishTranslation: qaResult.englishTranslation,
            audioUrl: mapped.audioUrl,
            auditedBy: campaign.createdBy,
            auditType: "ai",
            tokenUsage: qaResult.tokenUsage,
            auditDurationMs: qaResult.auditDurationMs,
          });

          if (!savedAudit) {
            throw new Error("Failed to persist audit");
          }

          await markJobSucceeded(
            job._id.toString(),
            savedAudit.id,
            Date.now() - startedAt
          );
        } catch (error: any) {
          await markJobFailed(
            job._id.toString(),
            error?.message || "Job failed",
            Date.now() - startedAt
          );
        }
      })
    );

    processedTotal += jobs.length;

    // Keep request bounded to avoid timeouts when queue is huge
    if (processedTotal >= limit * 5) break;
  }

  return { processed: processedTotal };
}
