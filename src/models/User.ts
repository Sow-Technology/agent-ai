import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  _id: string;
  username: string;
  password: string;
  email?: string;
  fullName?: string;
  role:
    | "super_admin"
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

const UserSchema = new Schema<IUser>(
  {
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
      enum: [
        "super_admin",
        "Project Admin",
        "Manager",
        "QA Analyst",
        "Auditor",
        "Agent",
      ],
      default: "Agent",
    },
    projectId: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation during development
const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
