import { NextRequest, NextResponse } from 'next/server';
import { getPublicCertificateForVerification } from '@/lib/serverStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function findVerifiedCert(idStr: string) {
  let cert = getPublicCertificateForVerification(idStr);
  if (cert) return cert;

  // Fallback to Supabase
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .or(`certificate_id.ilike.${idStr.trim()},id.ilike.${idStr.trim()}`)
      .limit(1);

    if (!error && data && data.length > 0) {
      const row = data[0];
      if (row.status === 'Published' || row.status === 'Verified') {
        const cId = row.certificate_id || idStr;
        return {
          certificateId: cId,
          participantName: row.participant_name,
          registerNumber: row.register_number,
          eventName: row.event_name,
          eventDate: row.event_date,
          certificateType: row.certificate_type,
          issueDate: row.issue_date,
          status: row.status,
          qrCodeUrl: row.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:3000/verify/${cId}`,
          pdfUrl: `/api/public/certificates/${cId}/pdf`,
          pngUrl: `/api/public/certificates/${cId}/png`,
          downloadUrl: `/api/public/certificates/${cId}/pdf`
        };
      }
    }
  } catch {}

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Certificate ID required' }, { status: 400 });
    }

    const cert = await findVerifiedCert(id);

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

    const cert = await findVerifiedCert(certificateId);

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
