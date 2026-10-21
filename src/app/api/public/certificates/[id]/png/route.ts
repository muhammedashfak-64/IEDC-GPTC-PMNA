import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { loadDb } from '@/lib/serverStore';
import { generateSingleCertificatePng, resolveTemplateFile } from '@/lib/certificateGenerator';

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
    const pngPath = path.join(process.cwd(), 'public', 'certificates', `${cleanId}.png`);

    // 1. If file already exists and is non-empty, stream directly
    if (fs.existsSync(pngPath) && fs.statSync(pngPath).size > 1000) {
      const buffer = fs.readFileSync(pngPath);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `inline; filename="${cleanId}.png"`,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    // 2. If missing on disk, find in db.json and generate PNG
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

      const resolvedTemplatePath = await resolveTemplateFile(event?.certificateTemplateUrl);

      const { pngBytes } = await generateSingleCertificatePng(
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
          customParagraph,
          customTemplatePath: resolvedTemplatePath
        },
        targetConfig
      );

      return new NextResponse(pngBytes as any, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `inline; filename="${cleanId}.png"`,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    return new NextResponse('Certificate PNG not found', { status: 404 });
  } catch (err: any) {
    return new NextResponse(`Error retrieving certificate PNG: ${err.message}`, { status: 500 });
  }
}
