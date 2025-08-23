import mongoose, { Document, Schema } from 'mongoose';

export interface IAudit extends Document {
  _id: string;
  action: string;
  entityType: 'user' | 'sop' | 'qa_parameter';
  entityId: string;
  userId: string;
  username: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

const AuditSchema = new Schema<IAudit>({
  action: {
    type: String,
    required: true,
    trim: true,
  },
  entityType: {
    type: String,
    enum: ['user', 'sop', 'qa_parameter'],
    required: true,
  },
  entityId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  details: {
    type: Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  ipAddress: {
    type: String,
    trim: true,
  },
  userAgent: {
    type: String,
    trim: true,
  },
}, {
  timestamps: false, // We use our own timestamp field
});

// Index for efficient querying
AuditSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
AuditSchema.index({ userId: 1, timestamp: -1 });

// Prevent re-compilation during development
const Audit = mongoose.models.Audit || mongoose.model<IAudit>('Audit', AuditSchema);

export default Audit;