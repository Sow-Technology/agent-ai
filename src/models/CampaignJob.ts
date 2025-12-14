import mongoose, { Document, Schema } from "mongoose";

export type CampaignJobStatus =
  | "queued"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled";

export interface ICampaignJob extends Document {
  _id: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  rowIndex: number;
  payload: Record<string, any>;
  status: CampaignJobStatus;
  error?: string;
  callAuditId?: string;
  retries: number;
  durationMs?: number;
  startedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignJobSchema = new Schema<ICampaignJob>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
    rowIndex: { type: Number, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["queued", "processing", "succeeded", "failed", "canceled"],
      default: "queued",
    },
    error: { type: String },
    callAuditId: { type: String },
    retries: { type: Number, default: 0 },
    durationMs: { type: Number },
    startedAt: { type: Date },
    finishedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

CampaignJobSchema.index({ campaignId: 1, rowIndex: 1 }, { unique: true });
CampaignJobSchema.index({ status: 1, createdAt: 1 });

if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.CampaignJob;
}

const CampaignJob =
  mongoose.models.CampaignJob ||
  mongoose.model<ICampaignJob>("CampaignJob", CampaignJobSchema);

export default CampaignJob;
