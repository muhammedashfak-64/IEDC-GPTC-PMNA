import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/gallery - Gallery albums & event media
export async function GET() {
  try {
    const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return NextResponse.json({
        success: true,
        source: 'local',
        data: [
          {
            id: 'gal-1',
            title: 'GPTC PMNA Campus Entrance & Lawn',
            album_name: 'Main Campus',
            media_type: 'Image',
            media_url: '/campus-main.jpeg'
          },
          {
            id: 'gal-2',
            title: 'GPTC Academic Block Front View',
            album_name: 'Front View',
            media_type: 'Image',
            media_url: '/campus-front.jpeg'
          }
        ]
      });
    }

    return NextResponse.json({ success: true, count: data.length, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/gallery - Upload gallery photo / album
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, error } = await supabase.from('gallery').insert([body]).select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
