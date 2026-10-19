import { NextRequest, NextResponse } from 'next/server';
import { getPublicCertificateForVerification } from '@/lib/serverStore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Certificate ID required' }, { status: 400 });
    }

    const cert = getPublicCertificateForVerification(id);

    if (!cert) {
      return NextResponse.json(
        { success: false, error: 'Certificate not found or unverified.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, certificate: cert });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { certificateId } = await req.json();
    if (!certificateId) {
      return NextResponse.json({ success: false, error: 'Certificate ID required' }, { status: 400 });
    }

    const cert = getPublicCertificateForVerification(certificateId);

    if (!cert) {
      return NextResponse.json(
        { success: false, error: 'Certificate not found or unverified.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, certificate: cert });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
