"use client";

import Link from "next/link";
import {
  useState,
  useEffect,
  useMemo,
  type ChangeEvent,
  type FormEvent,
  useRef,
  type ReactNode,
} from "react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Bar,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  CalendarDays,
  Filter,
  FileDown,
  Loader2,
  VenetianMask,
  PlayCircle,
  PauseCircle,
  Target,
  ClipboardList,
  Smile,
  ShieldCheck,
  Brain,
  BarChart2,
  Bot,
  Download,
  TrendingUp,
  UserCheck,
  TrendingDown,
  Briefcase,
  Activity,
  Trash2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Removed direct AI flow import - using API route instead
import { useSearchParams, useRouter } from "next/navigation";
import type {
  QAParameter,
  Parameter as ParameterGroup,
} from "@/types/qa-parameter";
import type { SOP } from "@/types/sop";
import type { SavedAuditItem } from "@/types/audit";
import { Separator } from "@/components/ui/separator";
import { OverviewCard } from "@/components/dashboard/OverviewCard";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { User } from "@/types/auth";
import type { QAParameterDocument } from "@/lib/qaParameterService";
// Removed direct auditService import - using API route instead
import type { AuditDocument } from "@/lib/auditService";
import type { AuditResultDocument } from "@/lib/models";

import { Suspense } from "react";
import { getAuthHeaders } from "@/lib/authUtils";

// Helper function to convert AuditDocument to SavedAuditItem
function convertQAParameterDocumentToQAParameter(
  doc: QAParameterDocument
): QAParameter {
  let lastModified: string;
  if (doc.updatedAt) {
    if (typeof doc.updatedAt === "string") {
      lastModified = doc.updatedAt;
    } else if (doc.updatedAt instanceof Date) {
      lastModified = doc.updatedAt.toISOString();
    } else {
      lastModified = new Date(doc.updatedAt).toISOString();
    }
  } else {
    lastModified = new Date().toISOString();
  }

  return {
    ...doc,
    lastModified,
  };
}

function convertAuditDocumentToSavedAuditItem(
  doc: AuditDocument
): SavedAuditItem {
  let auditDate: string;
  if (doc.createdAt) {
    if (typeof doc.createdAt === "string") {
      auditDate = doc.createdAt;
    } else if (doc.createdAt instanceof Date) {
      auditDate = doc.createdAt.toISOString();
    } else {
      auditDate = new Date(doc.createdAt).toISOString();
    }
  } else {
    auditDate = new Date().toISOString();
  }

  return {
    id: doc.id,
    auditDate,
    agentName: doc.agentName,
    agentUserId: doc.agentUserId || doc.agentName, // Use actual agentUserId from DB, fallback to agentName
    campaignName: doc.campaignName,
    projectId: doc.projectId, // Project ID for project-based access control
    overallScore: doc.overallScore,
    auditedBy: doc.auditedBy, // User ID of who performed the audit
    auditData: {
      agentUserId: doc.agentUserId || doc.agentName, // Use actual agentUserId from DB
      campaignName: doc.campaignName,
      identifiedAgentName: doc.agentName,
      transcriptionInOriginalLanguage: doc.transcript || "",
      englishTranslation: doc.englishTranslation || "",
      callSummary: `Audit for ${doc.agentName}`,
      auditResults: doc.auditResults.map((result: AuditResultDocument) => ({
        parameter: result.parameterName,
        score: result.score,
        weightedScore: result.maxScore,
        comments: result.comments || "",
        type: result.type,
      })),
      overallScore: doc.overallScore,
      summary: `Overall score: ${doc.overallScore}/${doc.maxPossibleScore}`,
      tokenUsage: doc.tokenUsage,
      auditDurationMs: doc.auditDurationMs,
    },
    auditType: doc.auditType,
  };
}

// CSV export helper
function generateCSV(audits: SavedAuditItem[], includeTokens: boolean = false) {
  // Collect all unique parameter names from all audits to create dynamic headers
  const allParameterNames = new Set<string>();
  audits.forEach((audit) => {
    const auditResults = audit.auditData?.auditResults || [];
    auditResults.forEach((result: any) => {
      if (result?.parameter) {
        allParameterNames.add(result.parameter);
      }
    });
  });
  const parameterNamesList = Array.from(allParameterNames);

  const headers = [
    "Employee ID",
    "Process/Campaign",
    "Call Category",
    "Associate Name",
    "Audit ID",
    "Call Duration",
    "Audit Date",
    "QA/Audited By",
    "Pass/Fail",
    "Audit Duration",
    "Start Time",
    "End Time",
    "Overall Score",
    "Fatal Status",
    "Fatal Count",
    "Fatal Count",
    ...parameterNamesList,
  ];

  if (includeTokens) {
    headers.push("Input Tokens", "Output Tokens", "Total Tokens");
  }

  const rows = [headers.join(",")];

  audits.forEach((audit) => {
    // Determine call category based on score
    let callCategory = "Bad";
    if (audit.overallScore >= 90) {
      callCategory = "Good";
    } else if (audit.overallScore >= 80) {
      callCategory = "Average";
    }

    // Determine pass/fail
    const passFail = audit.overallScore >= 90 ? "Pass" : "Fail";

    // Determine fatal status and count
    const auditResults = audit.auditData?.auditResults || [];
    const fatalCount = auditResults.filter(
      (result: any) => result?.isFatal || result?.severity === "fatal"
    ).length;
    let fatalStatus = "Non - Fatal";
    if (fatalCount > 0) {
      fatalStatus = "Fatal";
    } else if (audit.overallScore === 0) {
      fatalStatus = "ZTP"; // Zero Tolerance Policy
    }

    // Format audit date as DD-MM-YYYY
    const auditDate = new Date(audit.auditDate);
    const formattedDate = `${auditDate
      .getDate()
      .toString()
      .padStart(2, "0")}-${(auditDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${auditDate.getFullYear()}`;

    // Calculate audit duration using auditDurationMs
    let auditDuration = "";
    let startTime = "";
    let endTime = "";

    if (audit.auditData?.auditDurationMs) {
      const durationMs = audit.auditData.auditDurationMs;
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
      const milliseconds = durationMs % 1000;
      auditDuration = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds
        .toString()
        .padStart(3, "0")}`;

      // Calculate start and end time based on audit date and duration
      const endDate = auditDate;
      const startDate = new Date(auditDate.getTime() - durationMs);

      // Format as DD-MM-YYYY HH:MM:SS
      const formatDateTime = (date: Date) => {
        const d = date.getDate().toString().padStart(2, "0");
        const m = (date.getMonth() + 1).toString().padStart(2, "0");
        const y = date.getFullYear();
        const hh = date.getHours().toString().padStart(2, "0");
        const mm = date.getMinutes().toString().padStart(2, "0");
        const ss = date.getSeconds().toString().padStart(2, "0");
        return `${d}-${m}-${y} ${hh}:${mm}:${ss}`;
      };

      startTime = formatDateTime(startDate);
      endTime = formatDateTime(endDate);
    } else if (audit.auditData?.startTime && audit.auditData?.endTime) {
      // Fallback to explicit start/end times if available
      const start = new Date(audit.auditData.startTime);
      const end = new Date(audit.auditData.endTime);
      const durationMs = end.getTime() - start.getTime();

      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
      const milliseconds = durationMs % 1000;
      auditDuration = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds
        .toString()
        .padStart(3, "0")}`;

      // Format as DD-MM-YYYY HH:MM:SS
      const formatDateTime = (date: Date) => {
        const d = date.getDate().toString().padStart(2, "0");
        const m = (date.getMonth() + 1).toString().padStart(2, "0");
        const y = date.getFullYear();
        const hh = date.getHours().toString().padStart(2, "0");
        const mm = date.getMinutes().toString().padStart(2, "0");
        const ss = date.getSeconds().toString().padStart(2, "0");
        return `${d}-${m}-${y} ${hh}:${mm}:${ss}`;
      };

      startTime = formatDateTime(start);
      endTime = formatDateTime(end);
    }

    // Estimate call duration (if not available, leave empty or use a default)
    let callDuration = "";
    if (audit.auditData?.callDuration) {
      // If call duration is stored in audit data
      callDuration = audit.auditData.callDuration;
    } else if (audit.auditData?.audioDuration) {
      // If audio duration is available
      const duration = parseFloat(audit.auditData.audioDuration);
      if (!isNaN(duration)) {
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        callDuration = `${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`;
      }
    } else if (audit.auditData?.audioDataUri) {
      // Try to estimate from data URI size (rough approximation)
      // WAV files are ~44 bytes per second at 16kHz mono
      try {
        const dataUriMatch = audit.auditData.audioDataUri.match(
          /^data:audio\/[^;]+;base64,(.+)$/
        );
        if (dataUriMatch) {
          const base64Data = dataUriMatch[1];
          const bytes = (base64Data.length * 3) / 4; // Base64 to bytes
          const estimatedSeconds = Math.floor(bytes / 44000); // Rough WAV estimation
          if (estimatedSeconds > 0) {
            const minutes = Math.floor(estimatedSeconds / 60);
            const seconds = estimatedSeconds % 60;
            callDuration = `${minutes.toString().padStart(2, "0")}:${seconds
              .toString()
              .padStart(2, "0")}`;
          }
        }
      } catch (e) {
        // Ignore estimation errors
      }
    }

    // Build parameter scores map by parameter name for this audit
    const parameterScoresMap: Record<string, string> = {};
    auditResults.forEach((result: any) => {
      if (result?.parameter) {
        parameterScoresMap[result.parameter] =
          result?.score?.toString() || result?.percentage?.toString() || "";
      }
    });

    // Get parameter scores in the same order as headers
    const parameterScores = parameterNamesList.map(
      (paramName) => parameterScoresMap[paramName] || ""
    );

    const row = [
      audit.agentUserId ||
        audit.auditData?.agentUserId ||
        audit.agentName ||
        "",
      audit.campaignName || "",
      callCategory,
      audit.agentName || "",
      audit.id,
      callDuration,
      formattedDate,
      audit.auditType === "ai" ? "AI" : "Manual",
      passFail,
      auditDuration,
      startTime,
      endTime,
      audit.overallScore.toString(),
      fatalStatus,
      fatalCount.toString(),
      ...parameterScores,
      ...parameterScores,
    ];

    if (includeTokens) {
      row.push(
        audit.auditData?.tokenUsage?.inputTokens?.toString() || "0",
        audit.auditData?.tokenUsage?.outputTokens?.toString() || "0",
        audit.auditData?.tokenUsage?.totalTokens?.toString() || "0"
      );
    }

    rows.push(row.map((field) => `"${field}"`).join(","));
  });

  return rows.join("\n");
}

function handleDownload(
  audits: SavedAuditItem[],
  activeTab: string,
  dateRange: DateRange | undefined,
  selectedCampaignIdForFilter: string,
  availableQaParameterSets: QAParameter[],
  currentUser: User | null,
  includeTokens: boolean = false
) {
  try {
    // Compute filtered audits based on current UI filters
    const auditType =
      activeTab === "overview"
        ? "all"
        : activeTab === "qa-dashboard"
        ? "ai"
        : "manual";
    const filtered = applyAuditFilters(
      audits,
      auditType as any,
      dateRange,
      selectedCampaignIdForFilter,
      availableQaParameterSets,
      currentUser
    );

    // Generate CSV with reasoning included
    const csv = generateCSV(filtered, includeTokens);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Audit Template for QAI.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Failed to download audits:", err);
    alert("Failed to download audits. Please try again.");
  }
}

function applyAuditFilters(
  audits: SavedAuditItem[],
  auditType: "all" | "ai" | "manual",
  dateRange: DateRange | undefined,
  selectedCampaignIdForFilter: string,
  availableQaParameterSets: QAParameter[],
  currentUser: User | null,
  includeTokens: boolean = false
) {
  let filtered = audits;

  // Role-based access control:
  // - Administrator: Can see ALL audits across the system
  // - Project Admin: Can see all audits within their project only
  // - Manager, QA Analyst, Auditor, Agent: Can only see audits they performed
  if (currentUser) {
    if (currentUser.role === "Administrator") {
      // Administrator can see all audits - no filtering
    } else if (currentUser.role === "Project Admin") {
      // Project Admin can see all audits within their project
      filtered = filtered.filter((a) => a.projectId === currentUser.projectId);
    } else {
      // All other roles can only see audits they performed
      filtered = filtered.filter((a) => a.auditedBy === currentUser.id);
    }
  }

  if (auditType !== "all") {
    filtered = filtered.filter((a) => a.auditType === auditType);
  }

  if (dateRange?.from) {
    filtered = filtered.filter((audit) => {
      const auditDate = new Date(audit.auditDate);
      let inRange = auditDate >= dateRange.from!;
      if (dateRange.to) {
        inRange = inRange && auditDate <= dateRange.to!;
      }
      return inRange;
    });
  }

  if (selectedCampaignIdForFilter && selectedCampaignIdForFilter !== "all") {
    const selectedCampaign = availableQaParameterSets.find(
      (c) => c.id === selectedCampaignIdForFilter
    );
    if (selectedCampaign) {
      filtered = filtered.filter(
        (audit) => audit.campaignName === selectedCampaign.name
      );
    }
  }

  return filtered;
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}

function DashboardPageContent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState<ReactNode>(null);

  const [savedAudits, setSavedAudits] = useState<SavedAuditItem[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Delete audit state
  const [auditToDelete, setAuditToDelete] = useState<SavedAuditItem | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const activeTab = searchParams.get("tab") || "overview";

  const [availableQaParameterSets, setAvailableQaParameterSets] = useState<
    QAParameter[]
  >([]);
  const [availableCampaignsForFilter, setAvailableCampaignsForFilter] =
    useState([{ id: "all", name: "All Campaigns" }]);
  const [selectedCampaignIdForFilter, setSelectedCampaignIdForFilter] =
    useState("all");

  // Effect for setting isClient
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Effect for loading data from database and setting defaults (runs once after client is set)
  useEffect(() => {
    if (!isClient) return;

    const loadData = async () => {
      // Load user details
      try {
        const userResponse = await fetch("/api/auth/user", {
          headers: getAuthHeaders(),
        });

        const userData = await userResponse.json();
        console.log(userData);
        if (userResponse.ok && userData.success) {
          setCurrentUser(userData.user);
        }
      } catch (e) {
        console.error("Failed to load user details", e);
      }

      if (!dateRange?.from) {
        const today = new Date();
        const firstDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );
        const lastDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        );
        setDateRange({ from: firstDayOfMonth, to: lastDayOfMonth });
      }

      try {
        // Load QA Parameters from database
        const qaResponse = await fetch("/api/qa-parameters", {
          headers: getAuthHeaders(),
        });
        const qaData = await qaResponse.json();
        if (qaResponse.ok && qaData.success) {
          const activeCampaigns = qaData.data.filter(
            (p: QAParameterDocument) => p.isActive
          );
          setAvailableQaParameterSets(
            activeCampaigns.map(convertQAParameterDocumentToQAParameter)
          );
          const campaignOptions = activeCampaigns.map(
            (p: QAParameterDocument) => ({ id: p.id, name: p.name })
          );
          setAvailableCampaignsForFilter([
            { id: "all", name: "All Campaigns" },
            ...campaignOptions,
          ]);
        }
      } catch (e) {
        console.error("Failed to load QA Parameter Sets from database", e);
      }

      try {
        // Load SOPs from database
        const sopResponse = await fetch("/api/sops", {
          headers: getAuthHeaders(),
        });
        const sopData = await sopResponse.json();
        if (sopResponse.ok && sopData.success) {
          // setAvailableSops(sopData.data);
        }
      } catch (e) {
        console.error("Failed to load SOPs from database", e);
      }

      try {
        // Load saved audits from API
        const response = await fetch("/api/audits", {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const auditData = await response.json();
          if (auditData.success && auditData.data) {
            // Convert database audits to SavedAuditItem format
            const savedAuditsData: SavedAuditItem[] = auditData.data.map(
              convertAuditDocumentToSavedAuditItem
            );
            setSavedAudits(savedAuditsData);
          }
        }
      } catch (e) {
        console.error("Failed to load saved audits from API", e);
      }
    };

    loadData();
  }, [isClient, dateRange?.from]);

  const handleDeleteAudit = async (audit: SavedAuditItem) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/audits?id=${audit.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setSavedAudits((prev) => prev.filter((a) => a.id !== audit.id));
        toast({
          title: "Audit Deleted",
          description: "The audit has been successfully deleted.",
        });
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to delete audit",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to delete audit:", error);
      toast({
        title: "Error",
        description: "Failed to delete audit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setAuditToDelete(null);
    }
  };

  const openAuditDetailsModal = (audit: SavedAuditItem) => {
    setModalTitle(
      `Audit Details - ${audit.agentName} (${format(
        new Date(audit.auditDate),
        "PPp"
      )})`
    );

    const handleDispute = () => {
      toast({
        title: "Dispute Logged",
        description: "Your dispute for this audit has been logged for review.",
      });
      setIsModalOpen(false);
    };

    const handleAcknowledge = () => {
      toast({
        title: "Audit Acknowledged",
        description: "Thank you for acknowledging this audit.",
      });
      setIsModalOpen(false);
    };

    setModalContent(
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{`Audit Details - ${audit.agentName} (${format(
            new Date(audit.auditDate),
            "PPp"
          )})`}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p>
                <strong>Agent:</strong> {audit.agentName}
              </p>
              <p>
                <strong>Agent ID:</strong> {audit.agentUserId}
              </p>
              <p>
                <strong>Campaign:</strong> {audit.campaignName || "N/A"}
              </p>
              <p>
                <strong>Overall Score:</strong>{" "}
                <span className="font-bold text-lg">
                  {audit.overallScore.toFixed(2)}%
                </span>
              </p>
              <p>
                <strong>Audit Type:</strong>{" "}
                <Badge
                  variant={audit.auditType === "ai" ? "default" : "secondary"}
                >
                  {audit.auditType.toUpperCase()}
                </Badge>
              </p>
              {currentUser?.role === "Administrator" &&
                audit.auditType === "ai" && (
                  <>
                    <p>
                      <strong>Duration:</strong>{" "}
                      {audit.auditData?.auditDurationMs
                        ? `${(audit.auditData.auditDurationMs / 1000).toFixed(
                            2
                          )}s`
                        : "N/A"}
                    </p>
                    <p>
                      <strong>Tokens:</strong>{" "}
                      {audit.auditData?.tokenUsage
                        ? `In: ${
                            audit.auditData.tokenUsage.inputTokens || 0
                          } / Out: ${
                            audit.auditData.tokenUsage.outputTokens || 0
                          } / Total: ${
                            audit.auditData.tokenUsage.totalTokens || 0
                          }`
                        : "N/A"}
                    </p>
                  </>
                )}
            </div>
            <Separator />
            <h4 className="font-semibold text-md">Parameter Results</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parameter</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead>Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audit.auditData.auditResults.map((res: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {res.parameter}
                    </TableCell>
                    <TableCell className="text-center">{res.score}</TableCell>
                    <TableCell>{res.comments}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {audit.auditType === "ai" && (
              <>
                <Separator />
                <h4 className="font-semibold text-md">
                  Call Summary & Transcription
                </h4>
                <p className="text-sm p-3 bg-muted rounded-md">
                  {audit.auditData.callSummary}
                </p>
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm">
                      Show/Hide Full Transcription
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4 space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Original Transcription</Label>
                        <ScrollArea className="h-48 mt-2 p-3 border rounded-md">
                          <pre className="text-xs whitespace-pre-wrap">
                            {audit.auditData.transcriptionInOriginalLanguage}
                          </pre>
                        </ScrollArea>
                      </div>
                      <div className="space-y-2">
                        <Label>English Translation</Label>
                        <ScrollArea className="h-48 mt-2 p-3 border rounded-md">
                          <pre className="text-xs whitespace-pre-wrap">
                            {audit.auditData.englishTranslation ||
                              "No translation available"}
                          </pre>
                        </ScrollArea>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}
          </div>
        </div>
        <DialogFooter>
          {currentUser?.role === "Agent" ? (
            <div className="w-full flex justify-between">
              <Button variant="destructive" onClick={handleDispute}>
                Dispute
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Close
                </Button>
                <Button onClick={handleAcknowledge}>Acknowledge</Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setIsModalOpen(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    );
    setIsModalOpen(true);
  };

  if (!isClient) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 bg-background">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Hi, {currentUser?.fullName || "User"}! Welcome Back 👋
          </h2>
          <p className="text-muted-foreground">
            Here’s a snapshot of your QA performance and activities.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarDays className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          {currentUser?.role === "Administrator" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() =>
                    handleDownload(
                      savedAudits,
                      activeTab,
                      dateRange,
                      selectedCampaignIdForFilter,
                      availableQaParameterSets,
                      currentUser,
                      false
                    )
                  }
                >
                  Download Standard Report
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleDownload(
                      savedAudits,
                      activeTab,
                      dateRange,
                      selectedCampaignIdForFilter,
                      availableQaParameterSets,
                      currentUser,
                      true
                    )
                  }
                >
                  Download Admin Report (With Tokens)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() =>
                handleDownload(
                  savedAudits,
                  activeTab,
                  dateRange,
                  selectedCampaignIdForFilter,
                  availableQaParameterSets,
                  currentUser,
                  false
                )
              }
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          )}
        </div>
      </div>

      {currentUser?.role === "Agent" ? (
        <DashboardTabContent
          key="agent-overview"
          auditType="all"
          savedAudits={savedAudits}
          dateRange={dateRange}
          selectedCampaignIdForFilter={selectedCampaignIdForFilter}
          availableQaParameterSets={availableQaParameterSets}
          currentUser={currentUser}
          openAuditDetailsModal={openAuditDetailsModal}
          setAuditToDelete={setAuditToDelete}
        />
      ) : currentUser?.role === "Auditor" ? (
        <Tabs
          value={activeTab}
          onValueChange={(value) => router.push(`/dashboard?tab=${value}`)}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart2 className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="manual-dashboard">
              <ClipboardList className="mr-2 h-4 w-4" />
              Manual Audit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <DashboardTabContent
              key="auditor-overview"
              auditType="all"
              savedAudits={savedAudits}
              dateRange={dateRange}
              selectedCampaignIdForFilter={selectedCampaignIdForFilter}
              availableQaParameterSets={availableQaParameterSets}
              currentUser={currentUser}
              openAuditDetailsModal={openAuditDetailsModal}
              setAuditToDelete={setAuditToDelete}
            />
          </TabsContent>
          <TabsContent value="manual-dashboard" className="space-y-4">
            <DashboardTabContent
              key="auditor-manual"
              auditType="manual"
              savedAudits={savedAudits}
              dateRange={dateRange}
              selectedCampaignIdForFilter={selectedCampaignIdForFilter}
              availableQaParameterSets={availableQaParameterSets}
              currentUser={currentUser}
              openAuditDetailsModal={openAuditDetailsModal}
              setAuditToDelete={setAuditToDelete}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(value) => router.push(`/dashboard?tab=${value}`)}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart2 className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="qa-dashboard">
              <Brain className="mr-2 h-4 w-4" />
              QAi Dashboard
            </TabsTrigger>
            <TabsTrigger value="manual-dashboard">
              <ClipboardList className="mr-2 h-4 w-4" />
              Manual Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <DashboardTabContent
              key="overview"
              auditType="all"
              savedAudits={savedAudits}
              dateRange={dateRange}
              selectedCampaignIdForFilter={selectedCampaignIdForFilter}
              availableQaParameterSets={availableQaParameterSets}
              currentUser={currentUser}
              openAuditDetailsModal={openAuditDetailsModal}
              setAuditToDelete={setAuditToDelete}
            />
          </TabsContent>
          <TabsContent value="qa-dashboard" className="space-y-4">
            <DashboardTabContent
              key="ai"
              auditType="ai"
              savedAudits={savedAudits}
              dateRange={dateRange}
              selectedCampaignIdForFilter={selectedCampaignIdForFilter}
              availableQaParameterSets={availableQaParameterSets}
              currentUser={currentUser}
              openAuditDetailsModal={openAuditDetailsModal}
              setAuditToDelete={setAuditToDelete}
            />
          </TabsContent>
          <TabsContent value="manual-dashboard" className="space-y-4">
            <DashboardTabContent
              key="manual"
              auditType="manual"
              savedAudits={savedAudits}
              dateRange={dateRange}
              selectedCampaignIdForFilter={selectedCampaignIdForFilter}
              availableQaParameterSets={availableQaParameterSets}
              currentUser={currentUser}
              openAuditDetailsModal={openAuditDetailsModal}
              setAuditToDelete={setAuditToDelete}
            />
          </TabsContent>
        </Tabs>
      )}

      {isModalOpen && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          {modalContent ? (
            // modalContent already contains DialogContent wrapper
            modalContent
          ) : (
            // Fallback empty content to satisfy Dialog structure
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Details</DialogTitle>
              </DialogHeader>
              <div className="p-4">No content</div>
              <DialogFooter>
                <Button onClick={() => setIsModalOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      )}

      <AlertDialog
        open={!!auditToDelete}
        onOpenChange={(open) => !open && setAuditToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Audit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this audit for{" "}
              {auditToDelete?.agentName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={() => auditToDelete && handleDeleteAudit(auditToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Sub-component for dashboard content
interface DashboardTabContentProps {
  auditType: "all" | "ai" | "manual";
  savedAudits: SavedAuditItem[];
  dateRange: DateRange | undefined;
  selectedCampaignIdForFilter: string;
  availableQaParameterSets: QAParameter[];
  currentUser: User | null;
  openAuditDetailsModal: (audit: SavedAuditItem) => void;
  setAuditToDelete: (audit: SavedAuditItem | null) => void;
}

const DashboardTabContent: React.FC<DashboardTabContentProps> = ({
  auditType,
  savedAudits,
  dateRange,
  selectedCampaignIdForFilter,
  availableQaParameterSets,
  currentUser,
  openAuditDetailsModal,
  setAuditToDelete,
}) => {
  type AgentPerformanceData = {
    topAgents: {
      id: string;
      name: string;
      score: number;
      audits: number;
      pass: number;
      fail: number;
    }[];
    underperformingAgents: {
      id: string;
      name: string;
      score: number;
      audits: number;
      pass: number;
      fail: number;
    }[];
  };
  type CampaignPerformanceData = {
    name: string;
    score: number;
    compliance: number;
    audits: number;
  }[];

  const [overallQAScore, setOverallQAScore] = useState(0);
  const [topIssuesData, setTopIssuesData] = useState([
    {
      id: "issue_default_1",
      reason: "Awaiting audit data...",
      count: 0,
      critical: false,
    },
  ]);
  const [agentPerformanceData, setAgentPerformanceData] =
    useState<AgentPerformanceData>({
      topAgents: [],
      underperformingAgents: [],
    });
  const [campaignPerformanceData, setCampaignPerformanceData] =
    useState<CampaignPerformanceData>([]);
  const [complianceData, setComplianceData] = useState({
    interactionsWithIssues: 0,
    totalAuditedInteractionsForCompliance: 0,
    complianceRate: 0,
  });
  const [trainingNeedsData, setTrainingNeedsData] = useState<{
    agentName: string;
    lowestParam: string;
  } | null>(null);
  const [sentimentData, setSentimentData] = useState({
    positive: 0,
    neutral: 0,
    negative: 0,
  });
  const [fatalErrorsData, setFatalErrorsData] = useState({
    totalFatalErrors: 0,
    fatalRate: 0,
  });

  // Time series data for line charts
  const [dailyAuditsData, setDailyAuditsData] = useState<
    { date: string; audits: number }[]
  >([]);
  const [dailyFatalErrorsData, setDailyFatalErrorsData] = useState<
    { date: string; fatalErrors: number }[]
  >([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filteredAudits = useMemo(() => {
    let filtered = savedAudits;

    if (currentUser?.role === "Agent" || currentUser?.role === "Auditor") {
      filtered = filtered.filter(
        (audit) => audit.auditedBy === currentUser.username
      );
    }

    if (auditType !== "all") {
      filtered = filtered.filter((audit) => audit.auditType === auditType);
    }
    if (dateRange?.from) {
      filtered = filtered.filter((audit) => {
        const auditDate = new Date(audit.auditDate);
        let inRange = auditDate >= dateRange.from!;
        if (dateRange.to) {
          inRange = inRange && auditDate <= dateRange.to!;
        }
        return inRange;
      });
    }
    if (selectedCampaignIdForFilter && selectedCampaignIdForFilter !== "all") {
      const selectedCampaign = availableQaParameterSets.find(
        (c) => c.id === selectedCampaignIdForFilter
      );
      if (selectedCampaign) {
        filtered = filtered.filter(
          (audit) => audit.campaignName === selectedCampaign.name
        );
      }
    }
    return filtered;
  }, [
    savedAudits,
    auditType,
    dateRange,
    selectedCampaignIdForFilter,
    availableQaParameterSets,
    currentUser,
  ]);

  useEffect(() => {
    if (filteredAudits.length > 0) {
      const totalScore = filteredAudits.reduce(
        (sum, audit) => sum + audit.overallScore,
        0
      );
      setOverallQAScore(
        parseFloat((totalScore / filteredAudits.length).toFixed(1))
      );

      // Agent & Campaign Performance
      const agentScores: Record<
        string,
        {
          totalScore: number;
          auditCount: number;
          name: string;
          passCount: number;
        }
      > = {};
      const campaignScores: Record<
        string,
        { totalScore: number; auditCount: number; complianceIssues: number }
      > = {};

      filteredAudits.forEach((audit) => {
        const campaignName = audit.campaignName || "Uncategorized";
        // Agent Data Aggregation
        if (!agentScores[audit.agentUserId]) {
          agentScores[audit.agentUserId] = {
            totalScore: 0,
            auditCount: 0,
            name: audit.agentName,
            passCount: 0,
          };
        }
        agentScores[audit.agentUserId].totalScore += audit.overallScore;
        agentScores[audit.agentUserId].auditCount++;
        if (audit.overallScore >= 80)
          agentScores[audit.agentUserId].passCount++;

        // Campaign Data Aggregation
        if (!campaignScores[campaignName]) {
          campaignScores[campaignName] = {
            totalScore: 0,
            auditCount: 0,
            complianceIssues: 0,
          };
        }
        campaignScores[campaignName].totalScore += audit.overallScore;
        campaignScores[campaignName].auditCount++;
        if (
          audit.auditData.auditResults.some(
            (r: any) => r.type === "Fatal" && r.score < 80
          )
        ) {
          campaignScores[campaignName].complianceIssues++;
        }
      });
      const avgAgentScores = Object.entries(agentScores)
        .map(([id, data]) => ({
          id,
          name: data.name,
          score: parseFloat((data.totalScore / data.auditCount).toFixed(1)),
          audits: data.auditCount,
          pass: data.passCount,
          fail: data.auditCount - data.passCount,
        }))
        .sort((a, b) => b.score - a.score);

      if (avgAgentScores.length > 0) {
        setAgentPerformanceData({
          topAgents: avgAgentScores.slice(0, 5),
          underperformingAgents: avgAgentScores
            .filter((a) => a.score < 80)
            .slice(-5)
            .reverse(),
        });
      }

      const finalCampaignData = Object.entries(campaignScores)
        .map(([name, data]) => ({
          name,
          audits: data.auditCount,
          score: parseFloat((data.totalScore / data.auditCount).toFixed(1)),
          compliance: parseFloat(
            (
              ((data.auditCount - data.complianceIssues) / data.auditCount) *
              100
            ).toFixed(1)
          ),
        }))
        .sort((a, b) => b.audits - a.audits);
      setCampaignPerformanceData(finalCampaignData);

      // Top Issues
      const issuesMap = new Map<
        string,
        { count: number; criticalCount: number }
      >();
      const agentParamScores = new Map<
        string,
        { totalScore: number; count: number; agentName: string }
      >();

      filteredAudits.forEach((audit) => {
        audit.auditData.auditResults.forEach((res: any) => {
          // Top Issues Calculation
          if (res.score < 80) {
            const existing = issuesMap.get(res.parameter) || {
              count: 0,
              criticalCount: 0,
            };
            existing.count++;
            if (res.score < 50) existing.criticalCount++;
            issuesMap.set(res.parameter, existing);
          }

          // Training Needs Calculation
          const agentParamKey = `${audit.agentUserId}__${res.parameter}`;
          const existingAgentParam = agentParamScores.get(agentParamKey) || {
            totalScore: 0,
            count: 0,
            agentName: audit.agentName,
          };
          existingAgentParam.totalScore += res.score;
          existingAgentParam.count++;
          agentParamScores.set(agentParamKey, existingAgentParam);
        });
      });
      const sortedIssues = Array.from(issuesMap.entries())
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 5)
        .map(([reason, data]) => ({
          id: reason,
          reason,
          count: data.count,
          critical: data.criticalCount > 0,
        }));
      if (sortedIssues.length > 0) setTopIssuesData(sortedIssues);
      else
        setTopIssuesData([
          {
            id: "no_issues",
            reason: "No significant QA failures identified.",
            count: 0,
            critical: false,
          },
        ]);

      // Finalize Training Needs
      let lowestAvg = 101;
      let tniResult: { agentName: string; lowestParam: string } | null = null;
      agentParamScores.forEach((data, key) => {
        const avg = data.totalScore / data.count;
        if (avg < lowestAvg) {
          lowestAvg = avg;
          const [agentId, paramName] = key.split("__");
          tniResult = { agentName: data.agentName, lowestParam: paramName };
        }
      });
      setTrainingNeedsData(tniResult);

      // Compliance
      const fatalAudits = filteredAudits.filter((a) =>
        a.auditData.auditResults.some(
          (r: any) => r.type === "Fatal" && r.score < 80
        )
      ).length;
      const nonCompliantAudits = filteredAudits.filter(
        (a) => a.overallScore < 70
      ).length;
      const issuesCount = Math.max(fatalAudits, nonCompliantAudits);

      setComplianceData({
        interactionsWithIssues: issuesCount,
        totalAuditedInteractionsForCompliance: filteredAudits.length,
        complianceRate:
          parseFloat(
            (
              ((filteredAudits.length - issuesCount) / filteredAudits.length) *
              100
            ).toFixed(1)
          ) || 0,
      });

      // Sentiment
      setSentimentData({
        positive:
          filteredAudits.length > 0
            ? parseFloat(
                (
                  (filteredAudits.filter((a) => a.overallScore >= 85).length /
                    filteredAudits.length) *
                  100
                ).toFixed(1)
              )
            : 0,
        neutral:
          filteredAudits.length > 0
            ? parseFloat(
                (
                  (filteredAudits.filter(
                    (a) => a.overallScore >= 70 && a.overallScore < 85
                  ).length /
                    filteredAudits.length) *
                  100
                ).toFixed(1)
              )
            : 0,
        negative:
          filteredAudits.length > 0
            ? parseFloat(
                (
                  (filteredAudits.filter((a) => a.overallScore < 70).length /
                    filteredAudits.length) *
                  100
                ).toFixed(1)
              )
            : 0,
      });

      // Calculate total fatal errors and fatal rate
      let totalFatalErrors = 0;
      filteredAudits.forEach((audit) => {
        const fatalCount = audit.auditData.auditResults.filter(
          (r: any) => r.type === "Fatal" && r.score < 80
        ).length;
        totalFatalErrors += fatalCount;
      });

      const auditsWithFatalErrors = filteredAudits.filter((audit) =>
        audit.auditData.auditResults.some(
          (r: any) => r.type === "Fatal" && r.score < 80
        )
      ).length;

      setFatalErrorsData({
        totalFatalErrors,
        fatalRate:
          filteredAudits.length > 0
            ? parseFloat(
                ((auditsWithFatalErrors / filteredAudits.length) * 100).toFixed(
                  1
                )
              )
            : 0,
      });

      // Calculate daily audits and fatal errors
      const dailyAuditsMap = new Map<string, number>();
      const dailyFatalErrorsMap = new Map<string, number>();

      filteredAudits.forEach((audit) => {
        const date = format(new Date(audit.auditDate), "yyyy-MM-dd");

        // Count audits per day
        dailyAuditsMap.set(date, (dailyAuditsMap.get(date) || 0) + 1);

        // Count fatal errors per day
        const fatalCount = audit.auditData.auditResults.filter(
          (r: any) => r.type === "Fatal" && r.score < 80
        ).length;
        dailyFatalErrorsMap.set(
          date,
          (dailyFatalErrorsMap.get(date) || 0) + fatalCount
        );
      });

      // Convert maps to sorted arrays
      const sortedDailyAudits = Array.from(dailyAuditsMap.entries())
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, audits]) => ({
          date: format(new Date(date), "MMM dd"),
          audits,
        }));

      const sortedDailyFatalErrors = Array.from(dailyFatalErrorsMap.entries())
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, fatalErrors]) => ({
          date: format(new Date(date), "MMM dd"),
          fatalErrors,
        }));

      setDailyAuditsData(sortedDailyAudits);
      setDailyFatalErrorsData(sortedDailyFatalErrors);
    } else {
      setOverallQAScore(0);
      setTopIssuesData([
        {
          id: "issue_default_1",
          reason: "Awaiting audit data...",
          count: 0,
          critical: false,
        },
      ]);
      setAgentPerformanceData({ topAgents: [], underperformingAgents: [] });
      setCampaignPerformanceData([]);
      setComplianceData({
        interactionsWithIssues: 0,
        totalAuditedInteractionsForCompliance: 0,
        complianceRate: 0,
      });
      setSentimentData({ positive: 0, neutral: 0, negative: 0 });
      setTrainingNeedsData(null);
      setDailyAuditsData([]);
      setDailyFatalErrorsData([]);
      setFatalErrorsData({ totalFatalErrors: 0, fatalRate: 0 });
    }
  }, [filteredAudits]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [auditType, dateRange, selectedCampaignIdForFilter, currentUser]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredAudits.length / ITEMS_PER_PAGE);
  const paginatedAudits = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAudits.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAudits, currentPage]);

  const chartConfigTopIssues = {
    count: { label: "Count", color: "hsl(var(--chart-2))" },
  } as const;

  const chartConfigDailyAudits = {
    audits: { label: "Audits", color: "hsl(var(--chart-1))" },
  } as const;

  const chartConfigDailyFatalErrors = {
    fatalErrors: { label: "Fatal Errors", color: "hsl(var(--destructive))" },
  } as const;

  const isAgentView = currentUser?.role === "Agent";

  return (
    <div className="space-y-4">
      {!isAgentView && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5">
          <OverviewCard title="Overall QA Score" icon={Target}>
            <div className="text-2xl font-bold">{overallQAScore}%</div>
            <p className="text-xs text-muted-foreground">
              {Math.abs(overallQAScore - 85) < 2
                ? "On par with target"
                : overallQAScore > 85
                ? `+${(overallQAScore - 85).toFixed(1)}% vs target`
                : `${(overallQAScore - 85).toFixed(1)}% vs target`}
            </p>
          </OverviewCard>
          <OverviewCard title="Total Audits" icon={ClipboardList}>
            <div className="text-2xl font-bold">{filteredAudits.length}</div>
            <p className="text-xs text-muted-foreground">
              Across{" "}
              {
                Object.keys(
                  filteredAudits.reduce(
                    (acc, curr) => ({ ...acc, [curr.agentUserId]: true }),
                    {}
                  )
                ).length
              }{" "}
              agents
            </p>
          </OverviewCard>
          <OverviewCard title="No. of Fatal" icon={ShieldCheck}>
            <div className="text-2xl font-bold">
              {fatalErrorsData.totalFatalErrors}
            </div>
            <p className="text-xs text-muted-foreground">
              Total fatal errors across all audits
            </p>
          </OverviewCard>
          <OverviewCard title="Fatal Rate" icon={Activity}>
            <div className="text-2xl font-bold">
              {fatalErrorsData.fatalRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Percentage of audits with fatal errors
            </p>
          </OverviewCard>
          <OverviewCard title="Training Needs" icon={UserCheck}>
            <div className="text-xl font-bold truncate">
              {trainingNeedsData?.agentName || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Focus Area: {trainingNeedsData?.lowestParam || "None Identified"}
            </p>
          </OverviewCard>
        </div>
      )}

      {isAgentView && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <OverviewCard title="My QA Score" icon={Target}>
            <div className="text-2xl font-bold">{overallQAScore}%</div>
            <p className="text-xs text-muted-foreground">Your average score</p>
          </OverviewCard>
          <OverviewCard title="My Audits" icon={ClipboardList}>
            <div className="text-2xl font-bold">{filteredAudits.length}</div>
            <p className="text-xs text-muted-foreground">
              Total audits completed for you
            </p>
          </OverviewCard>
          <OverviewCard title="My Compliance" icon={ShieldCheck}>
            <div className="text-2xl font-bold">
              {complianceData.complianceRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Your compliance rate
            </p>
          </OverviewCard>
          <OverviewCard title="My Pass/Fail" icon={Activity}>
            <div className="text-2xl font-bold">
              {agentPerformanceData.topAgents[0]?.pass || 0} /{" "}
              {agentPerformanceData.topAgents[0]?.fail || 0}
            </div>
            <p className="text-xs text-muted-foreground">Pass vs Fail count</p>
          </OverviewCard>
        </div>
      )}

      {!isAgentView && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-full lg:col-span-4 shadow-lg">
              <CardHeader>
                <CardTitle>Top QA Issues</CardTitle>
                <CardDescription>
                  Common parameters where agents need improvement.
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ChartContainer
                  config={chartConfigTopIssues}
                  className="h-[350px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={topIssuesData}
                      margin={{ left: 120, top: 20, right: 20, bottom: 20 }}
                    >
                      <CartesianGrid horizontal={false} />
                      <XAxis type="number" dataKey="count" />
                      <YAxis
                        dataKey="reason"
                        type="category"
                        tick={{ fontSize: 12, width: 200, textAnchor: "start" }}
                        interval={0}
                      />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted))" }}
                        content={<ChartTooltipContent />}
                      />
                      <Bar
                        dataKey="count"
                        layout="vertical"
                        radius={4}
                        fill="var(--color-count)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="col-span-full lg:col-span-3 shadow-lg">
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>
                  Performance & compliance scores by campaign.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] w-full">
                <ScrollArea className="h-full">
                  <div className="min-h-[350px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campaign</TableHead>
                          <TableHead className="text-right">QA Score</TableHead>
                          <TableHead className="text-right">
                            Compliance
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaignPerformanceData.map((c) => (
                          <TableRow key={c.name}>
                            <TableCell className="font-medium">
                              {c.name}
                            </TableCell>
                            <TableCell className="text-right">
                              {c.score}%
                            </TableCell>
                            <TableCell className="text-right">
                              {c.compliance}%
                            </TableCell>
                          </TableRow>
                        ))}
                        {campaignPerformanceData.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="text-center text-muted-foreground"
                            >
                              No campaign data available.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="text-green-500 h-5 w-5" />
                  Top Performers
                </CardTitle>
                <CardDescription>
                  Agents with the highest average QA scores.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead className="text-right">Avg. Score</TableHead>
                      <TableHead className="text-right">Audits</TableHead>
                      <TableHead className="text-right">Pass/Fail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentPerformanceData.topAgents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell>{agent.name}</TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          {agent.score}%
                        </TableCell>
                        <TableCell className="text-right">
                          {agent.audits}
                        </TableCell>
                        <TableCell className="text-right">
                          {agent.pass}/{agent.fail}
                        </TableCell>
                      </TableRow>
                    ))}
                    {agentPerformanceData.topAgents.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground"
                        >
                          No top performers found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <TrendingDown className="h-5 w-5" />
                  Needs Improvement
                </CardTitle>
                <CardDescription>
                  Agents with opportunities for growth.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead className="text-right">Avg. Score</TableHead>
                      <TableHead className="text-right">Audits</TableHead>
                      <TableHead className="text-right">Pass/Fail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentPerformanceData.underperformingAgents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell>{agent.name}</TableCell>
                        <TableCell className="text-right font-bold text-red-600">
                          {agent.score}%
                        </TableCell>
                        <TableCell className="text-right">
                          {agent.audits}
                        </TableCell>
                        <TableCell className="text-right">
                          {agent.pass}/{agent.fail}
                        </TableCell>
                      </TableRow>
                    ))}
                    {agentPerformanceData.underperformingAgents.length ===
                      0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground"
                        >
                          No agents currently need improvement.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="text-primary h-5 w-5" />
                  Daily Audits Trend
                </CardTitle>
                <CardDescription>
                  Number of audits completed each day.
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ChartContainer
                  config={chartConfigDailyAudits}
                  className="h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dailyAuditsData}
                      margin={{ left: 12, top: 20, right: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        cursor={{ stroke: "hsl(var(--muted))" }}
                        content={<ChartTooltipContent />}
                      />
                      <Line
                        type="monotone"
                        dataKey="audits"
                        stroke="var(--color-audits)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <ShieldCheck className="h-5 w-5" />
                  Daily Fatal Errors
                </CardTitle>
                <CardDescription>
                  Fatal errors detected each day across all audits.
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ChartContainer
                  config={chartConfigDailyFatalErrors}
                  className="h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dailyFatalErrorsData}
                      margin={{ left: 12, top: 20, right: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        cursor={{ stroke: "hsl(var(--muted))" }}
                        content={<ChartTooltipContent />}
                      />
                      <Line
                        type="monotone"
                        dataKey="fatalErrors"
                        stroke="var(--color-fatalErrors)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>My Audits</CardTitle>
          <CardDescription>
            A list of all audits performed. Click a row to see details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Campaign</TableHead>
                {!isAgentView && <TableHead>Agent</TableHead>}
                <TableHead>Score</TableHead>
                <TableHead>Audit Type</TableHead>
                {currentUser?.role === "Administrator" && (
                  <>
                    <TableHead>Duration</TableHead>
                    <TableHead>Tokens (In/Out)</TableHead>
                  </>
                )}
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAudits.map((audit) => (
                <TableRow
                  key={audit.id}
                  onClick={() => openAuditDetailsModal(audit)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    {format(new Date(audit.auditDate), "PP")}
                  </TableCell>
                  <TableCell>{audit.campaignName}</TableCell>
                  {!isAgentView && <TableCell>{audit.agentName}</TableCell>}
                  <TableCell className="font-bold">
                    {audit.overallScore.toFixed(2)}%
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        audit.auditType === "ai" ? "default" : "secondary"
                      }
                    >
                      {audit.auditType.toUpperCase()}
                    </Badge>
                  </TableCell>
                  {currentUser?.role === "Administrator" && (
                    <>
                      <TableCell>
                        {audit.auditData?.auditDurationMs
                          ? `${(audit.auditData.auditDurationMs / 1000).toFixed(
                              1
                            )}s`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {audit.auditData?.tokenUsage
                          ? `${audit.auditData.tokenUsage.inputTokens || 0} / ${
                              audit.auditData.tokenUsage.outputTokens || 0
                            }`
                          : "-"}
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAuditToDelete(audit);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {filteredAudits.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-end space-x-2 py-4">
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
        </CardContent>
      </Card>
    </div>
  );
};
