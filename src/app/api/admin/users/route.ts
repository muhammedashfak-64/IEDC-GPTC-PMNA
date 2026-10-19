import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuthHelper';
import { getUsers, createUser, toggleUserStatus } from '@/lib/serverStore';

export async function GET(req: NextRequest) {
  // Only Faculty Coordinators can manage administrative user accounts
  const { errorResponse } = requireAdminAuth(req, true);
  if (errorResponse) return errorResponse;

  const users = getUsers();
  return NextResponse.json({ success: true, count: users.length, data: users });
}

export async function POST(req: NextRequest) {
  // Only Faculty Coordinators can provision admin accounts
  const { user, errorResponse } = requireAdminAuth(req, true);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const created = createUser(body, user);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  // Only Faculty Coordinators can toggle user active status
  const { user, errorResponse } = requireAdminAuth(req, true);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await req.json();
    const updated = toggleUserStatus(id, user);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
