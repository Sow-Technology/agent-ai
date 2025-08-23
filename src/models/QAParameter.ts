import mongoose, { Document, Schema } from 'mongoose';

// Sub-parameter schema
const SubParameterSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  weight: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  type: {
    type: String,
    enum: ['Fatal', 'Non-Fatal', 'ZTP'],
    required: true,
  },
});

// Parameter schema
const ParameterSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  subParameters: [SubParameterSchema],
});

export interface IQAParameter extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  parameters: Array<{
    id: string;
    name: string;
    subParameters: Array<{
      id: string;
      name: string;
      weight: number;
      type: 'Fatal' | 'Non-Fatal' | 'ZTP';
    }>;
  }>;
  isActive: boolean;
  linkedSopId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const QAParameterSchema = new Schema<IQAParameter>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  parameters: [ParameterSchema],
  isActive: {
    type: Boolean,
    default: true,
  },
  linkedSopId: {
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
const QAParameter = mongoose.models.QAParameter || mongoose.model<IQAParameter>('QAParameter', QAParameterSchema);

export default QAParameter;