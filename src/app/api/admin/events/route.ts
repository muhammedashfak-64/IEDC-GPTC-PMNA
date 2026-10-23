import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuthHelper';
import { getEventsAsync, createEvent, updateEvent, deleteEvent } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  const events = await getEventsAsync(false);
  return NextResponse.json({ success: true, count: events.length, data: events });
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const created = await createEvent(body, user);
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
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, error: 'Event ID required' }, { status: 400 });

    const updated = await updateEvent(id, updates, user);
    if (!updated) return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });

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
    if (!id) return NextResponse.json({ success: false, error: 'Event ID required' }, { status: 400 });

    await deleteEvent(id, user);
    return NextResponse.json({ success: true, message: 'Event deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
