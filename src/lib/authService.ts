import bcrypt from 'bcryptjs';
import { authenticateUser as jwtAuthenticateUser, validateJWTToken, generateToken } from './jwtAuthService';
import { User } from '../types/auth';
import connectDB from './mongoose';
import UserModel from '../models/User';
import type { UserDocument } from './models';

// Re-export authentication functions
export { authenticateUser } from './jwtAuthService';

// User management functions
export async function getUserById(userId: string): Promise<User | null> {
  try {
    await connectDB();
    const user = await UserModel.findById(userId);
    if (!user) return null;
    
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

// Session management functions
export async function createSession(userId: string): Promise<string> {
  try {
    await connectDB();
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const userData = {
      id: user._id.toString(),
      username: user.username,
      email: user.email || '',
      fullName: user.fullName || '',
      role: user.role,
      isActive: user.isActive ?? true
    };
    
    return generateToken(userData);
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

export async function validateSession(token: string): Promise<User | null> {
  try {
    const result = await validateJWTToken(token);
    if (!result.valid || !result.user) return null;
    
    // Convert the partial user data to full User interface
    return {
      id: result.user.id,
      username: result.user.username,
      email: result.user.email,
      fullName: undefined, // Not available from JWT
      role: result.user.role as 'Administrator' | 'Project Admin' | 'Manager' | 'QA Analyst' | 'Auditor' | 'Agent',
      projectId: result.user.projectId,
      isActive: true, // Assume active if token is valid
      createdAt: undefined,
      updatedAt: undefined
    };
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
  }
}

export async function invalidateSession(token: string): Promise<boolean> {
  // For JWT tokens, we can't truly invalidate them without a blacklist
  // This is a placeholder implementation
  try {
    const result = await validateJWTToken(token);
    if (result.valid) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error invalidating session:', error);
    return false;
  }
}