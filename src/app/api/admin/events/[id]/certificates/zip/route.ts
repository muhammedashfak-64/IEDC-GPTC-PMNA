import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserFromRequest } from '@/lib/adminAuthHelper';
import { generateProgramCertificatesZip } from '@/lib/serverStore';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAdminUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { buffer, fileName, count } = await generateProgramCertificatesZip(id);

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'X-Certificate-Count': String(count)
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
