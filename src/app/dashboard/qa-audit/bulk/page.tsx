"use client";

import { useEffect, useMemo, useState, ChangeEvent } from "react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/authUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye,
  Loader2,
  UploadCloud,
  PlayCircle,
  XCircle,
  Trash2,
} from "lucide-react";

import type { QAParameter } from "@/types/qa-parameter";
import type { SOP } from "@/types/sop";
import type { User } from "@/types/auth";

interface CampaignRow {
  _id: string;
  name: string;
  timezone: string;
  status: string;
  totalJobs: number;
  completedJobs?: number;
  failedJobs?: number;
  canceledJobs?: number;
  etaSeconds?: number;
  createdAt?: string;
}

interface CampaignStatusResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export default function BulkAuditPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [campaignName, setCampaignName] = useState("Bulk QA Campaign");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // New state for QA Params and SOPs
  const [availableQaParameterSets, setAvailableQaParameterSets] = useState<
    QAParameter[]
  >([]);
  const [availableSops, setAvailableSops] = useState<SOP[]>([]);
  const [selectedQaParameterSetId, setSelectedQaParameterSetId] =
    useState<string>("");
  const [selectedSopId, setSelectedSopId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [applyRateLimit, setApplyRateLimit] = useState<boolean>(true);

  const parsedPreview = useMemo(() => rows.slice(0, 5), [rows]);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedRows = (results.data || []).filter((row) =>
          Object.values(row || {}).some(
            (v) => (v ?? "").toString().trim() !== ""
          )
        );
        setRows(parsedRows);
        if (results.errors && results.errors.length > 0) {
          toast({
            title: "CSV loaded with warnings",
            description: results.errors[0].message,
          });
        } else {
          toast({
            title: "CSV loaded",
            description: `${parsedRows.length} rows parsed`,
          });
        }
      },
      error: (error) => {
        toast({
          title: "CSV error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const startCampaign = async () => {
    if (!rows.length) {
      toast({ title: "Upload a CSV first", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/audits/bulk", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName,
          timezone,
          rows,
          qaParameterSetId: selectedQaParameterSetId || undefined,
          sopId: selectedSopId || undefined,
          projectId: selectedProjectId || undefined,
          applyRateLimit,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to start campaign");
      }
      toast({
        title: "Campaign started",
        description: `${json.data.totalJobs} jobs queued`,
      });
      setRows([]);
      router.refresh();
      await fetchCampaigns();
    } catch (err: any) {
      toast({
        title: "Start failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/audits/bulk", {
        headers: await getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setCampaigns(json.data || []);
      }
    } catch (error) {
      // ignore
    }
  };

  const fetchOptions = async () => {
    try {
      const headers = await getAuthHeaders();
      // Fetch QA Parameters
      const paramsRes = await fetch("/api/qa-parameters", { headers });
      const paramsJson = await paramsRes.json();
      if (paramsJson.success) {
        setAvailableQaParameterSets(paramsJson.data || []);
      }

      // Fetch SOPs
      const sopsRes = await fetch("/api/sops", { headers });
      const sopsJson = await sopsRes.json();
      if (sopsJson.success) {
        setAvailableSops(sopsJson.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch options", error);
    }
  };

  useEffect(() => {
    const tick = async () => {
      await fetchCampaigns();
      // Nudge worker to continue processing queued jobs
      await fetch("/api/audits/bulk/worker", { method: "POST" });
    };

    // Fetch user
    fetch("/api/auth/user", { headers: { "Content-Type": "application/json" } })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCurrentUser(data.user);
      })
      .catch((err) => console.error("Failed to load user", err));

    fetchOptions();
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

  const progressFor = (c: CampaignRow) => {
    const done =
      (c.completedJobs || 0) + (c.failedJobs || 0) + (c.canceledJobs || 0);
    if (!c.totalJobs) return 0;
    return Math.round((done / c.totalJobs) * 100);
  };

  const statusLabel = (status: string) => status.replace(/_/g, " ");

  const etaLabel = (c: CampaignRow) => {
    if (!c.etaSeconds || c.etaSeconds <= 0) return "-";
    if (c.etaSeconds < 90) return `${c.etaSeconds}s`;
    const minutes = Math.ceil(c.etaSeconds / 60);
    return `${minutes} min`;
  };

  const handleDownloadReport = async (
    campaignId: string,
    includeTokens: boolean = false
  ) => {
    try {
      const headers = await getAuthHeaders();
      const query = includeTokens ? "?includeTokens=true" : "";
      const res = await fetch(`/api/audits/bulk/${campaignId}/report${query}`, {
        headers,
      });
      if (!res.ok) throw new Error("Failed to download report");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `campaign-${campaignId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed", error);
      toast({
        title: "Download failed",
        description: "Could not download report",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCampaign = async (
    campaignId: string,
    campaignName: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete the campaign "${campaignName}" and ALL audits created by it? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/audits/bulk/${campaignId}`, {
        method: "DELETE",
        headers: await getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error("Failed to delete campaign");
      }

      toast({
        title: "Campaign deleted",
        description: `Campaign "${campaignName}" and all its audits have been deleted successfully.`,
      });

      await fetchCampaigns();
    } catch (error) {
      console.error("Delete failed", error);
      toast({
        title: "Delete failed",
        description: "Could not delete campaign",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk AI Audit Upload</CardTitle>
          <CardDescription>
            Upload the provided CSV, set timezone, and start a background AI
            audit campaign. Drive URLs are supported.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Campaign name</Label>
              <Input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Audit Parameter Set (Optional)</Label>
              <Select
                value={selectedQaParameterSetId}
                onValueChange={setSelectedQaParameterSetId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parameters" />
                </SelectTrigger>
                <SelectContent>
                  {availableQaParameterSets.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>SOP (Optional)</Label>
              <Select value={selectedSopId} onValueChange={setSelectedSopId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select SOP" />
                </SelectTrigger>
                <SelectContent>
                  {availableSops.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Project (Optional)</Label>
              <Input
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                placeholder="Enter project name"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rate-limit"
                  checked={applyRateLimit}
                  onCheckedChange={(checked) =>
                    setApplyRateLimit(checked as boolean)
                  }
                />
                <Label htmlFor="rate-limit" className="text-sm">
                  Apply rate limiting (defaults: 10 requests/minute, 500 requests/hour)
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended to avoid API quota limits (minute & hourly). Uncheck only if your quota supports higher throughput.
              </p>
            </div>

            <div className="space-y-2">
              <Label>CSV file</Label>
              <div className="flex items-center gap-2">
                <Input type="file" accept=".csv" onChange={handleFile} />
                <UploadCloud className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {rows.length ? `${rows.length} rows ready` : "No rows loaded"}
            </div>
            <Button onClick={startCampaign} disabled={loading || !rows.length}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="mr-2 h-4 w-4" />
              )}
              Start campaign
            </Button>
          </div>

          {parsedPreview.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Preview (first 5 rows)</div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Full_Name</TableHead>
                      <TableHead>employee_id</TableHead>
                      <TableHead>RID-Phone #</TableHead>
                      <TableHead>recording_url</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedPreview.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {row["Full_Name"] || row["full_name"] || ""}
                        </TableCell>
                        <TableCell>{row["employee_id"] || ""}</TableCell>
                        <TableCell>
                          {row["RID-Phone #"] || row["rid_phone"] || ""}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-blue-600">
                          {row["(S3) recording_url"] ||
                            row["recording_url"] ||
                            ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>
            Live status with cancel and report links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-sm text-muted-foreground"
                    >
                      No campaigns yet.
                    </TableCell>
                  </TableRow>
                )}
                {campaigns.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell>
                      <div className="font-medium">{c.name}</div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {statusLabel(c.status)}
                    </TableCell>
                    <TableCell className="w-64">
                      <Progress value={progressFor(c)} className="h-2" />
                      <div className="text-xs text-muted-foreground mt-1">
                        {(c.completedJobs || 0) +
                          (c.failedJobs || 0) +
                          (c.canceledJobs || 0)}{" "}
                        / {c.totalJobs}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{etaLabel(c)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/qa-audit/bulk/${c._id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-1 h-4 w-4" />
                            Preview
                          </Button>
                        </Link>
                        {currentUser?.role === "Administrator" ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                Download
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDownloadReport(c._id, false)
                                }
                              >
                                Download Standard Report
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDownloadReport(c._id, true)
                                }
                              >
                                Download Admin Report (With Tokens)
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReport(c._id, false)}
                          >
                            Download
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={
                            c.status === "canceled" ||
                            c.status === "completed" ||
                            c.status === "completed_with_errors"
                          }
                          onClick={async () => {
                            await fetch(`/api/audits/bulk/${c._id}`, {
                              method: "DELETE",
                              headers: await getAuthHeaders(),
                            });
                            await fetchCampaigns();
                          }}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCampaign(c._id, c.name)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
