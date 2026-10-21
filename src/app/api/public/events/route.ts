import { NextRequest, NextResponse } from 'next/server';
import { getEvents, loadDb } from '@/lib/serverStore';

export async function GET(req: NextRequest) {
  try {
    const hasCertsOnly = req.nextUrl.searchParams.get('hasCertificates') === 'true';
    let publishedEvents = getEvents(true);

    if (hasCertsOnly) {
      const db = loadDb();
      const certs = db.certificates || [];
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

