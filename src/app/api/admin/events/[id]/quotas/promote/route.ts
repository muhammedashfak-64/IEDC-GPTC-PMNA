import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserFromRequest } from '@/lib/adminAuthHelper';
import { promoteWaitlistedStudent } from '@/lib/serverStore';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAdminUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const registrationId = String(body.registrationId || '').trim();

    if (!registrationId) {
      return NextResponse.json(
        { success: false, error: 'Registration ID is required for promotion.' },
        { status: 400 }
      );
    }

    const result = promoteWaitlistedStudent(registrationId, auth);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
