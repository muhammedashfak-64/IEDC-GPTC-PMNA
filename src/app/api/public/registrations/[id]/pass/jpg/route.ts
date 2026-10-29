import { NextRequest, NextResponse } from 'next/server';
import { loadDb } from '@/lib/serverStore';
import { generatePassJpg, ensurePassFiles } from '@/lib/passGenerator';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Registration ID required' }, { status: 400 });
    }

    const db = loadDb();
    const reg = (db.registrations || []).find((r: any) => r.id === id || r.registrationCode === id);
    if (!reg) {
      return NextResponse.json({ success: false, error: 'Registration record not found' }, { status: 404 });
    }

    if (reg.status === 'Cancelled' || reg.status === 'Rejected') {
      return NextResponse.json({ success: false, error: 'This registration has been cancelled or invalidated' }, { status: 403 });
    }

    const event = (db.events || []).find((e: any) => e.id === reg.eventId) || {
      id: reg.eventId,
      title: reg.eventTitle || 'Campus Event',
      date: reg.registeredAt?.split('T')[0] || ''
    };

    const jpgBuffer = await generatePassJpg(reg, event);
    ensurePassFiles(reg, event).catch(console.error);

    const safeName = (reg.studentName || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
    return new NextResponse(jpgBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="IEDC_Entry_Pass_${safeName}.jpg"`,
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (err: any) {
    console.error('Error generating pass JPG:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed generating pass JPG' }, { status: 500 });
  }
}

