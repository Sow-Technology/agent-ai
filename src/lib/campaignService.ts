import connectDB from "./mongoose";
import mongoose from "mongoose";
import Campaign, { ICampaign, CampaignStatus } from "@/models/Campaign";
import CampaignJob, {
  ICampaignJob,
  CampaignJobStatus,
} from "@/models/CampaignJob";
import CallAudit from "@/models/CallAudit";

interface CreateCampaignParams {
  name: string;
  timezone: string;
  createdBy: string;
  projectId?: string;
  rows: Record<string, any>[];
}

interface ListCampaignParams {
  role?: string | null;
  userId?: string | null;
  projectId?: string | null;
}

async function ensureDb() {
  await connectDB();
}

export async function createCampaignWithJobs(
  params: CreateCampaignParams
): Promise<ICampaign> {
  await ensureDb();
  const { name, timezone, createdBy, projectId, rows } = params;
  const campaign = await Campaign.create({
    name: name || "Untitled Campaign",
    timezone: timezone || "UTC",
    status: "pending" satisfies CampaignStatus,
    totalJobs: rows.length,
    createdBy,
    projectId,
    startedAt: new Date(),
  });

  if (rows.length > 0) {
    const jobs = rows.map((payload, index) => ({
      campaignId: campaign._id,
      rowIndex: index,
      payload,
      status: "queued" as CampaignJobStatus,
    }));
    await CampaignJob.insertMany(jobs);
  }

  return campaign;
}

export async function listCampaigns(
  params: ListCampaignParams
): Promise<ICampaign[]> {
  await ensureDb();
  const { role, userId, projectId } = params;
  const filter: Record<string, any> = {};

  if (role === "Agent" || role === "Auditor" || role === "QA Analyst") {
    filter.createdBy = userId;
  } else if (role === "Project Admin") {
    if (projectId) {
      filter.projectId = projectId;
    }
  }

  return Campaign.find(filter).sort({ createdAt: -1 }).lean<ICampaign[]>();
}

export async function getCampaignById(
  campaignId: string
): Promise<ICampaign | null> {
  await ensureDb();
  return Campaign.findById(campaignId).lean<ICampaign | null>();
}

export async function cancelCampaign(
  campaignId: string
): Promise<ICampaign | null> {
  await ensureDb();
  await CampaignJob.updateMany(
    { campaignId, status: { $in: ["queued", "processing"] } },
    { status: "canceled", finishedAt: new Date() }
  );
  const canceled = await Campaign.findByIdAndUpdate(
    campaignId,
    { status: "canceled", finishedAt: new Date() },
    { new: true }
  ).lean<ICampaign | null>();
  await recomputeCampaignProgress(campaignId);
  return canceled;
}

export async function claimJobs(limit: number): Promise<ICampaignJob[]> {
  await ensureDb();
  const claimed: ICampaignJob[] = [];
  for (let i = 0; i < limit; i += 1) {
    const job = await CampaignJob.findOneAndUpdate(
      { status: "queued" },
      { status: "processing", startedAt: new Date(), error: undefined },
      { sort: { createdAt: 1 }, new: true }
    );
    if (!job) break;
    claimed.push(job);
  }
  if (claimed.length > 0) {
    const campaignIds = Array.from(
      new Set(claimed.map((job) => job.campaignId.toString()))
    );
    await Campaign.updateMany(
      { _id: { $in: campaignIds } },
      { status: "running" }
    );
  }
  return claimed;
}

export async function markJobSucceeded(
  jobId: string,
  callAuditId: string,
  durationMs?: number
) {
  await ensureDb();
  const job = await CampaignJob.findByIdAndUpdate(
    jobId,
    {
      status: "succeeded",
      callAuditId,
      durationMs,
      finishedAt: new Date(),
    },
    { new: true }
  );
  if (job) {
    await recomputeCampaignProgress(job.campaignId.toString());
  }
}

export async function markJobFailed(
  jobId: string,
  error: string,
  durationMs?: number
) {
  await ensureDb();
  const job = await CampaignJob.findByIdAndUpdate(
    jobId,
    {
      status: "failed",
      error,
      durationMs,
      finishedAt: new Date(),
      $inc: { retries: 1 },
    },
    { new: true }
  );
  if (job) {
    await recomputeCampaignProgress(job.campaignId.toString());
  }
}

export async function markJobCanceled(jobId: string) {
  await ensureDb();
  const job = await CampaignJob.findByIdAndUpdate(
    jobId,
    { status: "canceled", finishedAt: new Date() },
    { new: true }
  );
  if (job) {
    await recomputeCampaignProgress(job.campaignId.toString());
  }
}

export async function getCampaignStatus(campaignId: string) {
  await ensureDb();
  const campaign = await Campaign.findById(campaignId).lean<ICampaign | null>();
  if (!campaign) return null;
  const progress = await recomputeCampaignProgress(campaignId);
  return { campaign: { ...campaign, ...progress } };
}

export async function getCampaignJobs(
  campaignId: string
): Promise<ICampaignJob[]> {
  await ensureDb();
  return CampaignJob.find({ campaignId })
    .sort({ rowIndex: 1 })
    .lean<ICampaignJob[]>();
}

export async function getReportRows(campaignId: string) {
  await ensureDb();
  const jobs = await CampaignJob.find({ campaignId }).lean();
  const auditIds = jobs
    .map((j) => j.callAuditId)
    .filter((id): id is string => Boolean(id));
  const audits = await CallAudit.find({ _id: { $in: auditIds } }).lean();
  const auditMap = new Map(
    audits.map((audit: any) => [audit._id.toString(), audit])
  );
  return jobs.map((job) => ({
    job,
    audit: job.callAuditId ? auditMap.get(job.callAuditId) : null,
  }));
}

async function recomputeCampaignProgress(campaignId: string) {
  await ensureDb();
  const campaign = await Campaign.findById(campaignId).lean<ICampaign | null>();
  if (!campaign) return null;

  const counts = await CampaignJob.aggregate([
    { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const durations = await CampaignJob.aggregate([
    {
      $match: {
        campaignId: new mongoose.Types.ObjectId(campaignId),
        durationMs: { $exists: true },
      },
    },
    {
      $group: {
        _id: null,
        avgDurationMs: { $avg: "$durationMs" },
      },
    },
  ]);

  const countByStatus: Record<string, number> = counts.reduce(
    (acc: Record<string, number>, item: { _id: string; count: number }) => {
      acc[item._id] = item.count;
      return acc;
    },
    {}
  );

  const completedJobs = countByStatus.succeeded || 0;
  const failedJobs = countByStatus.failed || 0;
  const canceledJobs = countByStatus.canceled || 0;
  const totalJobs = campaign.totalJobs;
  const remainingJobs = Math.max(
    totalJobs - completedJobs - failedJobs - canceledJobs,
    0
  );

  const avgDurationMs = durations[0]?.avgDurationMs as number | undefined;
  const etaSeconds = avgDurationMs
    ? Math.round((remainingJobs * avgDurationMs) / 1000)
    : undefined;

  let status: CampaignStatus = campaign.status;
  if (campaign.status === "canceled") {
    status = "canceled";
  } else if (remainingJobs === 0) {
    status = failedJobs > 0 ? "completed_with_errors" : "completed";
  } else {
    status = "running";
  }

  const finishedAt =
    status === "completed" ||
    status === "completed_with_errors" ||
    status === "canceled"
      ? campaign.finishedAt || new Date()
      : campaign.finishedAt;

  await Campaign.findByIdAndUpdate(campaignId, {
    completedJobs,
    failedJobs,
    canceledJobs,
    etaSeconds,
    status,
    finishedAt,
  });

  return {
    completedJobs,
    failedJobs,
    canceledJobs,
    remainingJobs,
    etaSeconds,
    status,
  };
}
