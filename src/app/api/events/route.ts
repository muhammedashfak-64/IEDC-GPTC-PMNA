import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/events - Public list of approved events
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error || !data) {
      // Fallback mock events if database table empty
      return NextResponse.json({
        success: true,
        source: 'local',
        data: [
          {
            id: 'evt-1',
            title: 'GPTC PMNA Hackathon 2026',
            category: 'Hackathon',
            level: 'State',
            date: '2026-08-25',
            time: '09:00 AM - 05:00 PM',
            venue: 'Main Auditorium & ICFC Lab',
            description: '24-hour state level flagship hackathon empowering diploma innovators to build real-world IoT and software solutions.',
            speaker: 'Er. Mohammed Shafi (KSUM Mentor)',
            total_seats: 120,
            seats_available: 34,
            banner_image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
            registration_open: true,
            certificate_eligible: true
          },
          {
            id: 'evt-2',
            title: 'Hands-on IoT & Embedded Robotics Bootcamp',
            category: 'Bootcamp',
            level: 'College',
            date: '2026-09-02',
            time: '10:00 AM - 04:00 PM',
            venue: 'Electronics Lab 2',
            description: 'Practical 2-day workshop on ESP32, Sensors, MQTT protocol and cloud data integration for diploma students.',
            speaker: 'Prof. Anoop K (Faculty Nodal Officer)',
            total_seats: 60,
            seats_available: 12,
            banner_image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
            registration_open: true,
            certificate_eligible: true
          }
        ]
      });
    }

    return NextResponse.json({
      success: true,
      source: 'database',
      count: data.length,
      data
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/events - Create new event (Admin CMS API)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, error } = await supabase.from('events').insert([body]).select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
