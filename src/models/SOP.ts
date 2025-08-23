import mongoose, { Document, Schema } from 'mongoose';

export interface ISOP extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  category: string;
  version: string;
  status: 'Draft' | 'Published' | 'Archived';
  linkedParameterSetId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const SOPSchema = new Schema<ISOP>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  version: {
    type: String,
    required: true,
    default: '1.0',
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Archived'],
    default: 'Draft',
  },
  linkedParameterSetId: {
    type: String,
  },
  createdBy: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

// Prevent re-compilation during development
const SOP = mongoose.models.SOP || mongoose.model<ISOP>('SOP', SOPSchema);

export default SOP;