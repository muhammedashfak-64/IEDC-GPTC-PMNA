import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { loadDb, getCertificateTemplates } from '@/lib/serverStore';
import { generateSingleCertificatePdf, resolveTemplateFile } from '@/lib/certificateGenerator';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { unpackCertificateFromSupabase, unpackEventFromSupabase } from '@/lib/supabaseSync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    // 1. Authoritatively fetch certificate record from local cache or Supabase
    const db = loadDb();
    let cert = (db.certificates || []).find(
      (c: any) => c.certificateId && c.certificateId.toUpperCase() === cleanId
    );

    if (!cert && isSupabaseAdminConfigured()) {
      const { data: remoteCert } = await supabaseAdmin
        .from('certificates')
        .select('*')
        .eq('certificate_id', cleanId)
        .single();
      if (remoteCert) {
        cert = unpackCertificateFromSupabase(remoteCert);
      }
    }

    if (!cert) {
      return new NextResponse('Certificate not found for the given ID.', { status: 404 });
    }

    // 2. Authoritatively fetch event record
    let event = (db.events || []).find((e: any) => e.id === cert.eventId);
    if (!event && isSupabaseAdminConfigured() && cert.eventId) {
      const { data: remoteEvent } = await supabaseAdmin
        .from('events')
        .select('*')
        .eq('id', cert.eventId)
        .single();
      if (remoteEvent) {
        event = unpackEventFromSupabase(remoteEvent);
      }
    }

    // 3. Documented Template Selection Priority:
    // Priority 1: Explicitly assigned active template for the event
    // Priority 2: Configured active global template
    const allTemplates = getCertificateTemplates();
    const activeGlobalTemplate = allTemplates.find((t: any) => t.isActive) || allTemplates[0];
    const templateToUse = event?.certificateTemplateUrl || activeGlobalTemplate?.cleanUrl || activeGlobalTemplate?.pdfUrl || undefined;

    if (!templateToUse) {
      return new NextResponse(
        'No valid certificate template is configured for this event. Please contact the administrator.',
        { status: 400 }
      );
    }

    // 4. Resolve template file from storage or local path
    const resolvedTemplatePath = await resolveTemplateFile(templateToUse);
    if (!resolvedTemplatePath) {
      return new NextResponse(
        `The assigned certificate template (${templateToUse}) could not be retrieved from storage. Please verify the template file in Admin settings.`,
        { status: 500 }
      );
    }

    // 5. Build typography and text settings
    const isWinner =
      cert.certificateType?.toLowerCase().includes('winner') ||
      cert.certificateType?.toLowerCase().includes('achievement') ||
      cert.certificateType?.toLowerCase().includes('prize') ||
      event?.certificateType === 'Achievement';

    const customParagraph = isWinner
      ? (event?.winnerCertificateParagraph || undefined)
      : (event?.certificateParagraph || undefined);

    const defaultTemplateConfig = activeGlobalTemplate?.templateConfig || undefined;
    const targetConfig = {
      ...(defaultTemplateConfig || {}),
      ...(isWinner
        ? (event?.winnerTemplateConfig || event?.templateConfig || {})
        : (event?.templateConfig || {}))
    };

    const formattedSubtitle = isWinner
      ? (event?.winnerCertificateTitle ? `— ${event.winnerCertificateTitle.replace(/^—\s*|\s*—$/g, '').trim()} —` : '— OF ACHIEVEMENT —')
      : (event?.certificateTitle ? `— ${event.certificateTitle.replace(/^—\s*|\s*—$/g, '').trim()} —` : undefined);

    // 6. Generate fresh PDF using the exact authoritative assigned template
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

    // 7. Update disk cache with the fresh generated PDF
    try {
      const publicCertDir = path.join(process.cwd(), 'public', 'certificates');
      if (!fs.existsSync(publicCertDir)) {
        fs.mkdirSync(publicCertDir, { recursive: true });
      }
      fs.writeFileSync(path.join(publicCertDir, `${cleanId}.pdf`), Buffer.from(generated.pdfBytes));
    } catch (e) {
      console.warn('Failed to cache fresh certificate PDF on disk:', e);
    }

    return new NextResponse(Buffer.from(generated.pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${cleanId}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (err: any) {
    return new NextResponse(`Error retrieving certificate: ${err.message}`, { status: 500 });
  }
}
