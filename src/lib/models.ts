// Type definitions for database documents used by service files

// User-related types
export interface UserDocument {
  _id?: any;
  id: string;
  username: string;
  email?: string;
  fullName?: string;
  role: 'Administrator' | 'Manager' | 'QA Analyst' | 'Agent';
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
  customerName?: string;
  callDate: Date;
  campaignId: string;
  campaignName: string;
  auditResults: AuditResultDocument[];
  overallScore: number;
  maxPossibleScore: number;
  transcript?: string;
  audioUrl?: string;
  auditedBy: string;
  auditType: 'manual' | 'ai';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditResultDocument {
  parameterId: string;
  parameterName: string;
  score: number;
  maxScore: number;
  type: 'Fatal' | 'Non-Fatal' | 'ZTP';
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
  status: 'Draft' | 'Published' | 'Archived';
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
  type: 'Fatal' | 'Non-Fatal' | 'ZTP';
}