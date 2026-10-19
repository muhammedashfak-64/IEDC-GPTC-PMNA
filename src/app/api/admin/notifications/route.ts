import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuthHelper';
import { getNotifications } from '@/lib/serverStore';

export async function GET(req: NextRequest) {
  const { errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  const list = getNotifications();
  return NextResponse.json({ success: true, count: list.length, data: list });
}
