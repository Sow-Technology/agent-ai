"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, XCircle, Filter, RefreshCw } from "lucide-react";
import { getAuthHeaders } from "@/lib/authUtils";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// Local type for audit result
interface AuditResultItem {
  parameter: string;
  score: number;
  maxScore: number;
  weightedScore: number;
  comments: string;
  type?: string;
}

// Local type for audit detail item
interface AuditDetailItem {
  id: string;
  auditDate: string;
  agentUserId: string;
  agentName: string;
  campaignName: string;
  overallScore: number;
  auditType: "ai" | "manual";
  auditedBy: string;
  callSummary: string;
  audioUrl?: string;
  auditResults: AuditResultItem[];
}

// Convert API response to AuditDetailItem format
interface AuditDocument {
  _id: string;
  callId: string;
  agentName: string;
  agentUserId?: string;
  customerName?: string;
  callDate: string;
  campaignId: string;
  campaignName: string;
  auditResults: { parameterName: string; score: number; maxScore: number; comments?: string; type?: string }[];
  overallScore: number;
  maxPossibleScore: number;
  transcript?: string;
  englishTranslation?: string;
  callSummary?: string;
  audioUrl?: string;
  auditedBy: string;
  auditType: "manual" | "ai";
  createdAt: string;
  updatedAt: string;
}

function convertToAuditDetailItem(doc: AuditDocument): AuditDetailItem {
  return {
    id: doc._id,
    auditDate: new Date(doc.callDate).toISOString(),
    agentUserId: doc.agentUserId || doc.agentName,
    agentName: doc.agentName,
    campaignName: doc.campaignName,
    overallScore: doc.overallScore,
    auditType: doc.auditType,
    auditedBy: doc.auditedBy,
    callSummary: doc.callSummary || `Audit for ${doc.agentName}`,
    audioUrl: doc.audioUrl,
    auditResults: doc.auditResults.map((result) => ({
      parameter: result.parameterName,
      score: result.score,
      maxScore: result.maxScore,
      weightedScore: (result.score / result.maxScore) * 100,
      comments: result.comments || "",
      type: result.type,
    })),
  };
}

const ITEMS_PER_PAGE = 25;

export default function AuditDetailsPage() {
  const [audits, setAudits] = useState<AuditDetailItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PASS" | "FAIL">("ALL");
  const [filterAuditType, setFilterAuditType] = useState<"ALL" | "ai" | "manual">("ALL");
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch audits with pagination
  useEffect(() => {
    const fetchAudits = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/audits?limit=${ITEMS_PER_PAGE}&page=${currentPage}`, {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const result = await response.json();
          const auditsArray = result.data || result.audits || [];
          if (Array.isArray(auditsArray)) {
            const convertedAudits = auditsArray.map((doc: AuditDocument) =>
              convertToAuditDetailItem(doc)
            );
            setAudits(convertedAudits);
            setTotalCount(result.total || result.totalCount || auditsArray.length);
          }
        }
      } catch (error) {
        console.error("Failed to fetch audits:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAudits();
  }, [currentPage]);

  // Filter audits (client-side for current page)
  const filteredAudits = useMemo(() => {
    return audits.filter((audit) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        audit.agentName?.toLowerCase().includes(searchLower) ||
        audit.campaignName?.toLowerCase().includes(searchLower) ||
        audit.agentUserId?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus =
        filterStatus === "ALL" ||
        (filterStatus === "PASS" && audit.overallScore >= 85) ||
        (filterStatus === "FAIL" && audit.overallScore < 85);

      // Audit type filter
      const matchesType =
        filterAuditType === "ALL" || audit.auditType === filterAuditType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [audits, searchTerm, filterStatus, filterAuditType]);

  // Pagination helpers
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const canGoNext = currentPage < totalPages;
  const canGoPrev = currentPage > 1;

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 85) return "text-amber-500";
    return "text-red-500";
  };

  // Get score badge
  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">PASS</Badge>;
    if (score >= 85) return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">PASS</Badge>;
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">FAIL</Badge>;
  };

  // Get parameter icon
  const getParamIcon = (score: number, maxScore: number, type?: string) => {
    const percentage = (score / maxScore) * 100;
    if (type === "Fatal" && percentage < 100) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (percentage >= 80) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <motion.div
      className="space-y-6 p-6"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-display flex items-center gap-2">
                <Filter className="h-6 w-6 text-primary" />
                Audit Details
              </CardTitle>
              <CardDescription className="mt-1">
                View detailed parameter-wise audit results for all calls
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agent, campaign..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 bg-background/50"
                />
              </div>
              
              {/* Status Filter */}
              <Select value={filterStatus} onValueChange={(val: any) => setFilterStatus(val)}>
                <SelectTrigger className="w-[110px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PASS">Pass</SelectItem>
                  <SelectItem value="FAIL">Fail</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Audit Type Filter */}
              <Select value={filterAuditType} onValueChange={(val: any) => setFilterAuditType(val)}>
                <SelectTrigger className="w-[110px] h-9">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="ai">AI Audit</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredAudits.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <p>No audits found matching your filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredAudits.map((audit) => (
                <Collapsible
                  key={audit.id}
                  open={expandedAuditId === audit.id}
                  onOpenChange={(open) => setExpandedAuditId(open ? audit.id : null)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="w-full px-6 py-4 hover:bg-muted/30 cursor-pointer transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {expandedAuditId === audit.id ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium">{audit.agentName}</p>
                            <p className="text-sm text-muted-foreground">
                              {audit.campaignName} • {format(new Date(audit.auditDate), "MMM dd, yyyy HH:mm")}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="capitalize">
                            {audit.auditType}
                          </Badge>
                          <span className={`font-bold text-lg ${getScoreColor(audit.overallScore)}`}>
                            {audit.overallScore.toFixed(1)}%
                          </span>
                          {getScoreBadge(audit.overallScore)}
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-6 pb-6 pt-2 bg-muted/20 border-t border-border/30">
                      {/* Call Summary */}
                      {audit.callSummary && (
                        <div className="mb-4 p-3 bg-background/50 rounded-lg">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Call Summary</p>
                          <p className="text-sm">{audit.callSummary}</p>
                        </div>
                      )}
                      
                      {/* Parameter Results Table */}
                      <div className="rounded-lg border border-border/50 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="w-10"></TableHead>
                              <TableHead>Parameter</TableHead>
                              <TableHead className="text-center w-24">Score</TableHead>
                              <TableHead className="text-center w-24">Type</TableHead>
                              <TableHead>Comments</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {audit.auditResults.map((result: AuditResultItem, idx: number) => (
                              <TableRow key={idx} className="hover:bg-muted/20">
                                <TableCell className="text-center">
                                  {getParamIcon(result.score, result.maxScore, result.type)}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {result.parameter}
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className={getScoreColor((result.score / result.maxScore) * 100)}>
                                    {result.score}/{result.maxScore}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant="outline"
                                    className={
                                      result.type === "Fatal"
                                        ? "border-red-500/50 text-red-400"
                                        : result.type === "ZTP"
                                        ? "border-amber-500/50 text-amber-400"
                                        : "border-muted-foreground/50"
                                    }
                                  >
                                    {result.type || "Non-Fatal"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                                  {result.comments || "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {/* Audited By */}
                      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                        <span>Audited by: {audit.auditedBy}</span>
                        {audit.audioUrl && (
                          <a
                            href={audit.audioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Listen to Audio
                          </a>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
          
          {/* Pagination Controls */}
          {!isLoading && totalCount > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} audits
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={!canGoPrev}
                >
                  Previous
                </Button>
                <span className="text-sm px-2">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={!canGoNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
