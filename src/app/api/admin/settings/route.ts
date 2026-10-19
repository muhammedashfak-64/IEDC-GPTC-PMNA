import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuthHelper';
import { getSettings, updateSettings } from '@/lib/serverStore';

export async function GET(req: NextRequest) {
  const { errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  const settings = getSettings();
  return NextResponse.json({ success: true, data: settings });
}

export async function POST(req: NextRequest) {
  // Only Faculty Coordinators can alter system/website settings
  const { user, errorResponse } = requireAdminAuth(req, true);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const updated = updateSettings(body, user);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
