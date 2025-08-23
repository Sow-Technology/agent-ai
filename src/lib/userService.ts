import { getManagedUsers, addUser, updateUser as updateManagedUser, deleteUser as deleteManagedUser } from './serverUserService';
import connectDB from './mongoose';
import User from '../models/User';
import bcrypt from 'bcryptjs';

// User service functions that match the expected API interface

export async function getAllUsers() {
  return await getManagedUsers();
}

export async function createUser(userData: {
  username: string;
  password: string;
  email?: string;
  fullName?: string;
  role?: 'Administrator' | 'Manager' | 'QA Analyst' | 'Agent';
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
    });

    await user.save();

    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function updateUser(userData: {
  id: string;
  username?: string;
  password?: string;
  email?: string;
  fullName?: string;
  role?: 'Administrator' | 'Manager' | 'QA Analyst' | 'Agent';
  isActive?: boolean;
}) {
  try {
    await connectDB();
    
    const updateData: any = {};
    
    if (userData.username) updateData.username = userData.username;
    if (userData.email) updateData.email = userData.email;
    if (userData.fullName) updateData.fullName = userData.fullName;
    if (userData.role) updateData.role = userData.role;
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
  return await deleteManagedUser(userId);
}