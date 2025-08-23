import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  username: string;
  password: string;
  email?: string;
  fullName?: string;
  role: 'Administrator' | 'Manager' | 'QA Analyst' | 'Agent';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  fullName: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['Administrator', 'Manager', 'QA Analyst', 'Agent'],
    default: 'Agent',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Prevent re-compilation during development
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;