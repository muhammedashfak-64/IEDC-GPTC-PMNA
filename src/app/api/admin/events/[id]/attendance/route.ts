import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserFromRequest } from '@/lib/adminAuthHelper';
import { getRegistrations, markAttendance, markBulkAttendance } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAdminUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
  }

  const { id } = await params;
  const registrations = getRegistrations(id);
  const total = registrations.length;
  const present = registrations.filter((r: any) => r.attendance === 'Present' || r.status === 'Attended').length;
  const absent = total - present;

  return NextResponse.json({
    success: true,
    data: registrations,
    metrics: {
      total,
      present,
      absent,
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0
    }
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAdminUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  try {
    if (body.bulk) {
      const updated = markBulkAttendance(
        id,
        body.registrationIds || [],
        body.attendance === 'Present' ? 'Present' : 'Absent',
        auth
      );
      return NextResponse.json({ success: true, count: updated.length, data: updated });
    } else {
      if (!body.registrationId) {
        return NextResponse.json({ success: false, error: 'registrationId is required.' }, { status: 400 });
      }
      const updated = markAttendance(
        body.registrationId,
        body.attendance === 'Present' ? 'Present' : 'Absent',
        auth
      );
      return NextResponse.json({ success: true, data: updated });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
