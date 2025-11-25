import mongoose, { Document, Schema } from "mongoose";

export interface ICallAudit extends Document {
  _id: mongoose.Types.ObjectId;
  callId: string;
  agentName: string;
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
  audioUrl?: string;
  auditedBy: string;
  auditType: "manual" | "ai";
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
CallAuditSchema.index({ callDate: 1 });

const CallAudit =
  mongoose.models.CallAudit ||
  mongoose.model<ICallAudit>("CallAudit", CallAuditSchema);

export default CallAudit;
