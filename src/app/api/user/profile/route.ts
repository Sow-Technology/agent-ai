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

    const result = await validateJWTToken(token);

    if (result.valid && result.user) {
      return NextResponse.json({
        success: true,
        data: result.user,
      });
    } else {
      return NextResponse.json(
        { error: result.message || 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}