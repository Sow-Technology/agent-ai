import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/jwtAuthService';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username/Email and password are required' },
        { status: 400 }
      );
    }

    const result = await authenticateUser(username, password);

    if (result.success) {
      return NextResponse.json({
        success: true,
        token: result.token,
        user: result.user,
      });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}