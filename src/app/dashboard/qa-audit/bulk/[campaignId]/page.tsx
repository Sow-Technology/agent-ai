"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/authUtils";

import {
  ArrowLeft,
  ArrowRight,
  Download,
  RefreshCcw,
  RotateCcw,
} from "lucide-react";
import type { User } from "@/types/auth";

interface CampaignDetail {
  _id: string;
  name: string;
  timezone: string;
  status: string;
  totalJobs: number;
  completedJobs?: number;
  failedJobs?: number;
  canceledJobs?: number;
  processingJobs?: number;
  etaSeconds?: number;
  createdAt?: string;
  startedAt?: string;
  finishedAt?: string;
}

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
  agentName: string;
  agentUserId: string;
  callId: string;
  overallScore: number | null;
  maxPossibleScore: number | null;
  recordingUrl: string;
  auditResults: {
    parameterId: string;
    parameterName: string;
    score: number;
    maxScore: number;
    type: string;
    comments?: string;
  }[];
  transcript?: string;
  englishTranslation?: string;
  tokenUsage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  } | null;
  auditDurationMs?: number | null;
  callDate?: string | Date | null;
  customerName?: string;
  campaignName?: string;
}

export default function CampaignPreviewPage() {
  const params = useParams<{ campaignId: string }>();
  const campaignId = params?.campaignId;
  const router = useRouter();
  const { toast } = useToast();

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobRow | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const totalPages = Math.ceil(jobs.length / ITEMS_PER_PAGE);
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return jobs.slice(start, start + ITEMS_PER_PAGE);
  }, [jobs, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [campaignId]);

  const progress = useMemo(() => {
    if (!campaign || !campaign.totalJobs) return 0;
    const done =
      (campaign.completedJobs || 0) +
      (campaign.failedJobs || 0) +
      (campaign.canceledJobs || 0);
    return Math.round((done / campaign.totalJobs) * 100);
  }, [campaign]);

  const statusLabel = (status: string) => status.replace(/_/g, " ");

  const etaLabel = (etaSeconds?: number) => {
    if (!etaSeconds || etaSeconds <= 0) return "-";
    if (etaSeconds < 90) return `${etaSeconds}s`;
    const minutes = Math.ceil(etaSeconds / 60);
    return `${minutes} min`;
  };

  const fetchCampaign = async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/audits/bulk/${campaignId}`, {
        headers: await getAuthHeaders(),
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load campaign");
      }
      setCampaign(json.data?.campaign || null);
    } catch (err: any) {
      toast({
        title: "Load failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/user", {
        headers: await getAuthHeaders(),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCurrentUser(json.user);
      }
    } catch (e) {
      console.error("Failed to fetch user", e);
    }
  };

  const fetchJobs = async () => {
    if (!campaignId) return;
    setJobsLoading(true);
    try {
      const res = await fetch(`/api/audits/bulk/${campaignId}/jobs`, {
        headers: await getAuthHeaders(),
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load jobs");
      }
      setJobs(json.data || []);
    } catch (err: any) {
      toast({
        title: "Jobs failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setJobsLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchCampaign(), fetchJobs(), fetchCurrentUser()]);
  };

  const handleRetryFailedJobs = async () => {
    if (!campaignId) return;
    try {
      const res = await fetch(`/api/audits/bulk/${campaignId}?action=retry`, {
        method: "POST",
        headers: await getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error("Failed to retry failed jobs");
      }

      const json = await res.json();
      toast({
        title: "Retry initiated",
        description: `Retried ${json.data.retried} failed jobs.`,
      });

      await refreshAll();
    } catch (error) {
      console.error("Retry failed", error);
      toast({
        title: "Retry failed",
        description: "Could not retry failed jobs",
        variant: "destructive",
      });
    }
  };

  const handleResetStuckJobs = async () => {
    if (!campaignId) return;
    try {
      const res = await fetch(
        `/api/audits/bulk/${campaignId}?action=reset-stuck`,
        {
          method: "POST",
          headers: await getAuthHeaders(),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to reset stuck jobs");
      }

      const json = await res.json();
      toast({
        title: "Reset initiated",
        description: `Reset ${json.data.reset} stuck processing jobs.`,
      });

      await refreshAll();
    } catch (error) {
      console.error("Reset failed", error);
      toast({
        title: "Reset failed",
        description: "Could not reset stuck jobs",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/qa-audit/bulk")}
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <div>
            <div className="text-lg font-semibold">Campaign preview</div>
            <div className="text-sm text-muted-foreground">
              Job-level progress and scores
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={loading || jobsLoading}
          >
            <RefreshCcw className="mr-1 h-4 w-4" /> Refresh
          </Button>
          {(campaign?.failedJobs || 0) > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetryFailedJobs}
              disabled={loading || jobsLoading}
            >
              <RotateCcw className="mr-1 h-4 w-4" /> Retry Failed
            </Button>
          )}
          {(campaign?.processingJobs || 0) > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetStuckJobs}
              disabled={loading || jobsLoading}
            >
              <RotateCcw className="mr-1 h-4 w-4" /> Reset Stuck
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(`/api/audits/bulk/${campaignId}/report`, "_blank")
            }
          >
            <Download className="mr-1 h-4 w-4" /> Report
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{campaign?.name || "Loading campaign..."}</CardTitle>
          <CardDescription>
            {campaign
              ? `${campaign.timezone} · ${statusLabel(campaign.status)}`
              : "Fetching details"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="text-base font-medium capitalize">
                {campaign ? statusLabel(campaign.status) : "-"}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Progress</div>
              <div>
                <Progress value={progress} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {campaign
                    ? `${
                        (campaign.completedJobs || 0) +
                        (campaign.failedJobs || 0) +
                        (campaign.canceledJobs || 0)
                      } / ${campaign.totalJobs}`
                    : "-"}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">ETA</div>
              <div className="text-base font-medium">
                {campaign ? etaLabel(campaign.etaSeconds) : "-"}
              </div>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5 text-sm text-muted-foreground">
            <div>
              <div className="font-medium text-foreground">Completed</div>
              <div>{campaign?.completedJobs ?? "-"}</div>
            </div>
            <div>
              <div className="font-medium text-foreground">Failed</div>
              <div>{campaign?.failedJobs ?? "-"}</div>
            </div>
            <div>
              <div className="font-medium text-foreground">Processing</div>
              <div>{campaign?.processingJobs ?? "-"}</div>
            </div>
            <div>
              <div className="font-medium text-foreground">Canceled</div>
              <div>{campaign?.canceledJobs ?? "-"}</div>
            </div>
            <div>
              <div className="font-medium text-foreground">Started</div>
              <div>
                {campaign?.startedAt
                  ? new Date(campaign.startedAt).toLocaleString()
                  : "-"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Jobs</CardTitle>
          <CardDescription>
            Row-by-row status, scores, and recording links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="text-sm text-muted-foreground">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No jobs found for this campaign yet.
            </div>
          ) : (
            <div className="rounded-md border max-h-[70vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Row</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Call ID</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Recording</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedJobs.map((job) => (
                    <TableRow
                      key={job.rowIndex}
                      className="cursor-pointer"
                      onClick={() => setSelectedJob(job)}
                    >
                      <TableCell className="font-mono text-xs">
                        {job.rowIndex + 1}
                      </TableCell>
                      <TableCell className="capitalize">
                        {statusLabel(job.status)}
                      </TableCell>
                      <TableCell>{job.agentName || "-"}</TableCell>
                      <TableCell>{job.agentUserId || "-"}</TableCell>
                      <TableCell>{job.callId || "-"}</TableCell>
                      <TableCell>{job.overallScore ?? "-"}</TableCell>
                      <TableCell>
                        {job.recordingUrl ? (
                          <a
                            href={job.recordingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                          >
                            Open
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {job.error || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {jobs.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-end space-x-2 py-4 px-2">
                  <div className="text-sm text-muted-foreground mr-4">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedJob)}
        onOpenChange={(open) => {
          if (!open) setSelectedJob(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Job Details - {selectedJob?.agentName || "Unknown"}
            </DialogTitle>
            <DialogDescription>
              {selectedJob
                ? `Row ${selectedJob.rowIndex + 1} · ${statusLabel(
                    selectedJob.status
                  )}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p>
                  <strong>Agent:</strong> {selectedJob.agentName || "-"}
                </p>
                <p>
                  <strong>Agent ID:</strong> {selectedJob.agentUserId || "-"}
                </p>
                <p>
                  <strong>Campaign:</strong>{" "}
                  {selectedJob.campaignName || campaign?.name || "-"}
                </p>
                <p>
                  <strong>Overall Score:</strong>{" "}
                  <span className="font-bold text-lg">
                    {selectedJob.overallScore ?? "-"}%
                  </span>
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span className="capitalize">
                    {statusLabel(selectedJob.status)}
                  </span>
                </p>
                <p>
                  <strong>Duration:</strong>{" "}
                  {selectedJob.auditDurationMs
                    ? `${(selectedJob.auditDurationMs / 1000).toFixed(2)}s`
                    : "-"}
                </p>
                {currentUser?.role === "super_admin" && (
                  <p>
                    <strong>Tokens:</strong>{" "}
                    {selectedJob.tokenUsage
                      ? `In: ${
                          selectedJob.tokenUsage.inputTokens || 0
                        } / Out: ${
                          selectedJob.tokenUsage.outputTokens || 0
                        } / Total: ${selectedJob.tokenUsage.totalTokens || 0}`
                      : "-"}
                  </p>
                )}
              </div>

              <Separator />

              <h4 className="font-semibold text-md">Parameter Results</h4>
              {selectedJob.auditResults &&
              selectedJob.auditResults.length > 0 ? (
                <div className="rounded-md border max-h-48 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parameter</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead>Comments</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedJob.auditResults.map((r) => (
                        <TableRow key={r.parameterId}>
                          <TableCell className="font-medium">
                            {r.parameterName}
                          </TableCell>
                          <TableCell className="text-center">
                            {r.score} / {r.maxScore}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {r.comments || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No parameter results available.
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-md">
                    Transcription & Details
                  </h4>
                  {selectedJob.recordingUrl && (
                    <a
                      href={selectedJob.recordingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 underline flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" /> Recording
                    </a>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      Original Transcription
                    </div>
                    <div className="h-48 rounded-md border bg-muted/40 p-3 overflow-auto text-xs whitespace-pre-wrap">
                      {selectedJob.transcript || "No transcript"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      English Translation
                    </div>
                    <div className="h-48 rounded-md border bg-muted/40 p-3 overflow-auto text-xs whitespace-pre-wrap">
                      {selectedJob.englishTranslation || "No translation"}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold text-md">Technical Details</h4>
                <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <strong>Row Index:</strong> {selectedJob.rowIndex + 1}
                    </div>
                    <div>
                      <strong>Call ID:</strong> {selectedJob.callId || "-"}
                    </div>
                    <div>
                      <strong>Customer:</strong>{" "}
                      {selectedJob.customerName || "-"}
                    </div>
                    <div>
                      <strong>Retries:</strong> {selectedJob.retries ?? 0}
                    </div>
                    <div>
                      <strong>Created:</strong>{" "}
                      {selectedJob.createdAt
                        ? new Date(selectedJob.createdAt).toLocaleString()
                        : "-"}
                    </div>
                    <div>
                      <strong>Finished:</strong>{" "}
                      {selectedJob.finishedAt
                        ? new Date(selectedJob.finishedAt).toLocaleString()
                        : "-"}
                    </div>
                    <div className="col-span-2">
                      <strong>Error:</strong> {selectedJob.error || "None"}
                    </div>
                  </div>

                  {selectedJob.payload &&
                    Object.keys(selectedJob.payload).length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <div className="font-semibold mb-1">
                          Payload Data (CSV Row):
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          {Object.entries(selectedJob.payload).map(
                            ([key, value]) => (
                              <div key={key} className="break-all">
                                <span className="font-medium text-foreground/80">
                                  {key}:
                                </span>{" "}
                                {String(value ?? "")}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
