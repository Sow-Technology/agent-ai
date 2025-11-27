"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Tooltip,
  Legend,
} from "recharts";
import {
  Loader2,
  Coins,
  TrendingUp,
  Calculator,
  BarChart3,
  Clock,
  Zap,
  DollarSign,
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { getAuthHeaders } from "@/lib/authUtils";
import type { AuditDocument } from "@/lib/models";

interface TokenUsageData {
  date: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  auditCount: number;
}

interface AuditWithTokens {
  id: string;
  agentName: string;
  campaignName: string;
  auditDate: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  durationMs: number;
  overallScore: number;
}

export default function TokenAnalyticsPage() {
  const [audits, setAudits] = useState<AuditDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputTokenCost, setInputTokenCost] = useState<string>("0.00025");
  const [outputTokenCost, setOutputTokenCost] = useState<string>("0.00125");
  const [dateRange, setDateRange] = useState<string>("30");

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        const response = await fetch("/api/audits", {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Only include AI audits with token usage
            const aiAudits = data.data.filter(
              (audit: AuditDocument) =>
                audit.auditType === "ai" && audit.tokenUsage
            );
            setAudits(aiAudits);
          }
        }
      } catch (error) {
        console.error("Failed to fetch audits:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAudits();
  }, []);

  // Filter audits by date range
  const filteredAudits = useMemo(() => {
    const days = parseInt(dateRange);
    const cutoffDate = subDays(new Date(), days);
    return audits.filter((audit) => new Date(audit.createdAt) >= cutoffDate);
  }, [audits, dateRange]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    if (filteredAudits.length === 0) {
      return {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokens: 0,
        avgInputTokens: 0,
        avgOutputTokens: 0,
        avgTotalTokens: 0,
        avgDuration: 0,
        totalAudits: 0,
        totalCost: 0,
      };
    }

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalDuration = 0;
    let auditsWithDuration = 0;

    filteredAudits.forEach((audit) => {
      totalInputTokens += audit.tokenUsage?.inputTokens || 0;
      totalOutputTokens += audit.tokenUsage?.outputTokens || 0;
      if (audit.auditDurationMs) {
        totalDuration += audit.auditDurationMs;
        auditsWithDuration++;
      }
    });

    const totalTokens = totalInputTokens + totalOutputTokens;
    const inputCost = parseFloat(inputTokenCost) || 0;
    const outputCost = parseFloat(outputTokenCost) || 0;
    const totalCost =
      (totalInputTokens / 1000) * inputCost +
      (totalOutputTokens / 1000) * outputCost;

    return {
      totalInputTokens,
      totalOutputTokens,
      totalTokens,
      avgInputTokens: Math.round(totalInputTokens / filteredAudits.length),
      avgOutputTokens: Math.round(totalOutputTokens / filteredAudits.length),
      avgTotalTokens: Math.round(totalTokens / filteredAudits.length),
      avgDuration:
        auditsWithDuration > 0
          ? Math.round(totalDuration / auditsWithDuration)
          : 0,
      totalAudits: filteredAudits.length,
      totalCost,
    };
  }, [filteredAudits, inputTokenCost, outputTokenCost]);

  // Prepare chart data - usage over time
  const usageOverTimeData = useMemo(() => {
    const days = parseInt(dateRange);
    const dataMap = new Map<string, TokenUsageData>();

    // Initialize all days
    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      dataMap.set(date, {
        date,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        auditCount: 0,
      });
    }

    // Aggregate data
    filteredAudits.forEach((audit) => {
      const date = format(new Date(audit.createdAt), "yyyy-MM-dd");
      const existing = dataMap.get(date);
      if (existing) {
        existing.inputTokens += audit.tokenUsage?.inputTokens || 0;
        existing.outputTokens += audit.tokenUsage?.outputTokens || 0;
        existing.totalTokens +=
          (audit.tokenUsage?.inputTokens || 0) +
          (audit.tokenUsage?.outputTokens || 0);
        existing.auditCount += 1;
      }
    });

    return Array.from(dataMap.values()).map((item) => ({
      ...item,
      date: format(new Date(item.date), "MMM dd"),
    }));
  }, [filteredAudits, dateRange]);

  // Prepare individual audit data for table
  const auditTableData: AuditWithTokens[] = useMemo(() => {
    return filteredAudits
      .map((audit) => ({
        id: audit.id,
        agentName: audit.agentName,
        campaignName: audit.campaignName,
        auditDate: format(new Date(audit.createdAt), "PPp"),
        inputTokens: audit.tokenUsage?.inputTokens || 0,
        outputTokens: audit.tokenUsage?.outputTokens || 0,
        totalTokens:
          (audit.tokenUsage?.inputTokens || 0) +
          (audit.tokenUsage?.outputTokens || 0),
        durationMs: audit.auditDurationMs || 0,
        overallScore: audit.overallScore,
      }))
      .sort(
        (a, b) =>
          new Date(b.auditDate).getTime() - new Date(a.auditDate).getTime()
      );
  }, [filteredAudits]);

  // Calculate cost for specific tokens
  const calculateCost = (inputTokens: number, outputTokens: number) => {
    const inputCost = parseFloat(inputTokenCost) || 0;
    const outputCost = parseFloat(outputTokenCost) || 0;
    return (
      (inputTokens / 1000) * inputCost + (outputTokens / 1000) * outputCost
    );
  };

  const chartConfig = {
    inputTokens: {
      label: "Input Tokens",
      color: "hsl(var(--chart-1))",
    },
    outputTokens: {
      label: "Output Tokens",
      color: "hsl(var(--chart-2))",
    },
    totalTokens: {
      label: "Total Tokens",
      color: "hsl(var(--chart-3))",
    },
    auditCount: {
      label: "Audits",
      color: "hsl(var(--chart-4))",
    },
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Token Analytics</h1>
          <p className="text-muted-foreground">
            Monitor AI token usage, costs, and performance metrics
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalTokens.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              In: {stats.totalInputTokens.toLocaleString()} | Out:{" "}
              {stats.totalOutputTokens.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Tokens/Audit
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgTotalTokens.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              In: {stats.avgInputTokens.toLocaleString()} | Out:{" "}
              {stats.avgOutputTokens.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.avgDuration / 1000).toFixed(1)}s
            </div>
            <p className="text-xs text-muted-foreground">Per AI audit call</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total AI Audits
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAudits}</div>
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Cost Calculator
          </CardTitle>
          <CardDescription>
            Enter your token pricing to calculate estimated costs (per 1,000
            tokens)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="input-cost">Input Token Cost ($)</Label>
              <Input
                id="input-cost"
                type="number"
                step="0.00001"
                value={inputTokenCost}
                onChange={(e) => setInputTokenCost(e.target.value)}
                placeholder="0.00025"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="output-cost">Output Token Cost ($)</Label>
              <Input
                id="output-cost"
                type="number"
                step="0.00001"
                value={outputTokenCost}
                onChange={(e) => setOutputTokenCost(e.target.value)}
                placeholder="0.00125"
              />
            </div>
            <div className="space-y-2">
              <Label>Estimated Total Cost</Label>
              <div className="flex items-center gap-2 h-10 px-3 py-2 rounded-md border bg-muted">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">
                  {stats.totalCost.toFixed(4)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cost Per Audit</Label>
              <div className="flex items-center gap-2 h-10 px-3 py-2 rounded-md border bg-muted">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">
                  {stats.totalAudits > 0
                    ? (stats.totalCost / stats.totalAudits).toFixed(4)
                    : "0.0000"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Token Usage Over Time */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Token Usage Over Time
            </CardTitle>
            <CardDescription>Daily token consumption breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageOverTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar
                    dataKey="inputTokens"
                    name="Input Tokens"
                    fill="var(--color-inputTokens)"
                    stackId="a"
                  />
                  <Bar
                    dataKey="outputTokens"
                    name="Output Tokens"
                    fill="var(--color-outputTokens)"
                    stackId="a"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Audits Per Day */}
        <Card>
          <CardHeader>
            <CardTitle>Audits Per Day</CardTitle>
            <CardDescription>Number of AI audits performed</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usageOverTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="auditCount"
                    name="Audits"
                    stroke="var(--color-auditCount)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-auditCount)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Average Tokens Per Audit Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Avg Tokens Per Audit</CardTitle>
            <CardDescription>
              Daily average token usage per audit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={usageOverTimeData.map((d) => ({
                    ...d,
                    avgTokens:
                      d.auditCount > 0
                        ? Math.round(d.totalTokens / d.auditCount)
                        : 0,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="avgTokens"
                    name="Avg Tokens"
                    stroke="var(--color-totalTokens)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-totalTokens)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Token Usage by Audit Table */}
      <Card>
        <CardHeader>
          <CardTitle>Token Usage by Audit</CardTitle>
          <CardDescription>
            Detailed breakdown of token usage for each AI audit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="text-right">Input Tokens</TableHead>
                  <TableHead className="text-right">Output Tokens</TableHead>
                  <TableHead className="text-right">Total Tokens</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditTableData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-muted-foreground"
                    >
                      No AI audits with token data found in the selected period
                    </TableCell>
                  </TableRow>
                ) : (
                  auditTableData.map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell className="font-medium">
                        {audit.auditDate}
                      </TableCell>
                      <TableCell>{audit.agentName}</TableCell>
                      <TableCell>{audit.campaignName}</TableCell>
                      <TableCell className="text-right">
                        {audit.inputTokens.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {audit.outputTokens.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {audit.totalTokens.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {audit.durationMs > 0
                          ? `${(audit.durationMs / 1000).toFixed(1)}s`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        $
                        {calculateCost(
                          audit.inputTokens,
                          audit.outputTokens
                        ).toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            audit.overallScore >= 90
                              ? "default"
                              : audit.overallScore >= 70
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {audit.overallScore.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
