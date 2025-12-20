import mongoose, { Document, Schema } from "mongoose";

export interface ICallAudit extends Document {
  _id: mongoose.Types.ObjectId;
  callId: string;
  agentName: string;
  agentUserId?: string; // User-entered agent ID from form
  customerName?: string;
  callDate: Date;
  campaignId: string;
  campaignName: string;
  projectId?: string; // Project ID for project-based access control
  auditResults: {
    parameterId: string;
    parameterName: string;
    score: number;
    maxScore: number;
    type: "Fatal" | "Non-Fatal" | "ZTP";
    comments?: string;
  }[];
  overallScore: number;
  maxPossibleScore: number;
  transcript?: string;
  englishTranslation?: string; // English translation of the transcript
  callSummary?: string; // AI-generated call summary
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

const CallAuditSchema = new Schema<ICallAudit>(
  {
    callId: {
      type: String,
      required: true,
      unique: true,
    },
    agentName: {
      type: String,
      required: true,
      trim: true,
    },
    agentUserId: {
      type: String,
      trim: true,
    },
    customerName: {
      type: String,
      trim: true,
    },
    callDate: {
      type: Date,
      required: true,
    },
    campaignId: {
      type: String,
      required: true,
    },
    campaignName: {
      type: String,
      required: true,
      trim: true,
    },
    projectId: {
      type: String,
      trim: true,
    },
    auditResults: [
      {
        parameterId: {
          type: String,
          required: true,
        },
        parameterName: {
          type: String,
          required: true,
        },
        score: {
          type: Number,
          required: true,
        },
        maxScore: {
          type: Number,
          required: true,
        },
        type: {
          type: String,
          enum: ["Fatal", "Non-Fatal", "ZTP"],
          required: true,
        },
        comments: {
          type: String,
          trim: true,
        },
      },
    ],
    overallScore: {
      type: Number,
      required: true,
    },
    maxPossibleScore: {
      type: Number,
      required: true,
    },
    transcript: {
      type: String,
    },
    callSummary: {
      type: String,
    },
    audioUrl: {
      type: String,
    },
    auditedBy: {
      type: String,
      required: true,
    },
    auditType: {
      type: String,
      enum: ["manual", "ai"],
      required: true,
    },
    englishTranslation: {
      type: String,
    },
    tokenUsage: {
      inputTokens: { type: Number },
      outputTokens: { type: Number },
      totalTokens: { type: Number },
    },
    auditDurationMs: {
      type: Number,
    },
    audioHash: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
CallAuditSchema.index({ agentName: 1, createdAt: -1 });
CallAuditSchema.index({ campaignId: 1, createdAt: -1 });
CallAuditSchema.index({ auditType: 1, createdAt: -1 });
CallAuditSchema.index({ projectId: 1, createdAt: -1 });
CallAuditSchema.index({ auditedBy: 1, createdAt: -1 }); // For role-based filtering
CallAuditSchema.index({ callDate: 1 });
CallAuditSchema.index({ createdAt: -1 }); // For default sorting
CallAuditSchema.index({ audioHash: 1, campaignName: 1 }); // For cache lookups
// Compound index for common dashboard queries
CallAuditSchema.index({ auditedBy: 1, auditType: 1, createdAt: -1 });
CallAuditSchema.index({ projectId: 1, auditType: 1, createdAt: -1 });

// Delete cached model in development to pick up schema changes
if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.CallAudit;
}

const CallAudit =
  mongoose.models.CallAudit ||
  mongoose.model<ICallAudit>("CallAudit", CallAuditSchema);

export default CallAudit;
