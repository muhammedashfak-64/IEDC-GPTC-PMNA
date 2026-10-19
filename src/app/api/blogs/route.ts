import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/blogs - Published blog posts & news articles
export async function GET() {
  try {
    const { data, error } = await supabase.from('blogs').select('*').order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return NextResponse.json({
        success: true,
        source: 'local',
        data: [
          {
            id: 'blog-1',
            title: 'How GPTC PMNA Students Won Top Honors at YIP 5.0 State Idea Fest',
            excerpt: 'Our student team secured a research grant of ₹5 Lakhs from K-DISC for their smart IoT agricultural project.',
            content: 'Government Polytechnic College Perinthalmanna continues to showcase leadership in student innovation...',
            author: 'Rahul V',
            author_role: 'Student CEO',
            category: 'Achievement',
            tags: ['YIP', 'K-DISC', 'Grant', 'IoT'],
            read_time: '4 min read',
            image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
            created_at: '2026-08-01'
          }
        ]
      });
    }

    return NextResponse.json({ success: true, count: data.length, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/blogs - Create blog post
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, error } = await supabase.from('blogs').insert([body]).select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
