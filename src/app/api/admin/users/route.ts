import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuthHelper';
import {
  getUsers,
  createUser,
  updateUser,
  resetUserPassword,
  toggleUserStatus,
  deleteUser
} from '@/lib/serverStore';

export async function GET(req: NextRequest) {
  // Main Administrator or Faculty Coordinator can view and manage operators
  const { errorResponse } = requireAdminAuth(req, true);
  if (errorResponse) return errorResponse;

  const users = getUsers();
  return NextResponse.json({ success: true, count: users.length, data: users });
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req, true);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const created = createUser(body, user!);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req, true);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { id, action, newPassword, updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 400 });
    }

    if (action === 'reset_password' || newPassword) {
      const result = resetUserPassword(id, newPassword, user!);
      return NextResponse.json({ ...result });
    }

    if (action === 'toggle_status') {
      const updated = toggleUserStatus(id, user!);
      return NextResponse.json({ success: true, data: updated });
    }

    if (updates) {
      const updated = updateUser(id, updates, user!);
      return NextResponse.json({ success: true, data: updated });
    }

    // Default toggle
    const updated = toggleUserStatus(id, user!);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req, true);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 400 });
    }

    deleteUser(id, user!);
    return NextResponse.json({ success: true, message: 'Operator account deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
