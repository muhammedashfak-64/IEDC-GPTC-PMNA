import { NextRequest, NextResponse } from 'next/server';
import { getEventsAsync, createEvent } from '@/lib/serverStore';
import { requireAdminAuth } from '@/lib/adminAuthHelper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/events - Public list of published events from authoritative database
export async function GET() {
  try {
    const data = await getEventsAsync(true);
    return NextResponse.json({
      success: true,
      source: 'database',
      count: data.length,
      data
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/events - Create new event (Admin CMS API)
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
