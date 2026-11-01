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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    const created = await createUser(body, user!);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { id, action, newPassword, updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 400 });
    }

    const isSelfUpdate = user!.id === id;
    const isElevated = user!.role === 'main_admin' || user!.role === 'faculty_coordinator';

    // Disallow non-elevated operators from modifying other admins' accounts
    if (!isSelfUpdate && !isElevated) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Managing other operator accounts requires Faculty Coordinator or Main Administrator privileges.' },
        { status: 403 }
      );
    }

    // Disallow non-main-admin from altering roles or deactivating accounts
    if (updates?.role && updates.role !== user!.role && user!.role !== 'main_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Only the Main Administrator can modify account roles.' },
        { status: 403 }
      );
    }

    if (action === 'reset_password' || newPassword) {
      if (!isSelfUpdate && !isElevated) {
        return NextResponse.json(
          { success: false, error: 'Forbidden. Resetting other passwords requires administrator privileges.' },
          { status: 403 }
        );
      }
      const result = await resetUserPassword(id, newPassword, user!);
      return NextResponse.json({ ...result });
    }

    if (action === 'toggle_status') {
      if (!isElevated) {
        return NextResponse.json(
          { success: false, error: 'Forbidden. Changing account status requires administrator privileges.' },
          { status: 403 }
        );
      }
      const updated = toggleUserStatus(id, user!);
      return NextResponse.json({ success: true, data: updated });
    }

    if (updates) {
      const updated = await updateUser(id, updates, user!);
      return NextResponse.json({ success: true, data: updated });
    }

    // Default toggle
    if (!isElevated) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Changing account status requires administrator privileges.' },
        { status: 403 }
      );
    }
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
