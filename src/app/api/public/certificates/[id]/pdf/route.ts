import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadDb } from '@/lib/serverStore';
import { generateSingleCertificatePdf, resolveTemplateFile } from '@/lib/certificateGenerator';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    const pdfFileName = `${cleanId}.pdf`;

    // 1. Check local public/certificates
    const publicPdfPath = path.join(process.cwd(), 'public', 'certificates', pdfFileName);
    if (fs.existsSync(publicPdfPath) && fs.statSync(publicPdfPath).size > 1000) {
      const buffer = fs.readFileSync(publicPdfPath);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${cleanId}.pdf"`,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    // 2. Check /tmp/certificates
    const tmpPdfPath = path.join(os.tmpdir(), 'certificates', pdfFileName);
    if (fs.existsSync(tmpPdfPath) && fs.statSync(tmpPdfPath).size > 1000) {
      const buffer = fs.readFileSync(tmpPdfPath);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${cleanId}.pdf"`,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    // 3. Check Supabase Storage
    if (isSupabaseAdminConfigured()) {
      try {
        const { data: fileData, error: sErr } = await supabaseAdmin.storage
          .from('certificates')
          .download(pdfFileName);
        if (!sErr && fileData) {
          const buffer = Buffer.from(await fileData.arrayBuffer());
          return new NextResponse(buffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="${cleanId}.pdf"`,
              'Cache-Control': 'public, max-age=3600'
            }
          });
        }
      } catch {}
    }

    // 4. Generate on the fly from db record
    const db = loadDb();
    const cert = (db.certificates || []).find(
      (c: any) => c.certificateId && c.certificateId.toUpperCase() === cleanId
    );

    if (cert) {
      const event = (db.events || []).find((e: any) => e.id === cert.eventId);
      const isWinner =
        cert.certificateType?.toLowerCase().includes('winner') ||
        cert.certificateType?.toLowerCase().includes('achievement') ||
        cert.certificateType?.toLowerCase().includes('prize') ||
        event?.certificateType === 'Achievement';

      const customParagraph = isWinner
        ? (event?.winnerCertificateParagraph || undefined)
        : (event?.certificateParagraph || undefined);

      const targetConfig = isWinner
        ? (event?.winnerTemplateConfig || event?.templateConfig || {})
        : (event?.templateConfig || {});

      const formattedSubtitle = isWinner
        ? (event?.winnerCertificateTitle ? `— ${event.winnerCertificateTitle.replace(/^—\s*|\s*—$/g, '').trim()} —` : '— OF ACHIEVEMENT —')
        : (event?.certificateTitle ? `— ${event.certificateTitle.replace(/^—\s*|\s*—$/g, '').trim()} —` : undefined);

      const activeGlobalTemplate = (db.certificateTemplates || []).find((t: any) => t.isActive);
      const templateToUse = event?.certificateTemplateUrl || activeGlobalTemplate?.cleanUrl || undefined;
      const resolvedTemplatePath = await resolveTemplateFile(templateToUse);

      const generated = await generateSingleCertificatePdf(
        {
          certificateId: cleanId,
          recipientName: cert.participantName,
          programName: cert.eventName,
          programDate: cert.eventDate || cert.issueDate || new Date().toISOString().split('T')[0],
          organizingBody: event?.organizingBody || undefined,
          role: cert.certificateType,
          certificateType: isWinner ? 'Achievement' : 'Participation',
          awardCategory: isWinner ? (cert.awardCategory || event?.awardCategory || 'Winner') : undefined,
          certificateSubtitle: formattedSubtitle,
          recipientIntro: isWinner ? 'THIS CERTIFICATE IS AWARDED TO' : undefined,
          customParagraph,
          customTemplatePath: resolvedTemplatePath
        },
        targetConfig
      );

      return new NextResponse(Buffer.from(generated.pdfBytes), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${cleanId}.pdf"`,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    return new NextResponse('Certificate PDF not found', { status: 404 });
  } catch (err: any) {
    return new NextResponse(`Error retrieving certificate: ${err.message}`, { status: 500 });
  }
}
