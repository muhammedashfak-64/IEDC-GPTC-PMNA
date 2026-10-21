import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuthHelper';
import { generateSingleCertificatePdf } from '@/lib/certificateGenerator';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
      if (fs.existsSync(certificateTemplateUrl)) {
        resolvedTemplatePath = certificateTemplateUrl;
      } else {
        const localPath = path.join(process.cwd(), 'public', certificateTemplateUrl.replace(/^\//, ''));
        if (fs.existsSync(localPath)) {
          resolvedTemplatePath = localPath;
        }
      }
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

    // Save as test_generated_certificate.pdf or test_winner_certificate.pdf for live preview in iframes
    const outputName = isWinner ? 'test_winner_certificate.pdf' : 'test_generated_certificate.pdf';
    const templatesDir = path.join(process.cwd(), 'public', 'templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }
    const previewDest = path.join(templatesDir, outputName);
    fs.writeFileSync(previewDest, generated.pdfBytes);

    const timestamp = Date.now();
    return NextResponse.json({
      success: true,
      message: `${isWinner ? 'Winner' : 'Participation'} certificate preview generated successfully.`,
      pdfUrl: `/templates/${outputName}?t=${timestamp}`,
      downloadUrl: `/certificates/${previewCertId}.pdf`,
      isWinner
    });
  } catch (err: any) {
    console.error('Failed generating sample preview:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
