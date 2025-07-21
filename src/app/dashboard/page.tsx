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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  Bar,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  CalendarDays,
  Filter,
  FileDown,
  CheckSquare,
  Loader2,
  Languages,
  Settings2,
  FileAudio,
  UploadCloud,
  VenetianMask,
  PlayCircle,
  PauseCircle,
  Volume2,
  BookOpen,
  ListChecks,
  PhoneIncoming,
  ClipboardList,
  MicVocal,
  Globe,
  FileText,
  Target,
  TrendingUp,
  UserCheck,
  Activity,
  Users,
  Briefcase,
  Percent,
  AlertCircle,
  MessageSquare,
  Download,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  QrCode,
  FileCheck,
  ClipboardCheckIcon,
  UserCircle,
  Tag,
  BookCopy,
  Brain,
  Save,
  RotateCcw,
  ActivitySquare,
  ShieldCheck,
  Smile,
  Meh,
  Frown,
  BarChart2,
  UserCog,
  Info,
  AlertTriangle,
  Bot,
  Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  qaAuditCall,
  type QaAuditInput,
  type QaAuditOutput,
  type AuditResultItem,
} from "@/ai/flows/qa-audit-flow"; // Removed local interface declaration
import { grammarCheck } from "@/ai/flows/grammar-check-flow";
import { Textarea } from "@/components/ui/textarea";
import { useSearchParams, useRouter } from "next/navigation"; // keep useSearchParams import here
import type {
  QAParameter,
  Parameter as ParameterGroup,
  SubParameter,
} from "@/types/qa-parameter";
import type { SOP } from "@/types/sop";
import type { SavedAuditItem } from "@/types/audit";
import { Separator } from "@/components/ui/separator";
import { LucideProps } from "lucide-react";
import { OverviewCard } from "@/components/dashboard/OverviewCard";
import {
  AudioUploadDropzone,
  type AudioUploadDropzoneRef,
} from "@/components/dashboard/AudioUploadDropzone";
import {
  Tooltip as ShadTooltip,
  TooltipContent as ShadTooltipContent,
  TooltipProvider as ShadTooltipProvider,
  TooltipTrigger as ShadTooltipTrigger,
} from "@/components/ui/tooltip";
import { AuditChatbot } from "@/components/dashboard/AuditChatbot";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getLoggedInUserDetails } from "@/lib/authService";
import type { User } from "@/lib/authService";

import { Suspense } from "react";
declare module "lucide-react" {
  interface LucideProps {
    title?: string;
  }
}

interface CustomLucideProps extends LucideProps {
  title?: string;
}

const MAX_AUDIO_FILE_SIZE_MB = 5;
const MAX_AUDIO_FILE_SIZE_BYTES = MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024;
const LOCAL_STORAGE_KEY_PARAMETERS = "assureQaiQaParameterSets";
const LOCAL_STORAGE_KEY_SOPS = "assureQaiSops";
const LOCAL_STORAGE_KEY_SAVED_AUDITS = "assureQaiSavedAudits";

const DEFAULT_AUDIT_PARAMETERS: ParameterGroup[] = [
  {
    id: "default_group_1",
    name: "Greeting and Professionalism",
    subParameters: [
      {
        id: "default_sub_1",
        name: "Agent used standard greeting",
        weight: 10,
        type: "Non-Fatal",
      },
      {
        id: "default_sub_2",
        name: "Agent was professional and courteous",
        weight: 10,
        type: "Non-Fatal",
      },
    ],
  },
  {
    id: "default_group_2",
    name: "Problem Identification",
    subParameters: [
      {
        id: "default_sub_3",
        name: "Agent actively listened",
        weight: 20,
        type: "Non-Fatal",
      },
      {
        id: "default_sub_4",
        name: "Agent correctly identified the issue",
        weight: 25,
        type: "Non-Fatal",
      },
    ],
  },
  {
    id: "default_group_3",
    name: "Resolution",
    subParameters: [
      {
        id: "default_sub_5",
        name: "Agent provided correct solution",
        weight: 20,
        type: "Fatal",
      },
      {
        id: "default_sub_6",
        name: "Agent offered further assistance",
        weight: 15,
        type: "Non-Fatal",
      },
    ],
  },
];

const DEFAULT_CALL_LANGUAGE = "Hindi";
const MAX_BULK_FILES = 5;

interface BulkFileSlot {
  file: File | null;
  language: string;
  result: QaAuditOutput | null | undefined;
  error: string | null;
  isLoading: boolean;
  audioDataUri: string | null;
}

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState<ReactNode>(null);

  // Single Audit States
  const [qaAgentUserId, setQaAgentUserId] = useState<string>("");
  const [qaCampaignName, setQaCampaignName] = useState<string>("");
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [originalAudioDataUri, setOriginalAudioDataUri] = useState<
    string | null
  >(null);
  const [previewAudioSrc, setPreviewAudioSrc] = useState<string | null>(null);
  const [audioKey, setAudioKey] = useState<string>(Date.now().toString());
  const audioInputRef = useRef<AudioUploadDropzoneRef>(null);
  const [qaCallLanguage, setQaCallLanguage] = useState<string>(
    DEFAULT_CALL_LANGUAGE
  );
  const [qaTranscriptionLanguage, setQaTranscriptionLanguage] =
    useState<string>("");
  const [qaAuditParameters, setQaAuditParameters] = useState<ParameterGroup[]>(
    DEFAULT_AUDIT_PARAMETERS
  );
  const [availableQaParameterSets, setAvailableQaParameterSets] = useState<
    QAParameter[]
  >([]);
  const [selectedQaParameterSetId, setSelectedQaParameterSetId] =
    useState<string>("default_params_set");
  const [availableSops, setAvailableSops] = useState<SOP[]>([]);
  const [selectedSopId, setSelectedSopId] =
    useState<string>("default_params_sop");
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<QaAuditOutput | null>(null);

  // Bulk Audit States
  const [bulkCommonAgentUserId, setBulkCommonAgentUserId] =
    useState<string>("");
  const [bulkCommonCampaignName, setBulkCommonCampaignName] =
    useState<string>("");
  const [bulkSelectedQaParameterSetId, setBulkSelectedQaParameterSetId] =
    useState<string>("default_params_set");
  const [bulkSelectedSopId, setBulkSelectedSopId] =
    useState<string>("default_params_sop");
  const [bulkQaAuditParameters, setBulkQaAuditParameters] = useState<
    ParameterGroup[]
  >(DEFAULT_AUDIT_PARAMETERS);

  const initialBulkFileSlot = {
    file: null as File | null,
    language: DEFAULT_CALL_LANGUAGE,
    result: null as QaAuditOutput | null,
    error: null as string | null,
    isLoading: false,
    audioDataUri: null as string | null,
  };
  const [bulkFileSlots, setBulkFileSlots] = useState<BulkFileSlot[]>(
    Array(MAX_BULK_FILES)
      .fill(null)
      .map(() => ({ ...initialBulkFileSlot }))
  );
  const [isOverallBulkAuditing, setIsOverallBulkAuditing] =
    useState<boolean>(false);

  // Manual Audit States
  const [manualAgentUserId, setManualAgentUserId] = useState<string>("");
  const [manualCampaignName, setManualCampaignName] = useState<string>("");
  const [manualSelectedAudioFile, setManualSelectedAudioFile] =
    useState<File | null>(null);
  const [manualPreviewAudioSrc, setManualPreviewAudioSrc] = useState<
    string | null
  >(null);
  const [manualAudioKey, setManualAudioKey] = useState<string>(
    Date.now().toString()
  );
  const manualAudioInputRef = useRef<AudioUploadDropzoneRef>(null);
  const [manualSelectedQaParameterSetId, setManualSelectedQaParameterSetId] =
    useState<string>("default_params_set");
  const [manualSelectedSopId, setManualSelectedSopId] =
    useState<string>("default_params_sop");
  const [manualAuditParameters, setManualAuditParameters] = useState<
    ParameterGroup[]
  >(DEFAULT_AUDIT_PARAMETERS);

  type ManualAuditResult = {
    [groupId: string]: {
      // This matches the ParameterGroup id
      [subParamId: string]: { score: number; comments: string };
    };
  };
  const [manualAuditResults, setManualAuditResults] =
    useState<ManualAuditResult>({});
  const [manualOverallScore, setManualOverallScore] = useState<number>(0);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState<string | null>(
    null
  );

  const [savedAudits, setSavedAudits] = useState<SavedAuditItem[]>([]);

  const [isSpeakingEnglish, setIsSpeakingEnglish] = useState(false);
  const englishSpeechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(
    null
  );
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);

  const searchParams = useSearchParams();
  const router = useRouter();
  const [userFullName, setUserFullName] = useState("AssureQAI User");

  const activeTab = searchParams.get("tab") || "overview";

  // New state variables for dashboard overview
  const [overviewFilter, setOverviewFilter] = useState<"all" | "ai" | "manual">(
    "all"
  );
  const [overallQAScore, setOverallQAScore] = useState(0);
  const [auditCoverageData, setAuditCoverageData] = useState({
    audited: 0,
    totalInteractions: 0,
    percentageAudited: "0.0",
    auditFrequency: "0 audits/agent/week",
  });
  const [topIssuesData, setTopIssuesData] = useState([
    {
      id: "issue_default_1",
      reason: "Awaiting audit data...",
      count: 0,
      critical: false,
    },
    {
      id: "issue_default_2",
      reason: "Awaiting audit data...",
      count: 0,
      critical: false,
    },
  ]);
  const [agentPerformanceData, setAgentPerformanceData] = useState({
    topAgents: [
      { id: "agent_default_top", name: "N/A", score: 0, team: "N/A" },
    ],
    underperformingAgents: [
      { id: "agent_default_under", name: "N/A", score: 0, team: "N/A" },
    ],
    teamScores: [{ id: "team_default", name: "N/A", score: 0 }],
  });
  const [complianceData, setComplianceData] = useState({
    interactionsWithIssues: 0,
    totalAuditedInteractionsForCompliance: 0,
    detectedKeywords: ["Awaiting data..."],
  });
  const [sentimentData, setSentimentData] = useState({
    positive: 0,
    neutral: 0,
    negative: 0,
    aiSummary: "Sentiment analysis based on audits will appear here.",
  });
  const [auditStatusData, setAuditStatusData] = useState({
    pendingReviews: 0,
    assignedVsCompleted: "0/0",
    feedbackSent: 0,
  });
  const [smartInsightsData, setSmartInsightsData] = useState([
    "AI-powered insights will be generated once enough audit data is available.",
  ]);
  const [tniData, setTniData] = useState<
    {
      area: string;
      details: string;
      agentsAffected?: string[];
      count: number;
    }[]
  >([
    {
      area: "Awaiting audit data...",
      details: "No training needs identified yet.",
      count: 0,
    },
  ]);
  const [availableCampaignsForFilter, setAvailableCampaignsForFilter] =
    useState([{ id: "all", name: "All Campaigns" }]);
  const [selectedCampaignIdForFilter, setSelectedCampaignIdForFilter] =
    useState("all");

  const chartConfigTopIssues = {
    count: { label: "Count", color: "hsl(var(--chart-2))" },
  } as const;

  const chartConfigTeamScores = {
    score: { label: "Score", color: "hsl(var(--primary))" },
  } as const;

  const chartConfigSentiment = {
    value: { label: "Percentage" },
    Positive: { label: "Positive", color: "hsl(var(--chart-1))" },
    Neutral: { label: "Neutral", color: "hsl(var(--chart-2))" },
    Negative: { label: "Negative", color: "hsl(var(--chart-3))" },
  } as const;

  const sentimentChartData = [
    { name: "Positive", value: sentimentData.positive },
    { name: "Neutral", value: sentimentData.neutral },
    { name: "Negative", value: sentimentData.negative },
  ];

  // Effect for setting isClient
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Effect for loading data from localStorage and setting defaults (runs once after client is set)
  useEffect(() => {
    if (!isClient) return;

    const userDetails = getLoggedInUserDetails();
    if (userDetails?.fullName) {
      setUserFullName(userDetails.fullName);
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

    const storedParameterSets = localStorage.getItem(
      LOCAL_STORAGE_KEY_PARAMETERS
    );
    if (storedParameterSets) {
      try {
        const parsedSets = JSON.parse(storedParameterSets) as QAParameter[];
        const activeCampaigns = parsedSets.filter((p) => p.isActive);
        setAvailableQaParameterSets(activeCampaigns);
        const campaignOptions = activeCampaigns.map((p) => ({
          id: p.id,
          name: p.name,
        }));
        setAvailableCampaignsForFilter([
          { id: "all", name: "All Campaigns" },
          ...campaignOptions,
        ]);
      } catch (e) {
        console.error("Failed to parse QA Parameter Sets from localStorage", e);
      }
    }

    const storedSops = localStorage.getItem(LOCAL_STORAGE_KEY_SOPS);
    if (storedSops) {
      try {
        setAvailableSops(JSON.parse(storedSops) as SOP[]);
      } catch (e) {
        console.error("Failed to parse SOPs from localStorage", e);
      }
    }

    const storedSavedAudits = localStorage.getItem(
      LOCAL_STORAGE_KEY_SAVED_AUDITS
    );
    if (storedSavedAudits) {
      try {
        setSavedAudits(JSON.parse(storedSavedAudits) as SavedAuditItem[]);
      } catch (e) {
        console.error("Failed to parse saved audits from localStorage", e);
      }
    }
  }, [isClient]);

  // Effect for initializing voices
  useEffect(() => {
    if (!isClient || typeof window === "undefined" || !window.speechSynthesis)
      return;

    const loadAndSetVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length > 0) {
        setAvailableVoices(allVoices);
      }
    };

    loadAndSetVoices();
    const voiceListener = () => {
      if (window.speechSynthesis.getVoices().length) {
        loadAndSetVoices();
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
    window.speechSynthesis.onvoiceschanged = voiceListener;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      if (
        typeof window !== "undefined" &&
        window.speechSynthesis &&
        window.speechSynthesis.speaking
      ) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isClient]);

  // Effect for calculating dashboard overview data
  useEffect(() => {
    if (!isClient) {
      setOverallQAScore(0);
      setTopIssuesData([
        {
          id: "issue_default_1",
          reason: "Awaiting audit data...",
          count: 0,
          critical: false,
        },
      ]);
      setAgentPerformanceData({
        topAgents: [
          { id: "agent_default_top", name: "N/A", score: 0, team: "N/A" },
        ],
        underperformingAgents: [
          { id: "agent_default_under", name: "N/A", score: 0, team: "N/A" },
        ],
        teamScores: [{ id: "team_default", name: "N/A", score: 0 }],
      });
      setSmartInsightsData([
        "AI-powered insights will be generated once enough audit data is available.",
      ]);
      setAuditCoverageData((prev) => ({
        ...prev,
        audited: 0,
        percentageAudited: "0.0",
        auditFrequency: "0 audits/agent/week",
      }));
      setComplianceData((prev) => ({
        ...prev,
        interactionsWithIssues: 0,
        totalAuditedInteractionsForCompliance: 0,
        detectedKeywords: ["Awaiting data..."],
      }));
      setSentimentData((prev) => ({
        ...prev,
        positive: 0,
        neutral: 0,
        negative: 0,
        aiSummary: "Sentiment analysis based on audits will appear here.",
      }));
      setAuditStatusData((prev) => ({
        ...prev,
        assignedVsCompleted: `0/0`,
        pendingReviews: 0,
        feedbackSent: 0,
      }));
      setTniData([
        {
          area: "Awaiting audit data...",
          details: "No training needs identified yet.",
          count: 0,
        },
      ]);
      return;
    }

    let baseFilteredAudits = [...savedAudits];

    // 1. Filter by Audit Type (AI vs Manual)
    if (overviewFilter !== "all") {
      baseFilteredAudits = baseFilteredAudits.filter(
        (audit) => audit.auditType === overviewFilter
      );
    }

    // 2. Filter by Date Range
    let dateFilteredAudits = [...baseFilteredAudits];
    if (dateRange?.from) {
      dateFilteredAudits = dateFilteredAudits.filter((audit) => {
        const auditDate = new Date(audit.auditDate);
        if (isNaN(auditDate.getTime())) return false;
        let inRange = auditDate >= dateRange.from!;
        if (dateRange.to) {
          inRange = inRange && auditDate <= dateRange.to!;
        }
        return inRange;
      });
    }

    // 3. Filter by Campaign
    let filteredAudits = [...dateFilteredAudits];
    if (selectedCampaignIdForFilter && selectedCampaignIdForFilter !== "all") {
      const selectedCampaign = availableQaParameterSets.find(
        (c) => c.id === selectedCampaignIdForFilter
      );
      if (selectedCampaign) {
        filteredAudits = filteredAudits.filter(
          (audit) => audit.campaignName === selectedCampaign.name
        );
      }
    }

    if (filteredAudits.length > 0) {
      const totalScore = filteredAudits.reduce(
        (sum, audit) => sum + audit.overallScore,
        0
      );
      setOverallQAScore(
        parseFloat((totalScore / filteredAudits.length).toFixed(1))
      );

      setAuditCoverageData((prev) => ({
        ...prev,
        audited: filteredAudits.length,
        percentageAudited:
          prev.totalInteractions > 0
            ? ((filteredAudits.length / prev.totalInteractions) * 100).toFixed(
                1
              )
            : "N/A",
        auditFrequency: `${(
          filteredAudits.length /
          (Object.keys(
            filteredAudits.reduce(
              (acc, curr) => ({ ...acc, [curr.agentUserId]: true }),
              {}
            )
          ).length || 1) /
          4
        ).toFixed(1)} audits/agent/week`,
      }));

      const issuesMap = new Map<
        string,
        { count: number; criticalCount: number }
      >();
      filteredAudits.forEach((audit) => {
        audit.auditData.auditResults.forEach((res) => {
          if (res.score < 80) {
            const existing = issuesMap.get(res.parameter) || {
              count: 0,
              criticalCount: 0,
            };
            existing.count++;
            if (res.score < 50) existing.criticalCount++;
            issuesMap.set(res.parameter, existing);
          }
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
            reason: "No significant QA failures identified in recent audits.",
            count: 0,
            critical: false,
          },
        ]);

      const agentScores: Record<
        string,
        { totalScore: number; auditCount: number; name: string }
      > = {};
      filteredAudits.forEach((audit) => {
        if (!agentScores[audit.agentUserId]) {
          agentScores[audit.agentUserId] = {
            totalScore: 0,
            auditCount: 0,
            name: audit.agentName,
          };
        }
        agentScores[audit.agentUserId].totalScore += audit.overallScore;
        agentScores[audit.agentUserId].auditCount++;
      });
      const avgAgentScores = Object.entries(agentScores)
        .map(([id, data]) => ({
          id,
          name: data.name,
          score: parseFloat((data.totalScore / data.auditCount).toFixed(1)),
        }))
        .sort((a, b) => b.score - a.score);

      if (avgAgentScores.length > 0) {
        setAgentPerformanceData((prev) => ({
          ...prev,
          topAgents: avgAgentScores
            .slice(0, 3)
            .map((a) => ({ ...a, team: "N/A" })),
          underperformingAgents: avgAgentScores
            .filter((a) => a.score < 80)
            .slice(-2)
            .map((a) => ({ ...a, team: "N/A" })),
        }));
      } else {
        setAgentPerformanceData({
          topAgents: [
            { id: "agent_none_top", name: "N/A", score: 0, team: "N/A" },
          ],
          underperformingAgents: [
            { id: "agent_none_under", name: "N/A", score: 0, team: "N/A" },
          ],
          teamScores: [{ id: "team_none", name: "N/A", score: 0 }],
        });
      }
      const currentOverallQAScore =
        filteredAudits.length > 0
          ? parseFloat(
              (
                filteredAudits.reduce(
                  (sum, audit) => sum + audit.overallScore,
                  0
                ) / filteredAudits.length
              ).toFixed(1)
            )
          : 0;
      setAgentPerformanceData((prev) => ({
        ...prev,
        teamScores: [
          {
            id: "team_alpha_placeholder",
            name: "Alpha Team (Example)",
            score:
              currentOverallQAScore > 5
                ? parseFloat((currentOverallQAScore - 5).toFixed(1))
                : 0,
          },
        ],
      }));

      setComplianceData((prev) => ({
        ...prev,
        interactionsWithIssues: filteredAudits.filter(
          (a) =>
            (a.auditData.rootCauseAnalysis &&
              a.auditData.rootCauseAnalysis.toLowerCase() !==
                "no significant issues requiring rca identified." &&
              a.auditData.rootCauseAnalysis.trim() !== "") ||
            a.overallScore < 70
        ).length,
        totalAuditedInteractionsForCompliance: filteredAudits.length,
        detectedKeywords: filteredAudits
          .reduce((acc, audit) => {
            if (
              audit.auditData.rootCauseAnalysis &&
              audit.auditData.rootCauseAnalysis.toLowerCase() !==
                "no significant issues requiring rca identified." &&
              audit.auditData.rootCauseAnalysis.trim() !== ""
            ) {
              const keywords = audit.auditData.rootCauseAnalysis
                .split(" ")
                .slice(0, 5)
                .join(" ");
              if (!acc.includes(keywords + "... (RCA Extract)"))
                acc.push(keywords + "... (RCA Extract)");
            }
            return acc;
          }, [] as string[])
          .slice(0, 2),
      }));
      if (complianceData.detectedKeywords.length === 0)
        complianceData.detectedKeywords = ["Awaiting data..."];

      setSentimentData((prev) => ({
        ...prev,
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
        aiSummary:
          "General sentiment trends can be derived from overall audit scores and specific parameter feedback.",
      }));

      setAuditStatusData((prev) => ({
        ...prev,
        assignedVsCompleted: `${filteredAudits.length}/${filteredAudits.length}`,
      }));

      const tniMap = new Map<
        string,
        {
          comments: Set<string>;
          agents: Set<string>;
          count: number;
          totalScore: number;
        }
      >();
      filteredAudits.forEach((audit) => {
        audit.auditData.auditResults.forEach((res) => {
          if (res.score < 70) {
            const area = res.parameter;
            const agentName = audit.agentName;
            const entry = tniMap.get(area) || {
              comments: new Set(),
              agents: new Set(),
              count: 0,
              totalScore: 0,
            };
            entry.count++;
            entry.agents.add(agentName);
            if (res.comments) entry.comments.add(res.comments);
            entry.totalScore += res.score;
            tniMap.set(area, entry);
          }
        });
      });
      const derivedTni = Array.from(tniMap.entries())
        .map(([area, data]) => ({
          area,
          details: `${
            data.count
          } instance(s) where performance needs improvement (Avg score: ${(
            data.totalScore / data.count
          ).toFixed(1)}). Common feedback: ${Array.from(data.comments)
            .slice(0, 1)
            .join("; ")}${data.comments.size > 1 ? "..." : ""}`,
          agentsAffected: Array.from(data.agents),
          count: data.count,
        }))
        .sort((a, b) => b.count - a.count);

      if (derivedTni.length > 0) setTniData(derivedTni);
      else
        setTniData([
          {
            area: "No training needs identified.",
            details:
              "All parameters are above the threshold in the filtered audits.",
            count: 0,
          },
        ]);

      if (filteredAudits.length > 1 && currentOverallQAScore > 0) {
        const lowestScore = Math.min(
          ...filteredAudits.map((a) => a.overallScore)
        );
        const insights = [
          `Consider additional training for agents scoring below ${Math.min(
            lowestScore + 10,
            80
          )}% on average.`,
          `Focus on parameters like "${
            topIssuesData.length > 0 && topIssuesData[0].count > 0
              ? topIssuesData[0].reason
              : "Call Closing"
          }" as it's a common area for improvement.`,
          `Current audit volume suggests reviewing approximately ${Math.ceil(
            filteredAudits.length / (Object.keys(agentScores).length || 1) / 4
          )} calls per week per agent (assuming 4 weeks).`,
        ];
        if (insights.length > 0) setSmartInsightsData(insights);
      } else if (filteredAudits.length === 1 && currentOverallQAScore > 0) {
        const insights = [
          `First audit data available. Overall score: ${currentOverallQAScore}%. Monitor trends as more audits are completed.`,
          `Review this audit's parameters: ${filteredAudits[0].auditData.auditResults
            .map((r) => r.parameter)
            .join(", ")} for initial insights.`,
        ];
        if (insights.length > 0) setSmartInsightsData(insights);
      } else {
        setSmartInsightsData([
          "AI-powered insights will be generated once enough audit data is available.",
        ]);
      }
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
      setAgentPerformanceData({
        topAgents: [
          { id: "agent_default_top", name: "N/A", score: 0, team: "N/A" },
        ],
        underperformingAgents: [
          { id: "agent_default_under", name: "N/A", score: 0, team: "N/A" },
        ],
        teamScores: [{ id: "team_default", name: "N/A", score: 0 }],
      });
      setSmartInsightsData([
        "AI-powered insights will be generated once enough audit data is available.",
      ]);
      setAuditCoverageData((prev) => ({
        ...prev,
        audited: 0,
        percentageAudited: "0.0",
        auditFrequency: "0 audits/agent/week",
      }));
      setComplianceData((prev) => ({
        ...prev,
        interactionsWithIssues: 0,
        totalAuditedInteractionsForCompliance: 0,
        detectedKeywords: ["Awaiting data..."],
      }));
      setSentimentData((prev) => ({
        ...prev,
        positive: 0,
        neutral: 0,
        negative: 0,
        aiSummary: "Sentiment analysis based on audits will appear here.",
      }));
      setAuditStatusData((prev) => ({
        ...prev,
        assignedVsCompleted: `0/0`,
        pendingReviews: 0,
        feedbackSent: 0,
      }));
      setTniData([
        {
          area: "Awaiting audit data...",
          details: "No training needs identified yet.",
          count: 0,
        },
      ]);
    }
  }, [
    isClient,
    savedAudits,
    dateRange,
    selectedCampaignIdForFilter,
    availableQaParameterSets,
    overviewFilter,
  ]);

  const handleAudioFileSelected = (file: File | null) => {
    // Reset states for new file selection or clearing
    setSelectedAudioFile(null);
    setOriginalAudioDataUri(null);
    setPreviewAudioSrc(null);
    setAudioKey(Date.now().toString());

    if (!file) {
      audioInputRef.current?.clearFile();
      return;
    }

    if (!file.type.startsWith("audio/") && file.type !== "video/mp4") {
      toast({
        title: "Invalid file type",
        description:
          "Please select an audio file (e.g., MP3, WAV, OGG, M4A) or an MP4 video file.",
        variant: "destructive",
      });
      audioInputRef.current?.clearFile();
      return;
    }

    if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
      toast({
        title: "File too large",
        description: `Please select an audio file smaller than ${MAX_AUDIO_FILE_SIZE_MB}MB.`,
        variant: "destructive",
      });
      audioInputRef.current?.clearFile();
      return;
    }

    setSelectedAudioFile(file);

    const originalFileDataUriReader = new FileReader();
    originalFileDataUriReader.onload = (e) => {
      setOriginalAudioDataUri(e.target?.result as string);
    };
    originalFileDataUriReader.onerror = () => {
      toast({
        title: "File Read Error",
        description:
          "Error reading original file for AI processing. Please try again.",
        variant: "destructive",
      });
      setSelectedAudioFile(null);
      setOriginalAudioDataUri(null);
      audioInputRef.current?.clearFile();
    };
    originalFileDataUriReader.readAsDataURL(file);

    try {
      const objectUrl = URL.createObjectURL(file);
      setPreviewAudioSrc(objectUrl);
      setAudioKey(objectUrl);
    } catch (urlError) {
      console.error("Error creating ObjectURL for preview:", urlError);
      toast({
        title: "Preview Error",
        description: "Could not create a preview for the selected file.",
        variant: "destructive",
      });
      setPreviewAudioSrc(null);
      setAudioKey(Date.now().toString());
    }
  };

  const handleQaAudit = async () => {
    if (
      !qaCallLanguage ||
      qaAuditParameters.length === 0 ||
      !qaAgentUserId ||
      !qaCampaignName
    ) {
      toast({
        title: "Missing Information",
        description:
          "Please provide Agent User ID, Campaign Name, call language and ensure audit parameters are set.",
        variant: "destructive",
      });
      return;
    }
    setIsAuditing(true);
    setAuditResult(null);

    if (
      typeof window !== "undefined" &&
      window.speechSynthesis &&
      window.speechSynthesis.speaking
    ) {
      window.speechSynthesis.cancel();
      setIsSpeakingEnglish(false);
    }

    try {
      const input: QaAuditInput = {
        agentUserId: qaAgentUserId,
        campaignName: qaCampaignName,
        audioDataUri: originalAudioDataUri || "", // Pass the base64 URI
        callLanguage: qaCallLanguage,
        transcriptionLanguage: qaTranscriptionLanguage,
        auditParameters: qaAuditParameters,
      };

      const result = await qaAuditCall(input);
      setAuditResult(result);
      toast({
        title: "Audit Complete",
        description: `Successfully audited call for agent ${result.identifiedAgentName}.`,
      });
    } catch (error) {
      console.error("Error during QA audit:", error);
      toast({
        title: "Audit Failed",
        description:
          error instanceof Error
            ? error.message
            : "An unknown error occurred during the audit.",
        variant: "destructive",
      });
    } finally {
      setIsAuditing(false);
    }
  };

  const resetSingleAuditForm = () => {
    setQaAgentUserId("");
    setQaCampaignName("");
    setSelectedAudioFile(null);
    setOriginalAudioDataUri(null);
    setPreviewAudioSrc(null);
    setAudioKey(Date.now().toString());
    audioInputRef.current?.clearFile();
    setQaCallLanguage(DEFAULT_CALL_LANGUAGE);
    setQaTranscriptionLanguage("");
    setSelectedQaParameterSetId("default_params_set");
    setSelectedSopId("default_params_sop");
    setQaAuditParameters(DEFAULT_AUDIT_PARAMETERS);
    setAuditResult(null);
    setIsAuditing(false);
    if (
      typeof window !== "undefined" &&
      window.speechSynthesis &&
      window.speechSynthesis.speaking
    ) {
      window.speechSynthesis.cancel();
      setIsSpeakingEnglish(false);
    }
    toast({
      title: "Form Cleared",
      description: "The QA Audit form has been reset.",
    });
  };

  const handleBulkFileSelected = (file: File | null, index: number) => {
    if (file) {
      if (!file.type.startsWith("audio/") && file.type !== "video/mp4") {
        toast({
          title: "Invalid File Type",
          description: "Please select an audio or MP4 file.",
          variant: "destructive",
        });
        return;
      }
      if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
        toast({
          title: "File Too Large",
          description: `File size cannot exceed ${MAX_AUDIO_FILE_SIZE_MB}MB.`,
          variant: "destructive",
        });
        return;
      }
    }

    const newSlots = [...bulkFileSlots];
    newSlots[index] = {
      ...newSlots[index],
      file,
      result: null,
      error: null,
      audioDataUri: null,
    };
    setBulkFileSlots(newSlots);

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        const updatedSlots = [...bulkFileSlots];
        updatedSlots[index].audioDataUri = dataUri;
        setBulkFileSlots(updatedSlots);
      };
      reader.onerror = () => {
        const errorSlots = [...bulkFileSlots];
        errorSlots[index].error = "Failed to read file.";
        setBulkFileSlots(errorSlots);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBulkAudit = async () => {
    if (
      !bulkCommonAgentUserId ||
      !bulkCommonCampaignName ||
      bulkQaAuditParameters.length === 0
    ) {
      toast({
        title: "Missing Information",
        description:
          "Please provide common Agent User ID, Campaign Name, and select parameters.",
        variant: "destructive",
      });
      return;
    }

    const filesToAudit = bulkFileSlots.filter(
      (slot) => slot.file && slot.audioDataUri
    );
    if (filesToAudit.length === 0) {
      toast({
        title: "No Files to Audit",
        description: "Please add at least one audio file.",
        variant: "destructive",
      });
      return;
    }

    setIsOverallBulkAuditing(true);

    const auditPromises = bulkFileSlots.map(async (slot, index) => {
      if (!slot.file || !slot.audioDataUri) return null;

      const newSlots = [...bulkFileSlots];
      newSlots[index].isLoading = true;
      setBulkFileSlots(newSlots);

      try {
        const input: QaAuditInput = {
          agentUserId: bulkCommonAgentUserId,
          campaignName: bulkCommonCampaignName,
          audioDataUri: slot.audioDataUri,
          callLanguage: slot.language,
          auditParameters: bulkQaAuditParameters,
        };
        const result = await qaAuditCall(input);
        return { index, result };
      } catch (error) {
        console.error(`Error auditing file at index ${index}:`, error);
        return {
          index,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    const results = await Promise.all(auditPromises);

    let finalSlots = [...bulkFileSlots];
    results.forEach((res) => {
      if (res) {
        finalSlots[res.index].isLoading = false;
        if ("result" in res) {
          finalSlots[res.index].result = res.result;
          finalSlots[res.index].error = null;
        } else if ("error" in res) {
          finalSlots[res.index].error = res.error;
          finalSlots[res.index].result = null;
        }
      }
    });

    setBulkFileSlots(finalSlots);
    setIsOverallBulkAuditing(false);
    toast({
      title: "Bulk Audit Complete",
      description: "All selected files have been processed.",
    });
  };

  const handleManualAudioFileSelected = (file: File | null) => {
    setManualSelectedAudioFile(null);
    setManualPreviewAudioSrc(null);
    setManualAudioKey(Date.now().toString());

    if (!file) {
      manualAudioInputRef.current?.clearFile();
      return;
    }
    if (!file.type.startsWith("audio/") && file.type !== "video/mp4") {
      toast({
        title: "Invalid file type",
        description: "Please select an audio file (e.g., MP3, WAV, etc.).",
        variant: "destructive",
      });
      manualAudioInputRef.current?.clearFile();
      return;
    }
    if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
      toast({
        title: "File too large",
        description: `Please select an audio file smaller than ${MAX_AUDIO_FILE_SIZE_MB}MB.`,
        variant: "destructive",
      });
      manualAudioInputRef.current?.clearFile();
      return;
    }

    setManualSelectedAudioFile(file);
    try {
      const objectUrl = URL.createObjectURL(file);
      setManualPreviewAudioSrc(objectUrl);
      setManualAudioKey(objectUrl);
    } catch (e) {
      console.error("Error creating ObjectURL for manual preview:", e);
      toast({
        title: "Preview Error",
        description: "Could not create a preview for the selected file.",
        variant: "destructive",
      });
      setManualPreviewAudioSrc(null);
      setManualAudioKey(Date.now().toString());
    }
  };

  const handleManualResultChange = (
    groupId: string,
    subParamId: string,
    field: "score" | "comments",
    value: string | number
  ) => {
    setManualAuditResults((prev) => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [subParamId]: {
          ...(prev[groupId]?.[subParamId] || { score: 0, comments: "" }),
          [field]: value,
        },
      },
    }));
  };

  useEffect(() => {
    if (!manualAuditParameters || manualAuditParameters.length === 0) return;

    let totalWeightedScore = 0;
    manualAuditParameters.forEach((group) => {
      group.subParameters.forEach((subParam) => {
        const result = manualAuditResults[group.id]?.[subParam.id];
        const score = result?.score ?? 0;
        const weightedScore = (score * subParam.weight) / 100;
        totalWeightedScore += weightedScore;
      });
    });
    setManualOverallScore(parseFloat(totalWeightedScore.toFixed(2)));
  }, [manualAuditResults, manualAuditParameters]);

  const handleGrammarCheck = async (
    groupId: string,
    subParamId: string,
    text: string
  ) => {
    if (!text.trim()) return;
    setIsCheckingGrammar(`${groupId}-${subParamId}`);
    try {
      const result = await grammarCheck({ text });
      handleManualResultChange(
        groupId,
        subParamId,
        "comments",
        result.correctedText
      );
      toast({
        title: "Grammar Checked",
        description: "Comments have been updated with corrections.",
      });
    } catch (e) {
      toast({
        title: "Grammar Check Failed",
        description: e instanceof Error ? e.message : "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingGrammar(null);
    }
  };

  const handleSaveAudit = (
    auditData: QaAuditOutput & { agentUserId?: string; campaignName?: string },
    auditType: "ai" | "manual"
  ) => {
    const newSavedAudit: SavedAuditItem = {
      id: `audit_${Date.now()}`,
      auditDate: new Date().toISOString(),
      agentName: auditData.identifiedAgentName || "Unknown Agent",
      agentUserId: auditData.agentUserId || "N/A",
      campaignName: auditData.campaignName,
      overallScore: auditData.overallScore,
      auditData: auditData,
      auditType: auditType,
    };
    const updatedAudits = [...savedAudits, newSavedAudit];
    setSavedAudits(updatedAudits);
    localStorage.setItem(
      LOCAL_STORAGE_KEY_SAVED_AUDITS,
      JSON.stringify(updatedAudits)
    );
    toast({
      title: "Audit Saved",
      description: `The ${auditType} audit for ${newSavedAudit.agentName} has been saved.`,
    });
    // Maybe clear the form after saving?
    if (auditType === "ai") resetSingleAuditForm();
    // if (auditType === 'manual') resetManualAuditForm();
  };

  const handleSaveManualAudit = () => {
    if (!manualAgentUserId || !manualCampaignName) {
      toast({
        title: "Missing Information",
        description: "Please provide Agent User ID and Campaign Name.",
        variant: "destructive",
      });
      return;
    }

    const auditResultsForOutput: AuditResultItem[] =
      manualAuditParameters.flatMap((group) =>
        group.subParameters.map((subParam) => {
          const result = manualAuditResults[group.id]?.[subParam.id] || {
            score: 0,
            comments: "",
          };
          const weightedScore = (result.score * subParam.weight) / 100;
          return {
            parameter: `${group.name} - ${subParam.name}`,
            score: result.score,
            weightedScore: parseFloat(weightedScore.toFixed(2)),
            comments: result.comments,
            type: subParam.type,
          };
        })
      );

    const manualAuditForSaving: QaAuditOutput = {
      agentUserId: manualAgentUserId,
      campaignName: manualCampaignName,
      identifiedAgentName: `Agent ${manualAgentUserId}`,
      transcriptionInOriginalLanguage: "N/A - Manual Audit",
      callSummary: `Manual audit conducted for campaign: ${manualCampaignName}.`,
      auditResults: auditResultsForOutput,
      overallScore: manualOverallScore,
      summary:
        "This is a manually scored audit. Review individual parameter comments for feedback.",
    };

    handleSaveAudit(manualAuditForSaving, "manual");
  };

  const handleParameterSetChange = (
    id: string,
    setter: (params: ParameterGroup[]) => void
  ) => {
    const selectedSet = availableQaParameterSets.find((p) => p.id === id);
    if (selectedSet) {
      setter(selectedSet.parameters);
    } else {
      setter(DEFAULT_AUDIT_PARAMETERS);
    }
  };

  const openAuditDetailsModal = (audit: SavedAuditItem) => {
    setModalTitle(
      `Audit Details - ${audit.agentName} (${format(
        new Date(audit.auditDate),
        "PPp"
      )})`
    );
    setModalContent(
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
              {audit.auditData.auditResults.map((res, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{res.parameter}</TableCell>
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
                <CollapsibleContent>
                  <ScrollArea className="h-48 mt-2 p-3 border rounded-md">
                    <pre className="text-xs whitespace-pre-wrap">
                      {audit.auditData.transcriptionInOriginalLanguage}
                    </pre>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </div>
      </div>
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

  // Wrap the content that uses useSearchParams (directly or indirectly through activeTab)
  // in a Suspense boundary for correct SSR handling.
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <div className="flex-1 space-y-8 p-8 pt-6 bg-background">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Hi, {userFullName}! Welcome Back 👋
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
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

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
            <TabsTrigger value="qa-audits">
              <Brain className="mr-2 h-4 w-4" />
              QAi Audit
            </TabsTrigger>
            <TabsTrigger value="manual-audit">
              <ClipboardCheckIcon className="mr-2 h-4 w-4" />
              Manual Audit
            </TabsTrigger>
            <TabsTrigger value="bulk-qa-audit">
              <Users className="mr-2 h-4 w-4" />
              Bulk QA Audit
            </TabsTrigger>
            <TabsTrigger value="saved-audits">
              <Save className="mr-2 h-4 w-4" />
              Saved Audits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <OverviewCard title="Overall QA Score" icon={Target}>
                <div className="text-2xl font-bold">{overallQAScore}%</div>
                <p className="text-xs text-muted-foreground">
                  {Math.abs(overallQAScore - 85) < 2
                    ? "On par with target"
                    : overallQAScore > 85
                    ? "+5% vs target"
                    : "-8% vs target"}
                </p>
              </OverviewCard>
              <OverviewCard title="Total Audits" icon={ClipboardList}>
                <div className="text-2xl font-bold">
                  {auditCoverageData.audited}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across{" "}
                  {
                    Object.keys(
                      savedAudits.reduce(
                        (acc, curr) => ({ ...acc, [curr.agentUserId]: true }),
                        {}
                      )
                    ).length
                  }{" "}
                  agents this period
                </p>
              </OverviewCard>
              <OverviewCard title="Compliance Issues" icon={ShieldCheck}>
                <div className="text-2xl font-bold">
                  {complianceData.interactionsWithIssues}
                </div>
                <p className="text-xs text-muted-foreground">
                  Fatal or critical errors found
                </p>
              </OverviewCard>
              <OverviewCard title="Sentiment Mix" icon={Smile}>
                <div className="text-2xl font-bold">
                  {sentimentData.positive}% Positive
                </div>
                <p className="text-xs text-muted-foreground">
                  {sentimentData.negative}% Negative calls detected
                </p>
              </OverviewCard>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4 shadow-lg">
                <CardHeader>
                  <CardTitle>Top QA Issues</CardTitle>
                  <CardDescription>
                    Common parameters where agents need improvement.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <ChartContainer config={chartConfigTopIssues}>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart
                        layout="vertical"
                        data={topIssuesData}
                        margin={{ left: 120 }}
                      >
                        <CartesianGrid horizontal={false} />
                        <XAxis type="number" dataKey="count" />
                        <YAxis
                          dataKey="reason"
                          type="category"
                          tick={{
                            fontSize: 12,
                            width: 200,
                            textAnchor: "start",
                          }}
                          interval={0}
                        />
                        <Tooltip
                          cursor={{ fill: "hsl(var(--muted))" }}
                          content={<ChartTooltipContent />}
                        />
                        <Bar dataKey="count" layout="vertical" radius={4} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
              <Card className="col-span-3 shadow-lg">
                <CardHeader>
                  <CardTitle>Team Performance</CardTitle>
                  <CardDescription>
                    Average QA scores by team for this month.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigTeamScores}>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={agentPerformanceData.teamScores}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                          tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <YAxis />
                        <Tooltip
                          cursor={{ fill: "hsl(var(--muted))" }}
                          content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Bar dataKey="score" radius={8} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="qa-audits" className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>QAi Audit Setup</CardTitle>
                <CardDescription>
                  Configure the audit parameters and upload an audio file for AI
                  analysis. All fields are required.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="qa-agent-id">Agent User ID</Label>
                    <Input
                      id="qa-agent-id"
                      placeholder="e.g., AGENT007"
                      value={qaAgentUserId}
                      onChange={(e) => setQaAgentUserId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qa-campaign-name">Campaign Name</Label>
                    <Input
                      id="qa-campaign-name"
                      placeholder="e.g., Q3 Product Launch"
                      value={qaCampaignName}
                      onChange={(e) => setQaCampaignName(e.target.value)}
                    />
                  </div>
                </div>

                <AudioUploadDropzone
                  ref={audioInputRef}
                  onFileSelected={handleAudioFileSelected}
                />

                {previewAudioSrc && (
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <Label>Audio Preview</Label>
                    <audio
                      key={audioKey}
                      controls
                      src={previewAudioSrc}
                      className="w-full mt-2"
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="qa-call-language">Call Language</Label>
                    <Select
                      value={qaCallLanguage}
                      onValueChange={setQaCallLanguage}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Spanish">Spanish</SelectItem>
                        <SelectItem value="French">French</SelectItem>
                        <SelectItem value="German">German</SelectItem>
                        <SelectItem value="Mandarin Chinese">
                          Mandarin Chinese
                        </SelectItem>
                        <SelectItem value="Japanese">Japanese</SelectItem>
                        <SelectItem value="Russian">Russian</SelectItem>
                        <SelectItem value="Portuguese">Portuguese</SelectItem>
                        <SelectItem value="Arabic">Arabic</SelectItem>
                        <SelectItem value="Italian">Italian</SelectItem>
                        <Separator />
                        <SelectItem value="Hindi">Hindi</SelectItem>
                        <SelectItem value="Bengali">Bengali</SelectItem>
                        <SelectItem value="Telugu">Telugu</SelectItem>
                        <SelectItem value="Marathi">Marathi</SelectItem>
                        <SelectItem value="Tamil">Tamil</SelectItem>
                        <SelectItem value="Urdu">Urdu</SelectItem>
                        <SelectItem value="Gujarati">Gujarati</SelectItem>
                        <SelectItem value="Kannada">Kannada</SelectItem>
                        <SelectItem value="Odia">Odia</SelectItem>
                        <SelectItem value="Punjabi">Punjabi</SelectItem>
                        <SelectItem value="Malayalam">Malayalam</SelectItem>
                        <SelectItem value="Assamese">Assamese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qa-transcription-language">
                      Transcription Language (Optional)
                    </Label>
                    <Input
                      id="qa-transcription-language"
                      placeholder="e.g., Tamil (if call is Hindi)"
                      value={qaTranscriptionLanguage}
                      onChange={(e) =>
                        setQaTranscriptionLanguage(e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Audit Parameters</Label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Select
                      value={selectedQaParameterSetId}
                      onValueChange={(id) => {
                        setSelectedQaParameterSetId(id);
                        handleParameterSetChange(id, setQaAuditParameters);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a QA Parameter Set" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default_params_set">
                          Default Parameters
                        </SelectItem>
                        {availableQaParameterSets.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={selectedSopId}
                      onValueChange={setSelectedSopId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a related SOP (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default_params_sop">
                          No associated SOP
                        </SelectItem>
                        {availableSops
                          .filter((s) => s.status === "Published")
                          .map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.title} (v{s.version})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Card className="bg-muted/30">
                    <CardContent className="p-4">
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {qaAuditParameters.map((group) => (
                          <li key={group.id} className="font-semibold">
                            {group.name}
                            <ul className="list-disc list-inside pl-4 font-normal">
                              {group.subParameters.map((sub) => (
                                <li key={sub.id}>
                                  {sub.name} ({sub.weight}%)
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={resetSingleAuditForm}
                  disabled={isAuditing}
                >
                  Reset Form
                </Button>
                <Button
                  onClick={handleQaAudit}
                  disabled={isAuditing || !originalAudioDataUri}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isAuditing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Brain className="mr-2 h-4 w-4" />
                  )}
                  {isAuditing ? "Auditing..." : "Start QAi Audit"}
                </Button>
              </CardFooter>
            </Card>

            {auditResult && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>QAi Audit Result</CardTitle>
                  <CardDescription>
                    Detailed analysis of the call for agent:{" "}
                    <span className="font-bold">
                      {auditResult.identifiedAgentName}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">
                          Overall Score
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {auditResult.overallScore.toFixed(2)}%
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">
                          Agent Name
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {auditResult.identifiedAgentName}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">
                          Call Language
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {auditResult.callLanguage || qaCallLanguage}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">
                          Fatal Errors
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {
                            auditResult.auditResults.filter(
                              (r) => r.type === "Fatal" && r.score < 80
                            ).length
                          }
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    <Label>Audit Summary</Label>
                    <p className="text-sm p-4 bg-muted rounded-md">
                      {auditResult.summary}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Detailed Scoring</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Parameter</TableHead>
                          <TableHead className="text-center">Score</TableHead>
                          <TableHead>Comments</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditResult.auditResults.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {item.parameter}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.score}
                            </TableCell>
                            <TableCell>{item.comments}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Call Summary</Label>
                      <Textarea
                        readOnly
                        value={auditResult.callSummary}
                        className="h-40 bg-muted/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Root Cause Analysis</Label>
                      <Textarea
                        readOnly
                        value={
                          auditResult.rootCauseAnalysis ||
                          "No significant issues requiring RCA identified."
                        }
                        className="h-40 bg-muted/50"
                      />
                    </div>
                  </div>

                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm">
                        Show/Hide Full Transcription & Chat
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4 space-y-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label>
                              Transcription (
                              {auditResult.callLanguage || qaCallLanguage})
                            </Label>
                          </div>
                          <ScrollArea className="h-64 p-4 border rounded-md bg-muted/50">
                            <pre className="text-sm whitespace-pre-wrap">
                              {auditResult.transcriptionInOriginalLanguage}
                            </pre>
                          </ScrollArea>
                        </div>
                        {auditResult.englishTranslation && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label>English Translation</Label>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  /* speak logic */
                                }}
                              >
                                {isSpeakingEnglish ? (
                                  <PauseCircle />
                                ) : (
                                  <PlayCircle />
                                )}
                              </Button>
                            </div>
                            <ScrollArea className="h-64 p-4 border rounded-md bg-muted/50">
                              <pre className="text-sm whitespace-pre-wrap">
                                {auditResult.englishTranslation}
                              </pre>
                            </ScrollArea>
                          </div>
                        )}
                      </div>
                      <AuditChatbot
                        auditSummary={auditResult.summary}
                        auditTranscription={
                          auditResult.transcriptionInOriginalLanguage
                        }
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={() => handleSaveAudit(auditResult, "ai")}>
                    <Save className="mr-2 h-4 w-4" /> Save Audit
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="manual-audit" className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Manual Audit</CardTitle>
                <CardDescription>
                  Score an interaction manually. You can optionally upload an
                  audio file for reference.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="manual-agent-id">Agent User ID</Label>
                    <Input
                      id="manual-agent-id"
                      placeholder="e.g., AGENT007"
                      value={manualAgentUserId}
                      onChange={(e) => setManualAgentUserId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manual-campaign-name">Campaign Name</Label>
                    <Input
                      id="manual-campaign-name"
                      placeholder="e.g., Q3 Product Launch"
                      value={manualCampaignName}
                      onChange={(e) => setManualCampaignName(e.target.value)}
                    />
                  </div>
                </div>

                <AudioUploadDropzone
                  ref={manualAudioInputRef}
                  onFileSelected={handleManualAudioFileSelected}
                />
                {manualPreviewAudioSrc && (
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <Label>Audio Reference</Label>
                    <audio
                      key={manualAudioKey}
                      controls
                      src={manualPreviewAudioSrc}
                      className="w-full mt-2"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Select Parameter Set</Label>
                  <Select
                    value={manualSelectedQaParameterSetId}
                    onValueChange={(id) => {
                      setManualSelectedQaParameterSetId(id);
                      handleParameterSetChange(id, setManualAuditParameters);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a QA Parameter Set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default_params_set">
                        Default Parameters
                      </SelectItem>
                      {availableQaParameterSets.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Scoring Sheet</Label>
                    <div className="p-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold">
                      Overall Score: {manualOverallScore}%
                    </div>
                  </div>
                  {manualAuditParameters.map((group) => (
                    <Card key={group.id} className="bg-card/60">
                      <CardHeader className="py-3">
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {group.subParameters.map((subParam) => (
                          <div
                            key={subParam.id}
                            className="grid grid-cols-1 md:grid-cols-[1fr,150px] gap-4 items-start"
                          >
                            <div className="space-y-2">
                              <Label htmlFor={`comment-${subParam.id}`}>
                                {subParam.name} (Weight: {subParam.weight}%)
                              </Label>
                              <div className="relative">
                                <Textarea
                                  id={`comment-${subParam.id}`}
                                  placeholder="Enter comments for this parameter..."
                                  value={
                                    manualAuditResults[group.id]?.[subParam.id]
                                      ?.comments || ""
                                  }
                                  onChange={(e) =>
                                    handleManualResultChange(
                                      group.id,
                                      subParam.id,
                                      "comments",
                                      e.target.value
                                    )
                                  }
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="absolute bottom-1 right-1 h-7 w-7"
                                  onClick={() =>
                                    handleGrammarCheck(
                                      group.id,
                                      subParam.id,
                                      manualAuditResults[group.id]?.[
                                        subParam.id
                                      ]?.comments || ""
                                    )
                                  }
                                  disabled={
                                    isCheckingGrammar ===
                                    `${group.id}-${subParam.id}`
                                  }
                                >
                                  {isCheckingGrammar ===
                                  `${group.id}-${subParam.id}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Brain className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`score-${subParam.id}`}>
                                Score (0-100)
                              </Label>
                              <div className="flex items-center gap-2">
                                <Slider
                                  id={`score-${subParam.id}`}
                                  min={0}
                                  max={100}
                                  step={1}
                                  value={[
                                    manualAuditResults[group.id]?.[subParam.id]
                                      ?.score || 0,
                                  ]}
                                  onValueChange={(value) =>
                                    handleManualResultChange(
                                      group.id,
                                      subParam.id,
                                      "score",
                                      value[0]
                                    )
                                  }
                                />
                                <Input
                                  type="number"
                                  className="w-20"
                                  value={
                                    manualAuditResults[group.id]?.[subParam.id]
                                      ?.score || 0
                                  }
                                  onChange={(e) =>
                                    handleManualResultChange(
                                      group.id,
                                      subParam.id,
                                      "score",
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleSaveManualAudit}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Save className="mr-2 h-4 w-4" /> Save Manual Audit
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="bulk-qa-audit" className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Bulk QAi Audit</CardTitle>
                <CardDescription>
                  Upload multiple audio files to be audited with the same
                  parameters. Maximum {MAX_BULK_FILES} files.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="bulk-agent-id">Common Agent User ID</Label>
                    <Input
                      id="bulk-agent-id"
                      placeholder="e.g., AGENT007"
                      value={bulkCommonAgentUserId}
                      onChange={(e) => setBulkCommonAgentUserId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulk-campaign-name">
                      Common Campaign Name
                    </Label>
                    <Input
                      id="bulk-campaign-name"
                      placeholder="e.g., Q3 Product Launch"
                      value={bulkCommonCampaignName}
                      onChange={(e) =>
                        setBulkCommonCampaignName(e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Select Parameter Set</Label>
                  <Select
                    value={bulkSelectedQaParameterSetId}
                    onValueChange={(id) => {
                      setBulkSelectedQaParameterSetId(id);
                      handleParameterSetChange(id, setBulkQaAuditParameters);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a QA Parameter Set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default_params_set">
                        Default Parameters
                      </SelectItem>
                      {availableQaParameterSets.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  {bulkFileSlots.map((slot, index) => (
                    <Card
                      key={index}
                      className="p-4 grid grid-cols-1 md:grid-cols-[1fr,200px] gap-4 items-center bg-card/70"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold">{index + 1}</span>
                        <div className="w-full">
                          <Input
                            type="file"
                            accept="audio/*,video/mp4"
                            onChange={(e) =>
                              handleBulkFileSelected(
                                e.target.files ? e.target.files[0] : null,
                                index
                              )
                            }
                            disabled={isOverallBulkAuditing}
                          />
                          {slot.file && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {slot.file.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="sr-only">Language</Label>
                        <Select
                          value={slot.language}
                          onValueChange={(lang) => {
                            const newSlots = [...bulkFileSlots];
                            newSlots[index].language = lang;
                            setBulkFileSlots(newSlots);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Spanish">Spanish</SelectItem>
                            <SelectItem value="French">French</SelectItem>
                            <SelectItem value="German">German</SelectItem>
                            <SelectItem value="Mandarin Chinese">
                              Mandarin Chinese
                            </SelectItem>
                            <SelectItem value="Japanese">Japanese</SelectItem>
                            <SelectItem value="Russian">Russian</SelectItem>
                            <SelectItem value="Portuguese">
                              Portuguese
                            </SelectItem>
                            <SelectItem value="Arabic">Arabic</SelectItem>
                            <SelectItem value="Italian">Italian</SelectItem>
                            <Separator />
                            <SelectItem value="Hindi">Hindi</SelectItem>
                            <SelectItem value="Bengali">Bengali</SelectItem>
                            <SelectItem value="Telugu">Telugu</SelectItem>
                            <SelectItem value="Marathi">Marathi</SelectItem>
                            <SelectItem value="Tamil">Tamil</SelectItem>
                            <SelectItem value="Urdu">Urdu</SelectItem>
                            <SelectItem value="Gujarati">Gujarati</SelectItem>
                            <SelectItem value="Kannada">Kannada</SelectItem>
                            <SelectItem value="Odia">Odia</SelectItem>
                            <SelectItem value="Punjabi">Punjabi</SelectItem>
                            <SelectItem value="Malayalam">Malayalam</SelectItem>
                            <SelectItem value="Assamese">Assamese</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {slot.isLoading && (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      )}
                      {slot.error && (
                        <AlertCircle
                          title={slot.error}
                          className="h-5 w-5 text-destructive"
                        />
                      )}
                      {slot.result && (
                        <CheckSquare className="h-5 w-5 text-green-500" />
                      )}
                    </Card>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleBulkAudit}
                  disabled={isOverallBulkAuditing}
                >
                  {isOverallBulkAuditing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Brain className="mr-2 h-4 w-4" />
                  )}
                  {isOverallBulkAuditing
                    ? "Auditing All..."
                    : `Audit ${
                        bulkFileSlots.filter((s) => s.file).length
                      } File(s)`}
                </Button>
              </CardFooter>
            </Card>

            {bulkFileSlots.some((s) => s.result) && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Bulk Audit Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bulkFileSlots.map(
                    (slot, index) =>
                      slot.result && (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle className="text-md">
                              Result for: {slot.file?.name}
                            </CardTitle>
                            <CardDescription>
                              Overall Score:{" "}
                              {slot.result.overallScore.toFixed(2)}%
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                              {slot.result.summary}
                            </p>
                          </CardContent>
                        </Card>
                      )
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="saved-audits" className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Saved Audits</CardTitle>
                <CardDescription>
                  Review past audits. Click on a row to see details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Agent Name</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savedAudits
                      .sort(
                        (a, b) =>
                          new Date(b.auditDate).getTime() -
                          new Date(a.auditDate).getTime()
                      )
                      .map((audit) => (
                        <TableRow
                          key={audit.id}
                          onClick={() => openAuditDetailsModal(audit)}
                          className="cursor-pointer"
                        >
                          <TableCell>
                            {format(new Date(audit.auditDate), "PP")}
                          </TableCell>
                          <TableCell className="font-medium">
                            {audit.agentName}
                          </TableCell>
                          <TableCell>{audit.campaignName}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                audit.auditType === "ai"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {audit.auditType.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {audit.overallScore.toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                {savedAudits.length === 0 && (
                  <p className="text-center text-muted-foreground p-8">
                    No audits have been saved yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{modalTitle}</DialogTitle>
            </DialogHeader>
            {modalContent}
            <DialogFooter>
              <Button onClick={() => setIsModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Suspense>
  );
}
