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

export interface AuditResultItem {
  [key: string]: any;
}
import type {
  QAParameter,
  Parameter as ParameterGroup,
} from "@/types/qa-parameter";
import type { SavedAuditItem } from "@/types/audit";
import {
  AudioUploadDropzone,
  type AudioUploadDropzoneRef,
} from "@/components/dashboard/AudioUploadDropzone";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { AuditChatbot } from "@/components/dashboard/AuditChatbot";
import { convertAudioToWavDataUri, needsAudioConversion } from "@/lib/audioConverter";

import { getAuthHeaders } from "@/lib/authUtils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { QAParameterDocument } from "@/lib/qaParameterService";
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
  const auditResults =
    (savedAudit as any).auditResults ||
    savedAudit.auditData?.auditResults ||
    [];

  // Extract transcript - can be directly on savedAudit or nested in auditData
  const transcript =
    (savedAudit as any).transcript ||
    savedAudit.auditData?.transcriptionInOriginalLanguage ||
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
              subParameters: auditResults.map((result: any) => ({
                id: result.parameterId || result.id || "unknown",
                name: result.parameterName || result.name || "Unknown",
                weight: result.maxScore || result.weight || 100,
                type: result.type || "Non-Fatal",
                score: result.score || 0,
                comments: result.comments || "",
              })),
            },
          ]
        : [],
  };
}

export default function ManualAuditContent() {
  const { toast } = useToast();
  const [manualAgentUserId, setManualAgentUserId] = useState<string>("");
  const [manualCampaignName, setManualCampaignName] = useState<string>("");
  const [manualSelectedAudioFile, setManualSelectedAudioFile] =
    useState<File | null>(null);
  const [manualAudioDataUri, setManualAudioDataUri] = useState<string | null>(
    null
  );
  const [manualPreviewAudioSrc, setManualPreviewAudioSrc] = useState<
    string | null
  >(null);
  const [manualAudioKey, setManualAudioKey] = useState<string>(
    Date.now().toString()
  );
  const manualAudioInputRef = useRef<AudioUploadDropzoneRef>(null);
  const [manualSelectedQaParameterSetId, setManualSelectedQaParameterSetId] =
    useState<string>("default_params_set");
  const [manualAuditParameters, setManualAuditParameters] = useState<
    ParameterGroup[]
  >(DEFAULT_AUDIT_PARAMETERS);
  const [availableQaParameterSets, setAvailableQaParameterSets] = useState<
    QAParameter[]
  >([]);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState<string | null>(
    null
  );
  const [savedAudits, setSavedAudits] = useState<SavedAuditItem[]>([]);
  const [isProcessingAudio, setIsProcessingAudio] = useState<boolean>(false);
  const [audioAnalysisResult, setAudioAnalysisResult] =
    useState<QaAuditOutput | null>(null);
  const [callLanguage, setCallLanguage] = useState<string>(
    DEFAULT_CALL_LANGUAGE
  );
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const [playbackAudioSrc, setPlaybackAudioSrc] = useState<string | null>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement>(null);

  type ManualAuditResult = {
    [groupId: string]: {
      [subParamId: string]: { score: number; comments: string };
    };
  };
  const [manualAuditResults, setManualAuditResults] =
    useState<ManualAuditResult>({});
  const [manualOverallScore, setManualOverallScore] = useState<number>(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [parametersResponse, auditsResponse] = await Promise.all([
          fetch("/api/qa-parameters", { headers: getAuthHeaders() }),
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
          description: "Failed to load QA parameters and audits from database.",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, [toast]);

  const handleManualAudioFileSelected = (file: File | null) => {
    setManualSelectedAudioFile(null);
    setManualAudioDataUri(null);
    setManualPreviewAudioSrc(null);
    setAudioAnalysisResult(null);
    setManualAudioKey(Date.now().toString());
    if (!file) {
      // Don't call clearFile() to avoid infinite recursion
      return;
    }
    if (!file.type.startsWith("audio/") && file.type !== "video/mp4") {
      toast({ title: "Invalid file type", variant: "destructive" });
      // Don't call clearFile() to avoid infinite recursion
      return;
    }
    if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
      toast({ title: "File too large", variant: "destructive" });
      // Don't call clearFile() to avoid infinite recursion
      return;
    }
    setManualSelectedAudioFile(file);

    // Convert audio to WAV if needed
    if (needsAudioConversion(file)) {
      setManualAudioKey("converting");
      convertAudioToWavDataUri(file)
        .then((wavDataUri) => {
          setManualAudioDataUri(wavDataUri);
          setManualPreviewAudioSrc(URL.createObjectURL(new Blob([wavDataUri], { type: "audio/wav" })));
          setManualAudioKey("converted");
          toast({
            title: "Audio Converted",
            description: "Audio file has been converted to WAV format.",
          });
        })
        .catch((error) => {
          console.error("Audio conversion failed:", error);
          toast({
            title: "Conversion Failed",
            description: "Failed to convert audio to WAV. Please try another file.",
            variant: "destructive",
          });
          setManualSelectedAudioFile(null);
          setManualAudioKey("error");
        });
    } else {
      // Already WAV, just read as data URL
      const reader = new FileReader();
      reader.onload = (e) => setManualAudioDataUri(e.target?.result as string);
      reader.readAsDataURL(file);

      const objectUrl = URL.createObjectURL(file);
      setManualPreviewAudioSrc(objectUrl);
      setManualAudioKey(objectUrl);
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
        totalWeightedScore += (score * subParam.weight) / 100;
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
      const response = await fetch("/api/ai/grammar-check", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Failed to check grammar");
      }

      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error(responseData.error || "Grammar check failed");
      }

      const result = responseData.data;
      handleManualResultChange(
        groupId,
        subParamId,
        "comments",
        result.correctedText
      );
      toast({ title: "Grammar Checked" });
    } catch (e) {
      toast({ title: "Grammar Check Failed", variant: "destructive" });
    } finally {
      setIsCheckingGrammar(null);
    }
  };

  const handleAnalyzeAudio = async () => {
    if (!manualAudioDataUri) {
      toast({
        title: "No Audio",
        description: "Please upload an audio file to analyze.",
        variant: "destructive",
      });
      return;
    }
    setIsProcessingAudio(true);
    setAudioAnalysisResult(null);

    try {
      const dummyParamsForTranscription: QaAuditInput = {
        agentUserId: manualAgentUserId || "unknown",
        campaignName: manualCampaignName || "unknown",
        audioDataUri: manualAudioDataUri,
        callLanguage: callLanguage,
        auditParameters: [
          {
            id: "d1",
            name: "d_group",
            subParameters: [
              { id: "d_sub1", name: "d_sub", weight: 100, type: "Non-Fatal" },
            ],
          },
        ],
      };

      const response = await fetch("/api/ai/qa-audit", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(dummyParamsForTranscription),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze audio");
      }

      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error(responseData.error || "Audio analysis failed");
      }

      const result = responseData.data;
      setAudioAnalysisResult(result);
      toast({
        title: "Audio Analysis Complete",
        description: "Transcription and summary are now available.",
      });
    } catch (error) {
      console.error("Error during audio analysis:", error);
      toast({
        title: "Analysis Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const handlePlayTranslation = async (text: string) => {
    if (!text) return;
    setIsGeneratingSpeech(true);
    setPlaybackAudioSrc(null);
    try {
      const response = await fetch("/api/ai/text-to-speech", {
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

  const handleSaveManualAudit = async () => {
    if (!manualAgentUserId || !manualCampaignName) {
      toast({ title: "Missing Information", variant: "destructive" });
      return;
    }
    const auditResultsForOutput: AuditResultItem[] =
      manualAuditParameters.flatMap((group) =>
        group.subParameters.map((subParam) => {
          const result = manualAuditResults[group.id]?.[subParam.id] || {
            score: 0,
            comments: "",
          };
          return {
            parameter: `${group.name} - ${subParam.name}`,
            score: result.score,
            weightedScore: parseFloat(
              ((result.score * subParam.weight) / 100).toFixed(2)
            ),
            comments: result.comments,
            type: subParam.type,
          };
        })
      );

    const transcription =
      audioAnalysisResult?.transcriptionInOriginalLanguage ||
      "N/A - Manual Audit. No audio processed.";
    const summary =
      audioAnalysisResult?.callSummary ||
      `Manual audit for campaign: ${manualCampaignName}.`;

    const manualAuditForSaving: QaAuditOutput = {
      agentUserId: manualAgentUserId,
      campaignName: manualCampaignName,
      identifiedAgentName: `Agent ${manualAgentUserId}`,
      transcriptionInOriginalLanguage: transcription,
      englishTranslation: audioAnalysisResult?.englishTranslation,
      callSummary: summary,
      auditResults: auditResultsForOutput,
      overallScore: manualOverallScore,
      summary:
        "Manually scored audit. Review individual comments for feedback.",
    };

    const newSavedAudit: SavedAuditItem = {
      id: `audit_${Date.now()}`,
      auditDate: new Date().toISOString(),
      agentName: manualAuditForSaving.identifiedAgentName || manualAgentUserId,
      agentUserId: manualAgentUserId,
      campaignName: manualCampaignName,
      overallScore: manualOverallScore,
      auditData: manualAuditForSaving,
      auditType: "manual",
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

      console.log(
        "Sending manual audit data to API:",
        JSON.stringify(createAuditData, null, 2)
      );

      const response = await fetch("/api/audits", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(createAuditData),
      });

      if (response.status === 413) {
        toast({
          title: "File Too Large",
          description:
            "The uploaded audio file is too large for the server. Please upload a smaller file.",
          variant: "destructive",
        });
        return;
      }

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
      toast({ title: "Manual Audit Saved" });
    } catch (error) {
      console.error("Error saving audit:", error);
      toast({
        title: "Error",
        description: "Failed to save audit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleParameterSetChange = (id: string) => {
    const selectedSet = availableQaParameterSets.find((p) => p.id === id);
    setManualAuditParameters(
      selectedSet ? selectedSet.parameters : DEFAULT_AUDIT_PARAMETERS
    );
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Manual Audit Form</CardTitle>
        <CardDescription>
          Score an interaction manually. You can optionally upload and analyze
          an audio file for context.
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
          isConverting={isProcessingAudio}
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
            <div className="grid md:grid-cols-2 gap-4 mt-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="qa-call-language">Call Language</Label>
                <Select value={callLanguage} onValueChange={setCallLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                    <SelectItem value="Tamil">Tamil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAnalyzeAudio}
                disabled={isProcessingAudio || !manualAudioDataUri}
              >
                {isProcessingAudio ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Brain className="mr-2 h-4 w-4" />
                )}
                {isProcessingAudio ? "Analyzing..." : "Analyze Audio with QAi"}
              </Button>
            </div>
          </div>
        )}

        {audioAnalysisResult && (
          <Card>
            <CardHeader>
              <CardTitle>AI Audio Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Call Summary</Label>
                <p className="text-sm p-3 bg-muted rounded-md">
                  {audioAnalysisResult.callSummary}
                </p>
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
                          {audioAnalysisResult.callLanguage || callLanguage})
                        </Label>
                      </div>
                      <ScrollArea className="h-64 p-4 border rounded-md bg-muted/50">
                        <pre className="text-sm whitespace-pre-wrap">
                          {audioAnalysisResult.transcriptionInOriginalLanguage}
                        </pre>
                      </ScrollArea>
                    </div>
                    {audioAnalysisResult.englishTranslation && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>English Translation</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handlePlayTranslation(
                                audioAnalysisResult.englishTranslation!
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
                            {audioAnalysisResult.englishTranslation}
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
                    auditSummary={audioAnalysisResult.summary}
                    auditTranscription={
                      audioAnalysisResult.transcriptionInOriginalLanguage
                    }
                  />
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        )}

        <Separator />

        <div className="space-y-2">
          <Label>Select Parameter Set</Label>
          <Select
            value={manualSelectedQaParameterSetId}
            onValueChange={(id) => {
              setManualSelectedQaParameterSetId(id);
              handleParameterSetChange(id);
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
            <Label className="text-lg font-semibold">Scoring Sheet</Label>
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
                          placeholder="Enter comments..."
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
                              manualAuditResults[group.id]?.[subParam.id]
                                ?.comments || ""
                            )
                          }
                          disabled={
                            isCheckingGrammar === `${group.id}-${subParam.id}`
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
  );
}
