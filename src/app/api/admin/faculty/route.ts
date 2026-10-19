import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuthHelper';
import { getFacultyCoordinators, createFacultyCoordinator, updateFacultyCoordinator, deleteFacultyCoordinator } from '@/lib/serverStore';

export async function GET(req: NextRequest) {
  const { errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  const list = getFacultyCoordinators(false);
  return NextResponse.json({ success: true, count: list.length, data: list });
}

export async function POST(req: NextRequest) {
  // Only Faculty Coordinators can modify faculty records
  const { user, errorResponse } = requireAdminAuth(req, true);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const created = createFacultyCoordinator(body, user);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  // Only Faculty Coordinators can modify faculty records
  const { user, errorResponse } = requireAdminAuth(req, true);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { id, ...updates } = body;
    const updated = updateFacultyCoordinator(id, updates, user);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  // Only Faculty Coordinators can modify faculty records
  const { user, errorResponse } = requireAdminAuth(req, true);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    deleteFacultyCoordinator(id!, user);
    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
