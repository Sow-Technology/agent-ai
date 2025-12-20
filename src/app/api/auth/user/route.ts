import { NextRequest, NextResponse } from 'next/server';
import { validateJWTToken } from '@/lib/jwtAuthService';

export async function GET(request: NextRequest) {
  try {
    // Get JWT token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const tokenResult = await validateJWTToken(token);

    if (tokenResult.valid && tokenResult.user) {
      return NextResponse.json({ success: true, user: tokenResult.user });
    } else {
      return NextResponse.json(
        { error: 'User not found or not authenticated' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Get user details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}