import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuthHelper';
import { getCertificates, createCertificate, bulkCreateCertificates, updateCertificate, deleteCertificate } from '@/lib/serverStore';

export async function GET(req: NextRequest) {
  const { errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  const certificates = getCertificates(false);
  return NextResponse.json({ success: true, count: certificates.length, data: certificates });
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();

    // Support both single certificate and bulk array
    if (Array.isArray(body.records)) {
      const created = bulkCreateCertificates(body.records, user);
      return NextResponse.json({ success: true, count: created.length, data: created }, { status: 201 });
    }

    const created = createCertificate(body, user);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, error: 'Certificate ID required' }, { status: 400 });

    const updated = updateCertificate(id, updates, user);
    if (!updated) return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Certificate ID required' }, { status: 400 });

    deleteCertificate(id, user);
    return NextResponse.json({ success: true, message: 'Certificate deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
