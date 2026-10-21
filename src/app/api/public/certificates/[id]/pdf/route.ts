import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { loadDb, ensureCertificatePdfExists } from '@/lib/serverStore';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return new NextResponse('Certificate ID is required', { status: 400 });
    }

    const cleanId = id.trim().toUpperCase();
    const pdfPath = path.join(process.cwd(), 'public', 'certificates', `${cleanId}.pdf`);

    // 1. If file already exists and is non-empty, stream directly
    if (fs.existsSync(pdfPath) && fs.statSync(pdfPath).size > 1000) {
      const buffer = fs.readFileSync(pdfPath);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${cleanId}.pdf"`,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    // 2. If missing on disk, find in db.json and generate on the fly
    const db = loadDb();
    const cert = (db.certificates || []).find(
      (c: any) => c.certificateId && c.certificateId.toUpperCase() === cleanId
    );

    if (cert) {
      await ensureCertificatePdfExists(cert);
      if (fs.existsSync(pdfPath)) {
        const buffer = fs.readFileSync(pdfPath);
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${cleanId}.pdf"`,
            'Cache-Control': 'public, max-age=3600'
          }
        });
      }
    }

    // 3. Fallback: Mock records for testing
    const mockDb: Record<string, any> = {
      'IEDC-2026-89412': { participantName: 'Rahul V', eventName: 'GPTC PMNA Hackathon 2026', certificateType: 'Winner', eventDate: '2026-08-25' },
      'IEDC-2026-89413': { participantName: 'Fathima Riya', eventName: 'Hands-on IoT Bootcamp 2026', certificateType: 'Participation', eventDate: '2026-09-02' },
      'IEDC-2026-89414': { participantName: 'Arjun K', eventName: 'State-Level Idea Fest 2026', certificateType: 'Organizer', eventDate: '2026-07-15' }
    };

    if (mockDb[cleanId]) {
      const mockCert = { certificateId: cleanId, ...mockDb[cleanId] };
      await ensureCertificatePdfExists(mockCert);
      if (fs.existsSync(pdfPath)) {
        const buffer = fs.readFileSync(pdfPath);
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${cleanId}.pdf"`,
            'Cache-Control': 'public, max-age=3600'
          }
        });
      }
    }

    return new NextResponse('Certificate PDF not found', { status: 404 });
  } catch (err: any) {
    return new NextResponse(`Error retrieving certificate: ${err.message}`, { status: 500 });
  }
}
