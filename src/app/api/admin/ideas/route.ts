import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuthHelper';
import { getIdeasAsync, createIdea, updateIdea, deleteIdea } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  const list = await getIdeasAsync();
  return NextResponse.json({ success: true, count: list.length, data: list });
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const created = await createIdea(body, user);
    return NextResponse.json({ success: true, data: created });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const { id, status, mentor } = await req.json();
    const updated = await updateIdea(id, status, mentor, user);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

  await deleteIdea(id, user);
  return NextResponse.json({ success: true, message: 'Idea deleted' });
}
