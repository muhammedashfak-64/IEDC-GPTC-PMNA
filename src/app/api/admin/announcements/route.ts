import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/adminAuthHelper';
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} from '@/lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  const list = getAnnouncements();
  return NextResponse.json({ success: true, count: list.length, data: list });
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    if (!body.title?.trim()) {
      return NextResponse.json({ success: false, error: 'Announcement title is required.' }, { status: 400 });
    }
    if (!body.message?.trim()) {
      return NextResponse.json({ success: false, error: 'Announcement message body is required.' }, { status: 400 });
    }

    const created = createAnnouncement(body, user!);
    try {
      revalidatePath('/');
      revalidatePath('/api/public/homepage');
    } catch {}

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
    const id = body.id || body.announcementId;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Announcement ID is required for editing.' }, { status: 400 });
    }

    const updated = updateAnnouncement(id, body, user!);
    try {
      revalidatePath('/');
      revalidatePath('/api/public/homepage');
    } catch {}

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
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Announcement ID parameter is required.' }, { status: 400 });
    }

    const deleted = deleteAnnouncement(id, user!);
    try {
      revalidatePath('/');
      revalidatePath('/api/public/homepage');
    } catch {}

    return NextResponse.json({ success: deleted, message: 'Announcement deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
