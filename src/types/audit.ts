
import type { QaAuditOutput } from '@/ai/flows/qa-audit-flow';

export interface SavedAuditItem {
  id: string;
  auditDate: string; // ISO string date
  agentName: string;
  agentUserId: string;
  campaignName?: string;
  overallScore: number;
  auditData: QaAuditOutput;
  auditType: 'ai' | 'manual';
}
