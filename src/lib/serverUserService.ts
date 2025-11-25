import connectDB from './mongoose';
import User from '../models/User';
import bcrypt from 'bcryptjs';

// Server-side user management functions - only for API routes

export async function getManagedUsers() {
  try {
    await connectDB();
    
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    
    return users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      projectId: user.projectId,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  } catch (error) {
    console.error('Error fetching managed users:', error);
    throw new Error('Failed to fetch managed users');
  }
}

export async function addUser(userData: {
  username: string;
  password: string;
  email?: string;
  fullName?: string;
  role?: 'Administrator' | 'Project Admin' | 'Manager' | 'QA Analyst' | 'Auditor' | 'Agent';
  projectId?: string;
}) {
  try {
    await connectDB();
    
    // Check if user already exists
    const existingUser = await User.findOne({ username: userData.username });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const user = new User({
      username: userData.username,
      password: hashedPassword,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role || 'Agent',
      projectId: userData.projectId,
    });

    await user.save();

    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      projectId: user.projectId,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
}

export async function updateUser(userData: {
  id: string;
  username?: string;
  password?: string;
  email?: string;
  fullName?: string;
  role?: 'Administrator' | 'Project Admin' | 'Manager' | 'QA Analyst' | 'Auditor' | 'Agent';
  projectId?: string;
  isActive?: boolean;
}) {
  try {
    await connectDB();
    
    const updateData: any = {};
    
    if (userData.username) updateData.username = userData.username;
    if (userData.email) updateData.email = userData.email;
    if (userData.fullName) updateData.fullName = userData.fullName;
    if (userData.role) updateData.role = userData.role;
    if (userData.projectId !== undefined) updateData.projectId = userData.projectId;
    if (userData.isActive !== undefined) updateData.isActive = userData.isActive;
    
    // Hash password if provided
    if (userData.password) {
      updateData.password = await bcrypt.hash(userData.password, 12);
    }

    const user = await User.findByIdAndUpdate(
      userData.id,
      updateData,
      { new: true, select: '-password' }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      projectId: user.projectId,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export async function deleteUser(userId: string) {
  try {
    await connectDB();
    
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}