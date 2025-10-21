import { NextRequest, NextResponse } from 'next/server';
import { validateJWTToken } from '@/lib/jwtAuthService';
import { updateUser } from '@/lib/userService';

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

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const tokenResult = await validateJWTToken(token);
    if (!tokenResult.valid || !tokenResult.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, email } = body;

    // Basic validation
    if (!fullName || typeof fullName !== 'string') {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const updated = await updateUser({ id: tokenResult.user.id, fullName, email });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}