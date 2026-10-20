import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserFromRequest } from '@/lib/adminAuthHelper';
import { getProgramLeaders, addProgramLeader, deleteProgramLeader } from '@/lib/serverStore';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAdminUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
  }

  const { id } = await params;
  const leaders = getProgramLeaders(id);
  return NextResponse.json({ success: true, data: leaders });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAdminUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  if (!body.name?.trim()) {
    return NextResponse.json({ success: false, error: 'Leader name is required.' }, { status: 400 });
  }

  try {
    const leader = addProgramLeader(
      {
        eventId: id,
        name: body.name,
        role: body.role || 'Student Lead',
        department: body.department,
        email: body.email,
        phone: body.phone,
        certificateEligible: body.certificateEligible !== false
      },
      auth
    );
    return NextResponse.json({ success: true, data: leader });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAdminUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const leaderId = searchParams.get('id');
  if (!leaderId) {
    return NextResponse.json({ success: false, error: 'Leader ID is required.' }, { status: 400 });
  }

  const deleted = deleteProgramLeader(leaderId, auth);
  return NextResponse.json({ success: deleted });
}
