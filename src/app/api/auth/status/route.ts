import { NextRequest, NextResponse } from 'next/server';
import { validateJWTToken } from '@/lib/jwtAuthService';

export async function GET(request: NextRequest) {
  try {
    // Get JWT token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, isAuthenticated: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    const result = await validateJWTToken(token);

    if (result.valid) {
      return NextResponse.json({
        success: true,
        isAuthenticated: true,
        user: result.user,
      });
    } else {
      return NextResponse.json(
        { success: false, isAuthenticated: false, message: result.message },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth status error:', error);
    return NextResponse.json(
      { success: false, isAuthenticated: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}