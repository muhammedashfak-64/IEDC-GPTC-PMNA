import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuthHelper';
import { getRegistrations, registerStudentForEvent, updateRegistrationStatus, deleteRegistration } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('eventId') || undefined;
  const list = getRegistrations(eventId);

  return NextResponse.json({ success: true, count: list.length, data: list });
}

export async function POST(req: NextRequest) {
  const { errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const created = await registerStudentForEvent(body);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const { id, status } = await req.json();
    if (!id || !status) return NextResponse.json({ success: false, error: 'Registration ID and status required' }, { status: 400 });

    const updated = updateRegistrationStatus(id, status, user!);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Registration ID required' }, { status: 400 });

    const ok = deleteRegistration(id, user!);
    if (!ok) return NextResponse.json({ success: false, error: 'Registration not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Registration deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
