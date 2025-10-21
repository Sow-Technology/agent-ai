"use client";

import { useState, useEffect, useRef } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Brain, Save, Volume2 } from "lucide-react";
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
// Removed direct AI flow imports - using API routes instead
// Define types locally if needed
export interface QaAuditInput {
  [key: string]: any;
}

export interface QaAuditOutput {
  [key: string]: any;
}
import type {
  QAParameter,
  Parameter as ParameterGroup,
} from "@/types/qa-parameter";
import type { SOP } from "@/types/sop";
import type { SavedAuditItem } from "@/types/audit";
import {
  AudioUploadDropzone,
  type AudioUploadDropzoneRef,
} from "@/components/dashboard/AudioUploadDropzone";
import { AuditChatbot } from "@/components/dashboard/AuditChatbot";

import { getAuthHeaders } from "@/lib/authUtils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { QAParameterDocument } from "@/lib/qaParameterService";
import type { SOPDocument } from "@/lib/sopService";
import type { AuditDocument } from "@/lib/auditService";
import type { AuditResultDocument } from "@/lib/models";
// Removed direct service imports - using API routes instead

const MAX_AUDIO_FILE_SIZE_MB = 5;
const MAX_AUDIO_FILE_SIZE_BYTES = MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024;
// Removed localStorage constants - now using database operations

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

// Helper function to convert QAParameterDocument to QAParameter
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

// Helper function to convert SOPDocument to SOP
function convertSOPDocumentToSOP(doc: SOPDocument): SOP {
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

// Helper function to convert AuditDocument to SavedAuditItem
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
    agentUserId: doc.agentName, // Using agentName as fallback for agentUserId
    campaignName: doc.campaignName,
    overallScore: doc.overallScore,
    auditData: {
      agentUserId: doc.agentName,
      campaignName: doc.campaignName,
      identifiedAgentName: doc.agentName,
      transcriptionInOriginalLanguage: doc.transcript || "",
      englishTranslation: undefined,
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
    },
    auditType: doc.auditType,
  };
}

// Helper function to convert SavedAuditItem to createAudit format
function convertSavedAuditItemToCreateAuditFormat(
  savedAudit: SavedAuditItem,
  auditedBy: string
) {
  // Extract auditResults - they can be directly on savedAudit or nested in auditData
  const auditResults = (savedAudit as any).auditResults || 
                       (savedAudit.auditData?.auditResults) || 
                       [];
  
  // Extract transcript - can be directly on savedAudit or nested in auditData
  const transcript = (savedAudit as any).transcript || 
                     (savedAudit.auditData?.transcriptionInOriginalLanguage) || 
                     "";

  return {
    // Required fields for the API
    agentName: savedAudit.agentName,
    interactionId: (savedAudit as any).callId || savedAudit.id,

    // Optional fields
    auditName: `Audit for ${savedAudit.agentName}`,
    customerName: (savedAudit as any).customerName || "Unknown Customer",
    qaParameterSetId: savedAudit.campaignName || "default",
    qaParameterSetName: savedAudit.campaignName || "Unknown Parameter Set",
    callTranscript: transcript,
    overallScore: savedAudit.overallScore,
    auditType: savedAudit.auditType,
    auditorId: auditedBy,
    auditorName: "AI Auditor",
    auditDate: new Date(savedAudit.auditDate).toISOString(),

    // Map auditResults to parameters with subParameters structure
    parameters:
      auditResults && Array.isArray(auditResults)
        ? [
            {
              id: "audit-results",
              name: "Audit Results",
              subParameters: auditResults.map(
                (result: any) => ({
                  id: result.parameterId || result.id || "unknown",
                  name: result.parameterName || result.name || "Unknown",
                  weight: result.maxScore || result.weight || 100,
                  type: result.type || "Non-Fatal",
                  score: result.score || 0,
                  comments: result.comments || "",
                })
              ),
            },
          ]
        : [],
  };
}

export default function QaAuditContent() {
  const { toast } = useToast();
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
  const [savedAudits, setSavedAudits] = useState<SavedAuditItem[]>([]);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const [playbackAudioSrc, setPlaybackAudioSrc] = useState<string | null>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [parametersResponse, sopsResponse, auditsResponse] =
          await Promise.all([
            fetch("/api/qa-parameters", { headers: getAuthHeaders() }),
            fetch("/api/sops", { headers: getAuthHeaders() }),
            fetch("/api/audits", { headers: getAuthHeaders() }),
          ]);

        if (parametersResponse.ok) {
          const parametersData = await parametersResponse.json();
          if (parametersData.success && parametersData.data) {
            setAvailableQaParameterSets(
              parametersData.data.map(convertQAParameterDocumentToQAParameter)
            );
          }
        }

        if (sopsResponse.ok) {
          const sopsData = await sopsResponse.json();
          if (sopsData.success && sopsData.data) {
            setAvailableSops(sopsData.data.map(convertSOPDocumentToSOP));
          }
        }

        if (auditsResponse.ok) {
          const auditsData = await auditsResponse.json();
          if (auditsData.success && auditsData.data) {
            setSavedAudits(
              auditsData.data.map(convertAuditDocumentToSavedAuditItem)
            );
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load data from database.",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, [toast]);

  const handleAudioFileSelected = (file: File | null) => {
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
          "Please select an audio file (e.g., MP3, WAV) or an MP4 video file.",
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

    const reader = new FileReader();
    reader.onload = (e) => setOriginalAudioDataUri(e.target?.result as string);
    reader.readAsDataURL(file);

    const objectUrl = URL.createObjectURL(file);
    setPreviewAudioSrc(objectUrl);
    setAudioKey(objectUrl);
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

    try {
      const input: QaAuditInput = {
        agentUserId: qaAgentUserId,
        campaignName: qaCampaignName,
        audioDataUri: originalAudioDataUri || "",
        callLanguage: qaCallLanguage,
        transcriptionLanguage: qaTranscriptionLanguage,
        auditParameters: qaAuditParameters,
      };

      const response = await fetch("/api/qa-audit", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error("Failed to perform QA audit");
      }

      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error(responseData.error || "QA audit failed");
      }

      const result = responseData.data;
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
          error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsAuditing(false);
    }
  };

  const handlePlayTranslation = async (text: string) => {
    if (!text) return;
    setIsGeneratingSpeech(true);
    setPlaybackAudioSrc(null);
    try {
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error(responseData.error || "Text-to-speech failed");
      }

      const result = responseData.data;
      setPlaybackAudioSrc(result.audioDataUri);
    } catch (e) {
      console.error("TTS Error:", e);
      toast({
        title: "Text-to-Speech Failed",
        description:
          e instanceof Error ? e.message : "Could not generate audio.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSpeech(false);
    }
  };

  useEffect(() => {
    if (playbackAudioSrc && audioPlaybackRef.current) {
      audioPlaybackRef.current.play();
    }
  }, [playbackAudioSrc]);

  const handleSaveAudit = async (
    auditData: QaAuditOutput & { agentUserId?: string; campaignName?: string }
  ) => {
    const newSavedAudit: SavedAuditItem = {
      id: `audit_${Date.now()}`,
      auditDate: new Date().toISOString(),
      agentName: auditData.identifiedAgentName || "Unknown Agent",
      agentUserId: auditData.agentUserId || "N/A",
      campaignName: auditData.campaignName,
      overallScore: auditData.overallScore,
      auditData: auditData,
      auditType: "ai",
    };

    try {
      const userResponse = await fetch("/api/user/profile", {
        headers: getAuthHeaders(),
      });
      let auditedBy = "unknown";
      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.success && userData.data) {
          auditedBy = userData.data.id;
        }
      }

      const createAuditData = convertSavedAuditItemToCreateAuditFormat(
        newSavedAudit,
        auditedBy
      );

      console.log("Sending audit data to API:", JSON.stringify(createAuditData, null, 2));

      const response = await fetch("/api/audits", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(createAuditData),
      });

      const responseData = await response.json();
      
      if (!response.ok || !responseData.success) {
        const errorDetails = responseData.details 
          ? JSON.stringify(responseData.details, null, 2)
          : responseData.error || "Failed to save audit";
        console.error("API Error:", errorDetails);
        throw new Error(responseData.error || "Failed to save audit");
      }

      const savedAudit = responseData.data;
      const updatedAudits = [...savedAudits, newSavedAudit];
      setSavedAudits(updatedAudits);
      toast({
        title: "Audit Saved",
        description: `The AI audit for ${newSavedAudit.agentName} has been saved.`,
      });
      resetSingleAuditForm();
    } catch (error) {
      console.error("Error saving audit:", error);
      toast({
        title: "Error",
        description: "Failed to save audit. Please try again.",
        variant: "destructive",
      });
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
    toast({
      title: "Form Cleared",
      description: "The QAi Audit form has been reset.",
    });
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

  return (
    <div className="space-y-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>QAi Audit Form</CardTitle>
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
              <Select value={qaCallLanguage} onValueChange={setQaCallLanguage}>
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
                onChange={(e) => setQaTranscriptionLanguage(e.target.value)}
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
              <Select value={selectedSopId} onValueChange={setSelectedSopId}>
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
                        (r: any) => r.type === "Fatal" && r.score < 80
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
                  {auditResult.auditResults.map((item: any, index: number) => (
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
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handlePlayTranslation(
                              auditResult.englishTranslation!
                            )
                          }
                          disabled={isGeneratingSpeech}
                        >
                          {isGeneratingSpeech ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Volume2 className="mr-2 h-4 w-4" />
                          )}
                          Speak Translation
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
                {playbackAudioSrc && (
                  <audio
                    ref={audioPlaybackRef}
                    src={playbackAudioSrc}
                    className="w-full"
                    controls
                    autoPlay
                  />
                )}
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
            <Button onClick={() => handleSaveAudit(auditResult)}>
              <Save className="mr-2 h-4 w-4" /> Save Audit
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
