import { NextRequest, NextResponse } from 'next/server';
import { loadDb } from '@/lib/serverStore';
import { ensurePassFiles } from '@/lib/passGenerator';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { unpackRegistrationFromSupabase, unpackEventFromSupabase } from '@/lib/supabaseSync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventId = String(body.eventId || '').trim();
    const searchCode = String(body.registrationCode || '').trim().toUpperCase();
    const phoneInput = String(body.phone || '').replace(/\D/g, '').slice(-10);

    if (!phoneInput && !searchCode) {
      return NextResponse.json(
        { success: false, error: 'Please enter your registered 10-digit mobile number.' },
        { status: 400 }
      );
    }

    if (phoneInput && phoneInput.length !== 10 && !searchCode) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit mobile number.' },
        { status: 400 }
      );
    }

    const db = loadDb();
    const registrations = db.registrations || [];

    let found = registrations.find((r: any) => {
      if (searchCode && (r.registrationCode?.toUpperCase() === searchCode || r.id === searchCode)) {
        return true;
      }
      const cleanRegPhone = String(r.phone || '').replace(/\D/g, '').slice(-10);
      if (phoneInput && phoneInput.length === 10 && cleanRegPhone === phoneInput) {
        if (!eventId || r.eventId === eventId) {
          return true;
        }
      }
      return false;
    });

    // Supabase fallback
    if (!found && isSupabaseAdminConfigured()) {
      try {
        let query = supabaseAdmin.from('registrations').select('*');
        if (searchCode) {
          query = query.or(`registration_code.eq.${searchCode},id.eq.${searchCode}`);
        } else if (phoneInput) {
          query = query.eq('phone', phoneInput);
          if (eventId && eventId !== 'All') {
            query = query.eq('event_id', eventId);
          }
        }
        const { data: remoteData } = await query.limit(1).maybeSingle();
        if (remoteData) {
          found = unpackRegistrationFromSupabase(remoteData);
        }
      } catch (dbErr) {
        console.warn('Supabase retrieve-pass query note:', dbErr);
      }
    }

    if (!found) {
      return NextResponse.json(
        { success: false, error: 'No matching event registration found. Please check your mobile number and try again.' },
        { status: 404 }
      );
    }

    if (found.status === 'Cancelled' || found.status === 'Rejected') {
      return NextResponse.json(
        { success: false, error: 'This registration has been marked as cancelled or rejected.' },
        { status: 403 }
      );
    }

    let event = (db.events || []).find((e: any) => e.id === found.eventId);
    if (!event && isSupabaseAdminConfigured() && found.eventId) {
      try {
        const { data: remoteEvt } = await supabaseAdmin
          .from('events')
          .select('*')
          .eq('id', found.eventId)
          .single();
        if (remoteEvt) {
          event = unpackEventFromSupabase(remoteEvt);
        }
      } catch {}
    }

    if (!event) {
      event = {
        id: found.eventId,
        title: found.eventTitle || 'Campus Event',
        date: found.registeredAt?.split('T')[0] || ''
      };
    }

    // Ensure files exist on filesystem
    const { pdfUrl, pngUrl } = await ensurePassFiles(found, event);

    return NextResponse.json({
      success: true,
      data: {
        id: found.id,
        registrationCode: found.registrationCode,
        studentName: (found.studentName || '').toUpperCase(),
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
        jpgUrl: `/api/public/registrations/${found.id}/pass/jpg`,
        filePdfUrl: pdfUrl,
        filePngUrl: pngUrl
      }
    });
  } catch (err: any) {
    console.error('Error in retrieve-pass:', err);
    return NextResponse.json({ success: false, error: err.message || 'Pass lookup failed' }, { status: 500 });
  }
}
