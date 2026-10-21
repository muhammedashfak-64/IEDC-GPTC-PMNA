import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserFromRequest } from '@/lib/adminAuthHelper';
import { reallocateSeats } from '@/lib/serverStore';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAdminUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const sourceKey = String(body.sourceKey || body.sourceClass || '').trim();
    const destKey = String(body.destKey || body.destClass || '').trim();
    const seats = Number(body.seats);
    const reason = body.reason ? String(body.reason).trim() : undefined;

    if (!sourceKey || !destKey) {
      return NextResponse.json(
        { success: false, error: 'Source and destination classes are required.' },
        { status: 400 }
      );
    }

    if (!seats || seats <= 0) {
      return NextResponse.json(
        { success: false, error: 'Seats to transfer must be greater than zero.' },
        { status: 400 }
      );
    }

    const result = reallocateSeats(id, sourceKey, destKey, seats, auth, reason);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
