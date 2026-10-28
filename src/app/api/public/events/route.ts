import { NextRequest, NextResponse } from 'next/server';
import { getEventsAsync, getCertificatesAsync } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const hasCertsOnly = req.nextUrl.searchParams.get('hasCertificates') === 'true';
    let publishedEvents = await getEventsAsync(true);

    if (hasCertsOnly) {
      const certs = await getCertificatesAsync(true);
      const eventIdsWithPublishedCerts = new Set(
        certs.filter((c: any) => c.status === 'Published').map((c: any) => c.eventId)
      );
      publishedEvents = publishedEvents.filter(
        (e: any) => e.certificateStatus === 'Published' || eventIdsWithPublishedCerts.has(e.id)
      );
    }

    return NextResponse.json({
      success: true,
      count: publishedEvents.length,
      data: publishedEvents
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

