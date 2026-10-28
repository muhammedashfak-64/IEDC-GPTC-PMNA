import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserFromRequest } from '@/lib/adminAuthHelper';
import { scanPassAttendance } from '@/lib/serverStore';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = getAdminUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ success: false, error: 'Event ID parameter required' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const qrData = String(body.qrData || body.code || body.passToken || '').trim();

    if (!qrData) {
      return NextResponse.json(
        { success: false, code: 'EMPTY_PASS', error: 'No pass code or QR token received.' },
        { status: 400 }
      );
    }

    const result = await scanPassAttendance(id, qrData, auth);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    const statusCode = err.code === 'WRONG_EVENT' ? 400 : err.code === 'INVALID_PASS' ? 404 : 400;
    return NextResponse.json(
      {
        success: false,
        code: err.code || 'SCAN_ERROR',
        error: err.message || 'Failed to process QR pass attendance.'
      },
      { status: statusCode }
    );
  }
}
