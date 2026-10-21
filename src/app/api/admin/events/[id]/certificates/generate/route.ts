import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserFromRequest } from '@/lib/adminAuthHelper';
import { generateProgramCertificates } from '@/lib/serverStore';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAdminUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
  }

  const { id } = await params;
  let options = { includeLeaders: true, regenerateExisting: false };

  try {
    const body = await req.json().catch(() => ({}));
    options = {
      includeLeaders: body.includeLeaders !== false,
      regenerateExisting: !!body.regenerateExisting
    };
  } catch (e) {}

  try {
    const result = await generateProgramCertificates(id, options, auth);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error generating program certificates:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
