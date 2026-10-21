import { NextRequest, NextResponse } from 'next/server';
import { loadDb } from '@/lib/serverStore';
import { ensurePassFiles } from '@/lib/passGenerator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventId = String(body.eventId || '').trim();
    const searchCode = String(body.registrationCode || '').trim().toUpperCase();
    const phoneInput = String(body.phone || '').replace(/\D/g, '').slice(-10);

    if (!eventId && !searchCode) {
      return NextResponse.json(
        { success: false, error: 'Please select an event or enter your Registration Code.' },
        { status: 400 }
      );
    }

    const db = loadDb();
    const registrations = db.registrations || [];

    const found = registrations.find((r: any) => {
      if (searchCode && (r.registrationCode?.toUpperCase() === searchCode || r.id === searchCode)) {
        return true;
      }
      if (eventId && r.eventId === eventId) {
        const cleanRegPhone = String(r.phone || '').replace(/\D/g, '').slice(-10);
        if (phoneInput && phoneInput.length === 10 && cleanRegPhone === phoneInput) {
          return true;
        }
      }
      return false;
    });

    if (!found) {
      return NextResponse.json(
        { success: false, error: 'No matching event registration found. Please check your details and try again.' },
        { status: 404 }
      );
    }

    if (found.status === 'Cancelled' || found.status === 'Rejected') {
      return NextResponse.json(
        { success: false, error: 'This registration has been marked as cancelled or rejected.' },
        { status: 403 }
      );
    }

    const event = (db.events || []).find((e: any) => e.id === found.eventId) || {
      id: found.eventId,
      title: found.eventTitle || 'Campus Event',
      date: found.registeredAt?.split('T')[0] || ''
    };

    // Ensure files exist on filesystem
    const { pdfUrl, pngUrl } = await ensurePassFiles(found, event);

    return NextResponse.json({
      success: true,
      data: {
        id: found.id,
        registrationCode: found.registrationCode,
        studentName: found.studentName,
        department: found.department,
        academicYear: found.academicYear,
        collegeName: found.collegeName,
        eventTitle: found.eventTitle || event.title,
        eventId: found.eventId,
        status: found.status,
        waitlistPosition: found.waitlistPosition,
        registeredAt: found.registeredAt,
        pdfUrl: `/api/public/registrations/${found.id}/pass/pdf`,
        pngUrl: `/api/public/registrations/${found.id}/pass/png`,
        filePdfUrl: pdfUrl,
        filePngUrl: pngUrl
      }
    });
  } catch (err: any) {
    console.error('Error in retrieve-pass:', err);
    return NextResponse.json({ success: false, error: err.message || 'Pass lookup failed' }, { status: 500 });
  }
}
