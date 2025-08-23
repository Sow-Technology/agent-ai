
'use client'

import Link from "next/link";
import { useState, useEffect, useMemo, type ChangeEvent, type FormEvent, useRef, type ReactNode } from "react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Bar, ResponsiveContainer } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";


import {
    CalendarDays, Filter, FileDown, Loader2,
    VenetianMask, PlayCircle, PauseCircle,
    Target, ClipboardList,
    Smile,
    ShieldCheck,
    Brain,
    BarChart2, Bot,
    Download,
    TrendingUp,
    UserCheck,
    TrendingDown,
    Briefcase,
    Activity,
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Removed direct AI flow import - using API route instead
import { useSearchParams, useRouter } from 'next/navigation';
import type { QAParameter, Parameter as ParameterGroup } from '@/types/qa-parameter';
import type { SOP } from '@/types/sop';
import type { SavedAuditItem } from '@/types/audit';
import { Separator } from '@/components/ui/separator';
import { OverviewCard } from '@/components/dashboard/OverviewCard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { User } from '@/types/auth';
import type { QAParameterDocument } from '@/lib/qaParameterService';
// Removed direct auditService import - using API route instead
import type { AuditDocument } from '@/lib/auditService';
import type { AuditResultDocument } from '@/lib/models';

import { Suspense } from 'react';

// Helper function to convert AuditDocument to SavedAuditItem
function convertQAParameterDocumentToQAParameter(doc: QAParameterDocument): QAParameter {
  return {
    ...doc,
    lastModified: doc.updatedAt.toISOString()
  };
}

function convertAuditDocumentToSavedAuditItem(doc: AuditDocument): SavedAuditItem {
  return {
    id: doc.id,
    auditDate: doc.createdAt.toISOString(),
    agentName: doc.agentName,
    agentUserId: doc.agentName, // Using agentName as fallback for agentUserId
    campaignName: doc.campaignName,
    overallScore: doc.overallScore,
    auditData: {
      agentUserId: doc.agentName,
      campaignName: doc.campaignName,
      identifiedAgentName: doc.agentName,
      transcriptionInOriginalLanguage: doc.transcript || '',
      englishTranslation: undefined,
      callSummary: `Audit for ${doc.agentName}`,
      auditResults: doc.auditResults.map((result: AuditResultDocument) => ({
        parameter: result.parameterName,
        score: result.score,
        weightedScore: result.maxScore,
        comments: result.comments || '',
        type: result.type
      })),
      overallScore: doc.overallScore,
      summary: `Overall score: ${doc.overallScore}/${doc.maxPossibleScore}`
    },
    auditType: doc.auditType
  };
}


export default function DashboardPage() {
  return (
     <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <DashboardPageContent />
    </Suspense>
  )
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

  const activeTab = searchParams.get('tab') || 'overview';
  
  const [availableQaParameterSets, setAvailableQaParameterSets] = useState<QAParameter[]>([]);
  const [availableCampaignsForFilter, setAvailableCampaignsForFilter] = useState([
    { id: 'all', name: 'All Campaigns' },
  ]);
  const [selectedCampaignIdForFilter, setSelectedCampaignIdForFilter] = useState('all');

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
        const userResponse = await fetch('/api/auth/user');
        const userData = await userResponse.json();
        if (userResponse.ok && userData.success) {
          setCurrentUser(userData.user);
        }
      } catch (e) {
        console.error('Failed to load user details', e);
      }

      if (!dateRange?.from) {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setDateRange({ from: firstDayOfMonth, to: lastDayOfMonth });
      }

      try {
        // Load QA Parameters from database
        const qaResponse = await fetch('/api/qa-parameters');
        const qaData = await qaResponse.json();
        if (qaResponse.ok && qaData.success) {
          const activeCampaigns = qaData.data.filter((p: QAParameterDocument) => p.isActive);
          setAvailableQaParameterSets(activeCampaigns.map(convertQAParameterDocumentToQAParameter));
          const campaignOptions = activeCampaigns.map((p: QAParameterDocument) => ({ id: p.id, name: p.name }));
          setAvailableCampaignsForFilter([{ id: 'all', name: 'All Campaigns' }, ...campaignOptions]);
        }
      } catch (e) {
        console.error("Failed to load QA Parameter Sets from database", e);
      }

      try {
        // Load SOPs from database
        const sopResponse = await fetch('/api/sops');
        const sopData = await sopResponse.json();
        if (sopResponse.ok && sopData.success) {
          // setAvailableSops(sopData.data);
        }
      } catch (e) {
        console.error("Failed to load SOPs from database", e);
      }

      try {
        // Load saved audits from API
        const response = await fetch('/api/audits');
        if (response.ok) {
          const auditData = await response.json();
          if (auditData.success && auditData.data) {
            // Convert database audits to SavedAuditItem format
            const savedAuditsData: SavedAuditItem[] = auditData.data.map(convertAuditDocumentToSavedAuditItem);
            setSavedAudits(savedAuditsData);
          }
        }
      } catch (e) {
        console.error("Failed to load saved audits from API", e);
      }
    };

    loadData();
  }, [isClient, dateRange?.from]);

  const openAuditDetailsModal = (audit: SavedAuditItem) => {
    setModalTitle(`Audit Details - ${audit.agentName} (${format(new Date(audit.auditDate), 'PPp')})`);
    
    const handleDispute = () => {
      toast({ title: 'Dispute Logged', description: 'Your dispute for this audit has been logged for review.' });
      setIsModalOpen(false);
    };

    const handleAcknowledge = () => {
      toast({ title: 'Audit Acknowledged', description: 'Thank you for acknowledging this audit.' });
      setIsModalOpen(false);
    };

    setModalContent(
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{`Audit Details - ${audit.agentName} (${format(new Date(audit.auditDate), 'PPp')})`}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-4">
          <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                  <p><strong>Agent:</strong> {audit.agentName}</p>
                  <p><strong>Agent ID:</strong> {audit.agentUserId}</p>
                  <p><strong>Campaign:</strong> {audit.campaignName || 'N/A'}</p>
                  <p><strong>Overall Score:</strong> <span className="font-bold text-lg">{audit.overallScore.toFixed(2)}%</span></p>
                  <p><strong>Audit Type:</strong> <Badge variant={audit.auditType === 'ai' ? 'default' : 'secondary'}>{audit.auditType.toUpperCase()}</Badge></p>
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
                          <TableCell className="font-medium">{res.parameter}</TableCell>
                          <TableCell className="text-center">{res.score}</TableCell>
                          <TableCell>{res.comments}</TableCell>
                      </TableRow>
                      ))}
                  </TableBody>
              </Table>
              {audit.auditType === 'ai' && (
                  <>
                  <Separator />
                  <h4 className="font-semibold text-md">Call Summary & Transcription</h4>
                  <p className="text-sm p-3 bg-muted rounded-md">{audit.auditData.callSummary}</p>
                  <Collapsible>
                      <CollapsibleTrigger asChild>
                          <Button variant="outline" size="sm">Show/Hide Full Transcription</Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                          <ScrollArea className="h-48 mt-2 p-3 border rounded-md">
                              <pre className="text-xs whitespace-pre-wrap">{audit.auditData.transcriptionInOriginalLanguage}</pre>
                          </ScrollArea>
                      </CollapsibleContent>
                  </Collapsible>
                  </>
              )}
          </div>
        </div>
        <DialogFooter>
          {currentUser?.role === 'Agent' ? (
            <div className="w-full flex justify-between">
              <Button variant="destructive" onClick={handleDispute}>Dispute</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
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
          <h2 className="text-3xl font-bold tracking-tight">Hi, {currentUser?.fullName || 'User'}! Welcome Back 👋</h2>
          <p className="text-muted-foreground">Here’s a snapshot of your QA performance and activities.</p>
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
      
      {currentUser?.role === 'Agent' ? (
         <DashboardTabContent 
            key="agent-overview"
            auditType="all" 
            savedAudits={savedAudits}
            dateRange={dateRange}
            selectedCampaignIdForFilter={selectedCampaignIdForFilter}
            availableQaParameterSets={availableQaParameterSets}
            currentUser={currentUser}
            openAuditDetailsModal={openAuditDetailsModal}
        />
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
                />
            </TabsContent>
        </Tabs>
      )}

      {isModalOpen && !modalContent && (
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              {/* This is a fallback, the content is now set directly */}
          </Dialog>
      )}
      {isModalOpen && modalContent}
    </div>
  );
}

// Sub-component for dashboard content
interface DashboardTabContentProps {
  auditType: 'all' | 'ai' | 'manual';
  savedAudits: SavedAuditItem[];
  dateRange: DateRange | undefined;
  selectedCampaignIdForFilter: string;
  availableQaParameterSets: QAParameter[];
  currentUser: User | null;
  openAuditDetailsModal: (audit: SavedAuditItem) => void;
}

const DashboardTabContent: React.FC<DashboardTabContentProps> = ({ auditType, savedAudits, dateRange, selectedCampaignIdForFilter, availableQaParameterSets, currentUser, openAuditDetailsModal }) => {
    type AgentPerformanceData = {
        topAgents: { id: string; name: string; score: number; audits: number; pass: number, fail: number }[];
        underperformingAgents: { id: string; name: string; score: number; audits: number; pass: number, fail: number }[];
    };
    type CampaignPerformanceData = {
        name: string;
        score: number;
        compliance: number;
        audits: number;
    }[];

    const [overallQAScore, setOverallQAScore] = useState(0);
    const [topIssuesData, setTopIssuesData] = useState([{ id: 'issue_default_1', reason: "Awaiting audit data...", count: 0, critical: false }]);
    const [agentPerformanceData, setAgentPerformanceData] = useState<AgentPerformanceData>({ topAgents: [], underperformingAgents: []});
    const [campaignPerformanceData, setCampaignPerformanceData] = useState<CampaignPerformanceData>([]);
    const [complianceData, setComplianceData] = useState({ interactionsWithIssues: 0, totalAuditedInteractionsForCompliance: 0, complianceRate: 0 });
    const [trainingNeedsData, setTrainingNeedsData] = useState<{agentName: string, lowestParam: string} | null>(null);
    const [sentimentData, setSentimentData] = useState({ positive: 0, neutral: 0, negative: 0 });

    const filteredAudits = useMemo(() => {
        let filtered = savedAudits;

        if (currentUser?.role === 'Agent') {
          filtered = filtered.filter(audit => audit.agentUserId === currentUser.username);
        }

        if (auditType !== 'all') {
            filtered = filtered.filter(audit => audit.auditType === auditType);
        }
        if (dateRange?.from) {
            filtered = filtered.filter(audit => {
                const auditDate = new Date(audit.auditDate);
                let inRange = auditDate >= dateRange.from!;
                if (dateRange.to) {
                    inRange = inRange && auditDate <= dateRange.to!;
                }
                return inRange;
            });
        }
        if (selectedCampaignIdForFilter && selectedCampaignIdForFilter !== 'all') {
            const selectedCampaign = availableQaParameterSets.find(c => c.id === selectedCampaignIdForFilter);
            if (selectedCampaign) {
                filtered = filtered.filter(audit => audit.campaignName === selectedCampaign.name);
            }
        }
        return filtered;
    }, [savedAudits, auditType, dateRange, selectedCampaignIdForFilter, availableQaParameterSets, currentUser]);

    useEffect(() => {
        if (filteredAudits.length > 0) {
            const totalScore = filteredAudits.reduce((sum, audit) => sum + audit.overallScore, 0);
            setOverallQAScore(parseFloat((totalScore / filteredAudits.length).toFixed(1)));
            
            // Agent & Campaign Performance
            const agentScores: Record<string, { totalScore: number; auditCount: number; name: string, passCount: number }> = {};
            const campaignScores: Record<string, { totalScore: number; auditCount: number, complianceIssues: number }> = {};

            filteredAudits.forEach(audit => {
                const campaignName = audit.campaignName || "Uncategorized";
                // Agent Data Aggregation
                if (!agentScores[audit.agentUserId]) {
                  agentScores[audit.agentUserId] = { totalScore: 0, auditCount: 0, name: audit.agentName, passCount: 0 };
                }
                agentScores[audit.agentUserId].totalScore += audit.overallScore;
                agentScores[audit.agentUserId].auditCount++;
                if(audit.overallScore >= 80) agentScores[audit.agentUserId].passCount++;
                
                // Campaign Data Aggregation
                if(!campaignScores[campaignName]){
                    campaignScores[campaignName] = { totalScore: 0, auditCount: 0, complianceIssues: 0 };
                }
                campaignScores[campaignName].totalScore += audit.overallScore;
                campaignScores[campaignName].auditCount++;
                if(audit.auditData.auditResults.some((r: any) => r.type === 'Fatal' && r.score < 80)) {
                    campaignScores[campaignName].complianceIssues++;
                }
            });
            const avgAgentScores = Object.entries(agentScores).map(([id, data]) => ({
                id, name: data.name, score: parseFloat((data.totalScore / data.auditCount).toFixed(1)),
                audits: data.auditCount, pass: data.passCount, fail: data.auditCount - data.passCount
            })).sort((a,b) => b.score - a.score);

            if(avgAgentScores.length > 0) {
                setAgentPerformanceData({
                    topAgents: avgAgentScores.slice(0,5),
                    underperformingAgents: avgAgentScores.filter(a => a.score < 80).slice(-5).reverse()
                });
            }

            const finalCampaignData = Object.entries(campaignScores).map(([name, data]) => ({
                name,
                audits: data.auditCount,
                score: parseFloat((data.totalScore / data.auditCount).toFixed(1)),
                compliance: parseFloat((((data.auditCount - data.complianceIssues) / data.auditCount) * 100).toFixed(1)),
            })).sort((a, b) => b.audits - a.audits);
            setCampaignPerformanceData(finalCampaignData);


            // Top Issues
            const issuesMap = new Map<string, { count: number; criticalCount: number }>();
            const agentParamScores = new Map<string, { totalScore: number; count: number, agentName: string }>();

            filteredAudits.forEach(audit => {
                audit.auditData.auditResults.forEach((res: any) => {
                    // Top Issues Calculation
                    if (res.score < 80) {
                        const existing = issuesMap.get(res.parameter) || { count: 0, criticalCount: 0 };
                        existing.count++;
                        if (res.score < 50) existing.criticalCount++;
                        issuesMap.set(res.parameter, existing);
                    }
                    
                    // Training Needs Calculation
                    const agentParamKey = `${audit.agentUserId}__${res.parameter}`;
                    const existingAgentParam = agentParamScores.get(agentParamKey) || { totalScore: 0, count: 0, agentName: audit.agentName };
                    existingAgentParam.totalScore += res.score;
                    existingAgentParam.count++;
                    agentParamScores.set(agentParamKey, existingAgentParam);
                });
            });
            const sortedIssues = Array.from(issuesMap.entries())
                .sort(([,a],[,b]) => b.count - a.count)
                .slice(0,5)
                .map(([reason, data]) => ({ id: reason, reason, count: data.count, critical: data.criticalCount > 0 }));
            if (sortedIssues.length > 0) setTopIssuesData(sortedIssues);
            else setTopIssuesData([{ id: 'no_issues', reason: "No significant QA failures identified.", count: 0, critical: false }]);
            
            // Finalize Training Needs
            let lowestAvg = 101;
            let tniResult: {agentName: string, lowestParam: string} | null = null;
            agentParamScores.forEach((data, key) => {
                const avg = data.totalScore / data.count;
                if(avg < lowestAvg) {
                    lowestAvg = avg;
                    const [agentId, paramName] = key.split('__');
                    tniResult = { agentName: data.agentName, lowestParam: paramName };
                }
            });
            setTrainingNeedsData(tniResult);

            // Compliance
            const fatalAudits = filteredAudits.filter(a => a.auditData.auditResults.some((r: any) => r.type === 'Fatal' && r.score < 80)).length;
            const nonCompliantAudits = filteredAudits.filter(a => a.overallScore < 70).length;
            const issuesCount = Math.max(fatalAudits, nonCompliantAudits);
            
            setComplianceData({
                interactionsWithIssues: issuesCount,
                totalAuditedInteractionsForCompliance: filteredAudits.length,
                complianceRate: parseFloat((( (filteredAudits.length - issuesCount) / filteredAudits.length) * 100).toFixed(1)) || 0
            });

            // Sentiment
            setSentimentData({
                positive: filteredAudits.length > 0 ? parseFloat((filteredAudits.filter(a=>a.overallScore >= 85).length / filteredAudits.length * 100).toFixed(1)) : 0,
                neutral: filteredAudits.length > 0 ? parseFloat((filteredAudits.filter(a=>a.overallScore >=70 && a.overallScore < 85).length / filteredAudits.length * 100).toFixed(1)) : 0,
                negative: filteredAudits.length > 0 ? parseFloat((filteredAudits.filter(a=>a.overallScore < 70).length / filteredAudits.length * 100).toFixed(1)) : 0,
            });

        } else {
            setOverallQAScore(0);
            setTopIssuesData([{ id: 'issue_default_1', reason: "Awaiting audit data...", count: 0, critical: false }]);
            setAgentPerformanceData({ topAgents: [], underperformingAgents: [] });
            setCampaignPerformanceData([]);
            setComplianceData({ interactionsWithIssues: 0, totalAuditedInteractionsForCompliance: 0, complianceRate: 0 });
            setSentimentData({ positive: 0, neutral: 0, negative: 0 });
            setTrainingNeedsData(null);
        }
    }, [filteredAudits]);

    const chartConfigTopIssues = { count: { label: "Count", color: "hsl(var(--chart-2))" } } as const;
    
    const isAgentView = currentUser?.role === 'Agent';

    return (
        <div className="space-y-4">
             {!isAgentView && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    <OverviewCard title="Overall QA Score" icon={Target}>
                        <div className="text-2xl font-bold">{overallQAScore}%</div>
                        <p className="text-xs text-muted-foreground">
                            {Math.abs(overallQAScore - 85) < 2 ? 'On par with target' : overallQAScore > 85 ? `+${(overallQAScore - 85).toFixed(1)}% vs target` : `${(overallQAScore - 85).toFixed(1)}% vs target`}
                        </p>
                    </OverviewCard>
                    <OverviewCard title="Total Audits" icon={ClipboardList}>
                        <div className="text-2xl font-bold">{filteredAudits.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Across {Object.keys(filteredAudits.reduce((acc, curr) => ({...acc, [curr.agentUserId]: true}), {})).length} agents
                        </p>
                    </OverviewCard>
                    <OverviewCard title="Compliance Rate" icon={ShieldCheck}>
                        <div className="text-2xl font-bold">{complianceData.complianceRate}%</div>
                        <p className="text-xs text-muted-foreground">
                            {complianceData.interactionsWithIssues} interactions with issues
                        </p>
                    </OverviewCard>
                    <OverviewCard title="Sentiment Mix" icon={Smile}>
                        <div className="text-2xl font-bold">{sentimentData.positive}% Positive</div>
                        <p className="text-xs text-muted-foreground">
                            {sentimentData.negative}% Negative calls detected
                        </p>
                    </OverviewCard>
                    <OverviewCard title="Training Needs" icon={UserCheck}>
                        <div className="text-xl font-bold truncate">{trainingNeedsData?.agentName || 'N/A'}</div>
                        <p className="text-xs text-muted-foreground truncate">
                            Focus Area: {trainingNeedsData?.lowestParam || 'None Identified'}
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
                        <p className="text-xs text-muted-foreground">Total audits completed for you</p>
                    </OverviewCard>
                     <OverviewCard title="My Compliance" icon={ShieldCheck}>
                        <div className="text-2xl font-bold">{complianceData.complianceRate}%</div>
                         <p className="text-xs text-muted-foreground">Your compliance rate</p>
                    </OverviewCard>
                      <OverviewCard title="My Pass/Fail" icon={Activity}>
                        <div className="text-2xl font-bold">{agentPerformanceData.topAgents[0]?.pass || 0} / {agentPerformanceData.topAgents[0]?.fail || 0}</div>
                        <p className="text-xs text-muted-foreground">Pass vs Fail count</p>
                    </OverviewCard>
                 </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>My Audits</CardTitle>
                    <CardDescription>A list of all audits performed. Click a row to see details.</CardDescription>
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAudits.map(audit => (
                                <TableRow key={audit.id} onClick={() => openAuditDetailsModal(audit)} className="cursor-pointer">
                                    <TableCell>{format(new Date(audit.auditDate), 'PP')}</TableCell>
                                    <TableCell>{audit.campaignName}</TableCell>
                                    {!isAgentView && <TableCell>{audit.agentName}</TableCell>}
                                    <TableCell className="font-bold">{audit.overallScore.toFixed(2)}%</TableCell>
                                    <TableCell><Badge variant={audit.auditType === 'ai' ? 'default' : 'secondary'}>{audit.auditType.toUpperCase()}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>


            {!isAgentView && (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-full lg:col-span-4 shadow-lg">
                            <CardHeader>
                                <CardTitle>Top QA Issues</CardTitle>
                                <CardDescription>Common parameters where agents need improvement.</CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <ChartContainer config={chartConfigTopIssues} className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart layout="vertical" data={topIssuesData} margin={{ left: 120, top: 20, right: 20, bottom: 20 }}>
                                            <CartesianGrid horizontal={false} />
                                            <XAxis type="number" dataKey="count" />
                                            <YAxis dataKey="reason" type="category" tick={{fontSize: 12, width: 200, textAnchor: 'start'}} interval={0} />
                                            <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                                            <Bar dataKey="count" layout="vertical" radius={4} fill="var(--color-count)" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                        <Card className="col-span-full lg:col-span-3 shadow-lg">
                            <CardHeader>
                                <CardTitle>Campaign Performance</CardTitle>
                                <CardDescription>Performance & compliance scores by campaign.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[350px] w-full">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Campaign</TableHead><TableHead className="text-right">QA Score</TableHead><TableHead className="text-right">Compliance</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {campaignPerformanceData.map(c => (
                                            <TableRow key={c.name}><TableCell className="font-medium">{c.name}</TableCell><TableCell className="text-right">{c.score}%</TableCell><TableCell className="text-right">{c.compliance}%</TableCell></TableRow>
                                        ))}
                                        {campaignPerformanceData.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No campaign data available.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><TrendingUp className="text-green-500 h-5 w-5"/>Top Performers</CardTitle>
                                <CardDescription>Agents with the highest average QA scores.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Agent</TableHead><TableHead className="text-right">Avg. Score</TableHead><TableHead className="text-right">Audits</TableHead><TableHead className="text-right">Pass/Fail</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {agentPerformanceData.topAgents.map(agent => (
                                            <TableRow key={agent.id}>
                                                <TableCell>{agent.name}</TableCell>
                                                <TableCell className="text-right font-bold text-green-600">{agent.score}%</TableCell>
                                                <TableCell className="text-right">{agent.audits}</TableCell>
                                                <TableCell className="text-right">{agent.pass}/{agent.fail}</TableCell>
                                            </TableRow>
                                        ))}
                                        {agentPerformanceData.topAgents.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No top performers found.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-destructive"><TrendingDown className="h-5 w-5"/>Needs Improvement</CardTitle>
                                <CardDescription>Agents with opportunities for growth.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Agent</TableHead><TableHead className="text-right">Avg. Score</TableHead><TableHead className="text-right">Audits</TableHead><TableHead className="text-right">Pass/Fail</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {agentPerformanceData.underperformingAgents.map(agent => (
                                            <TableRow key={agent.id}>
                                                <TableCell>{agent.name}</TableCell>
                                                <TableCell className="text-right font-bold text-red-600">{agent.score}%</TableCell>
                                                <TableCell className="text-right">{agent.audits}</TableCell>
                                                <TableCell className="text-right">{agent.pass}/{agent.fail}</TableCell>
                                            </TableRow>
                                        ))}
                                        {agentPerformanceData.underperformingAgents.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No agents currently need improvement.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
