// Type definitions for database documents used by service files

// User-related types
export interface UserDocument {
  _id?: any;
  id: string;
  username: string;
  email?: string;
  fullName?: string;
  role:
    | "Administrator"
    | "Project Admin"
    | "Manager"
    | "QA Analyst"
    | "Auditor"
    | "Agent";
  projectId?: string; // Project ID for project-based access control
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Audit-related types
export interface AuditDocument {
  _id?: any;
  id: string;
  callId: string;
  agentName: string;
  agentUserId?: string; // User-entered agent ID from form
  customerName?: string;
  callDate: Date;
  campaignId: string;
  campaignName: string;
  projectId?: string; // Project ID for project-based access control
  auditResults: AuditResultDocument[];
  overallScore: number;
  maxPossibleScore: number;
  transcript?: string;
  englishTranslation?: string; // English translation of the transcript
  audioUrl?: string;
  auditedBy: string;
  auditType: "manual" | "ai";
  // AI audit metadata
  tokenUsage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  auditDurationMs?: number; // Duration of the audit in milliseconds
  audioHash?: string; // Hash of the audio content for caching
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditResultDocument {
  parameterId: string;
  parameterName: string;
  score: number;
  maxScore: number;
  type: "Fatal" | "Non-Fatal" | "ZTP";
  comments?: string;
}

// SOP-related types
export interface SOPDocument {
  _id?: any;
  id: string;
  title: string;
  content: string;
  category: string;
  version: string;
  status: "Draft" | "Published" | "Archived";
  linkedParameterSetId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// QA Parameter-related types
export interface QAParameterDocument {
  _id?: any;
  id: string;
  name: string;
  description: string;
  parameters: ParameterDocument[];
  isActive: boolean;
  linkedSopId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ParameterDocument {
  id: string;
  name: string;
  subParameters: SubParameterDocument[];
}

export interface SubParameterDocument {
  id: string;
  name: string;
  weight: number;
  type: "Fatal" | "Non-Fatal" | "ZTP";
}
