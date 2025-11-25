import jwt from "jsonwebtoken";
import connectDB from "./mongoose";
import User from "../models/User";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-secret-key";
const JWT_EXPIRES_IN = "7d"; // Token expires in 7 days

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
  projectId?: string;
  iat?: number;
  exp?: number;
}

// Generate JWT token
export function generateToken(user: {
  id: string;
  username: string;
  email: string;
  role: string;
  projectId?: string;
}): string {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    projectId: user.projectId,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

// Authenticate user and return JWT token
export async function authenticateUser(
  usernameOrEmail: string,
  password: string
) {
  try {
    await connectDB();

    // Search by username or email
    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    });
    if (!user) {
      return { success: false, message: "Invalid credentials" };
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return { success: false, message: "Invalid credentials" };
    }

    const userObj = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      projectId: user.projectId,
    };

    const token = generateToken(userObj);

    return {
      success: true,
      token,
      user: userObj,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return { success: false, message: "Authentication failed" };
  }
}

// Validate JWT token and return user data
export async function validateJWTToken(token: string) {
  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      return { valid: false, message: "Invalid token" };
    }

    await connectDB();

    // Verify user still exists in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return { valid: false, message: "User not found" };
    }

    return {
      valid: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        projectId: user.projectId,
      },
    };
  } catch (error) {
    console.error("JWT validation error:", error);
    return { valid: false, message: "Token validation failed" };
  }
}
