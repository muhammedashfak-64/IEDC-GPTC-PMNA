import { NextRequest, NextResponse } from 'next/server';
import { loadDb } from '@/lib/serverStore';
import { generatePassPng, ensurePassFiles } from '@/lib/passGenerator';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { unpackRegistrationFromSupabase, unpackEventFromSupabase } from '@/lib/supabaseSync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Registration ID required' }, { status: 400 });
    }

    const cleanId = id.trim();
    const db = loadDb();
    let reg = (db.registrations || []).find(
      (r: any) =>
        r.id === cleanId ||
        r.registrationCode === cleanId ||
        (r.registrationCode && r.registrationCode.toUpperCase() === cleanId.toUpperCase())
    );

    // Fallback to authoritative Supabase database
    if (!reg && isSupabaseAdminConfigured()) {
      try {
        const { data: remoteReg } = await supabaseAdmin
          .from('registrations')
          .select('*')
          .or(`id.eq.${cleanId},registration_code.eq.${cleanId},registration_code.eq.${cleanId.toUpperCase()}`)
          .single();
        if (remoteReg) {
          reg = unpackRegistrationFromSupabase(remoteReg);
        }
      } catch (dbErr) {
        console.warn('Supabase pass registration lookup notice:', dbErr);
      }
    }

    if (!reg) {
      return NextResponse.json({ success: false, error: 'Registration record not found' }, { status: 404 });
    }

    if (reg.status === 'Cancelled' || reg.status === 'Rejected') {
      return NextResponse.json({ success: false, error: 'This registration has been cancelled or invalidated' }, { status: 403 });
    }

    let event = (db.events || []).find((e: any) => e.id === reg.eventId);
    if (!event && isSupabaseAdminConfigured() && reg.eventId) {
      try {
        const { data: remoteEvt } = await supabaseAdmin
          .from('events')
          .select('*')
          .eq('id', reg.eventId)
          .single();
        if (remoteEvt) {
          event = unpackEventFromSupabase(remoteEvt);
        }
      } catch {}
    }

    if (!event) {
      event = {
        id: reg.eventId,
        title: reg.eventTitle || 'Campus Event',
        date: reg.registeredAt?.split('T')[0] || ''
      };
    }

    const pngBuffer = await generatePassPng(reg, event);
    ensurePassFiles(reg, event).catch(console.error);

    const safeName = (reg.studentName || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeCode = (reg.registrationCode || reg.id).replace(/[^a-zA-Z0-9_-]/g, '_');

    return new NextResponse(pngBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="IEDC_Pass_${safeName}_${safeCode}.png"`,
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (err: any) {
    console.error('Error generating pass PNG:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed generating pass PNG' }, { status: 500 });
  }
}
