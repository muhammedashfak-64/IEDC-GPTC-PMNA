import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuthHelper';
import { getRegistrations, updateRegistrationStatus } from '@/lib/serverStore';

export async function GET(req: NextRequest) {
  const { errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('eventId') || undefined;
  const list = getRegistrations(eventId);

  return NextResponse.json({ success: true, count: list.length, data: list });
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const { id, status } = await req.json();
    if (!id || !status) return NextResponse.json({ success: false, error: 'Registration ID and status required' }, { status: 400 });

    const updated = updateRegistrationStatus(id, status, user);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
