import mongoose, { Document, Schema } from "mongoose";

export type CampaignStatus =
  | "pending"
  | "running"
  | "completed"
  | "completed_with_errors"
  | "failed"
  | "canceled";

export interface ICampaign extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  timezone: string;
  status: CampaignStatus;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  canceledJobs: number;
  etaSeconds?: number;
  lastError?: string;
  createdBy: string;
  projectId?: string;
  qaParameterSetId?: string;
  sopId?: string;
  applyRateLimit?: boolean;
  startedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true, trim: true },
    timezone: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: [
        "pending",
        "running",
        "completed",
        "completed_with_errors",
        "failed",
        "canceled",
      ],
      default: "pending",
    },
    totalJobs: { type: Number, required: true },
    completedJobs: { type: Number, default: 0 },
    failedJobs: { type: Number, default: 0 },
    canceledJobs: { type: Number, default: 0 },
    etaSeconds: { type: Number },
    lastError: { type: String },
    createdBy: { type: String, required: true },
    projectId: { type: String },
    qaParameterSetId: { type: String },
    sopId: { type: String },
    applyRateLimit: { type: Boolean, default: true },
    startedAt: { type: Date },
    finishedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

CampaignSchema.index({ status: 1, createdAt: -1 });
CampaignSchema.index({ createdBy: 1, createdAt: -1 });
CampaignSchema.index({ projectId: 1, createdAt: -1 });

if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.Campaign;
}

const Campaign =
  mongoose.models.Campaign ||
  mongoose.model<ICampaign>("Campaign", CampaignSchema);

export default Campaign;
