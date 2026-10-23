import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuthHelper';
import { generateSingleCertificatePdf, resolveTemplateFile } from '@/lib/certificateGenerator';
import path from 'path';
import fs from 'fs';
import os from 'os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// In-memory cache for generated sample preview buffers
let cachedParticipationPdf: Uint8Array | null = null;
let cachedWinnerPdf: Uint8Array | null = null;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'participation';
  const isWinner = type === 'winner' || type === 'achievement';
  const isDownload = searchParams.get('download') === '1';

  let pdfBytes: Uint8Array | null = isWinner ? cachedWinnerPdf : cachedParticipationPdf;

  // If not cached yet in memory, try loading from /tmp or public/templates
  const fileName = isWinner ? 'test_winner_certificate.pdf' : 'test_generated_certificate.pdf';
  if (!pdfBytes) {
    const tmpPath = path.join(os.tmpdir(), fileName);
    if (fs.existsSync(tmpPath)) {
      try {
        pdfBytes = fs.readFileSync(tmpPath);
      } catch {}
    }
  }

  if (!pdfBytes) {
    const publicPath = path.join(process.cwd(), 'public', 'templates', fileName);
    if (fs.existsSync(publicPath)) {
      try {
        pdfBytes = fs.readFileSync(publicPath);
      } catch {}
    }
  }

  // If still not available, generate a default sample on the fly
  if (!pdfBytes) {
    try {
      const generated = await generateSingleCertificatePdf(
        {
          certificateId: `PREVIEW-SAMPLE`,
          recipientName: 'MUHAMMED ASHFAK O',
          programName: 'Drone Innovation Workshop & Hackathon',
          programDate: new Date().toISOString().split('T')[0],
          organizingBody: 'the IEDC Cell, Government Polytechnic College Perinthalmanna',
          certificateType: isWinner ? 'Achievement' : 'Participation',
          awardCategory: isWinner ? 'First Prize Winner' : undefined,
          certificateSubtitle: isWinner ? '— OF ACHIEVEMENT —' : undefined,
          recipientIntro: isWinner ? 'THIS CERTIFICATE IS AWARDED TO' : undefined
        },
        {}
      );
      pdfBytes = generated.pdfBytes;
      if (isWinner) cachedWinnerPdf = pdfBytes;
      else cachedParticipationPdf = pdfBytes;
    } catch (e: any) {
      return new NextResponse(`Error generating sample preview: ${e.message}`, { status: 500 });
    }
  }

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': isDownload ? `attachment; filename="${fileName}"` : `inline; filename="${fileName}"`,
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const {
      eventId,
      recipientName = 'MUHAMMED ASHFAK O',
      programName = 'Drone Innovation Workshop & Hackathon',
      programDate = new Date().toISOString().split('T')[0],
      organizingBody = 'the IEDC Cell, Government Polytechnic College Perinthalmanna',
      certificateType = 'Participation',
      awardCategory = 'First Prize Winner',
      customParagraph,
      templateConfig = {},
      certificateTemplateUrl,
      recipientPhotoUrl
    } = body;

    let resolvedTemplatePath: string | undefined = undefined;
    if (certificateTemplateUrl) {
      resolvedTemplatePath = await resolveTemplateFile(certificateTemplateUrl);
    }

    const previewCertId = `PREVIEW-${Date.now()}`;
    const isWinner =
      certificateType.toLowerCase().includes('achievement') ||
      certificateType.toLowerCase().includes('winner') ||
      certificateType.toLowerCase().includes('prize');

    const formattedSubtitle = isWinner
      ? (body.certificateSubtitle || (body.winnerCertificateTitle ? `— ${body.winnerCertificateTitle.replace(/^—\s*|\s*—$/g, '').trim()} —` : (body.certificateTitle ? `— ${body.certificateTitle.replace(/^—\s*|\s*—$/g, '').trim()} —` : '— OF ACHIEVEMENT —')))
      : (body.certificateSubtitle || (body.certificateTitle ? `— ${body.certificateTitle.replace(/^—\s*|\s*—$/g, '').trim()} —` : undefined));

    const generated = await generateSingleCertificatePdf(
      {
        certificateId: previewCertId,
        recipientName,
        programName,
        programDate,
        organizingBody,
        certificateType: isWinner ? 'Achievement' : 'Participation',
        awardCategory: isWinner ? (awardCategory || 'First Prize Winner') : undefined,
        certificateSubtitle: formattedSubtitle,
        recipientIntro: isWinner ? (body.recipientIntro || 'THIS CERTIFICATE IS AWARDED TO') : undefined,
        customParagraph,
        recipientPhotoUrl,
        customTemplatePath: resolvedTemplatePath
      },
      templateConfig
    );

    // Cache in memory
    if (isWinner) {
      cachedWinnerPdf = generated.pdfBytes;
    } else {
      cachedParticipationPdf = generated.pdfBytes;
    }

    // Try saving to /tmp and public/templates for disk fallback
    const outputName = isWinner ? 'test_winner_certificate.pdf' : 'test_generated_certificate.pdf';
    try {
      const tmpPath = path.join(os.tmpdir(), outputName);
      fs.writeFileSync(tmpPath, generated.pdfBytes);
    } catch {}

    try {
      const templatesDir = path.join(process.cwd(), 'public', 'templates');
      if (!fs.existsSync(templatesDir)) {
        fs.mkdirSync(templatesDir, { recursive: true });
      }
      const previewDest = path.join(templatesDir, outputName);
      fs.writeFileSync(previewDest, generated.pdfBytes);
    } catch {}

    const timestamp = Date.now();
    const pdfBase64 = Buffer.from(generated.pdfBytes).toString('base64');
    const dynamicPdfUrl = `/api/admin/certificates/sample-preview?type=${isWinner ? 'winner' : 'participation'}&t=${timestamp}`;

    return NextResponse.json({
      success: true,
      message: `${isWinner ? 'Winner' : 'Participation'} certificate preview generated successfully.`,
      pdfUrl: dynamicPdfUrl,
      pdfDataUrl: `data:application/pdf;base64,${pdfBase64}`,
      downloadUrl: `/api/admin/certificates/sample-preview?type=${isWinner ? 'winner' : 'participation'}&download=1&t=${timestamp}`,
      isWinner
    });
  } catch (err: any) {
    console.error('Failed generating sample preview:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
