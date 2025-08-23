import { NextRequest, NextResponse } from 'next/server';
import { addUser, getManagedUsers, updateUser, deleteUser } from '@/lib/serverUserService';

export async function GET() {
  try {
    const users = await getManagedUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching managed users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch managed users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await addUser(body);
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error adding user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add user' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await updateUser(body);
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    await deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}