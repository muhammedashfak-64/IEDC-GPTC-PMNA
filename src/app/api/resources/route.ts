import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/resources - Learning hub resources & templates
export async function GET() {
  try {
    const { data, error } = await supabase.from('resources').select('*').order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return NextResponse.json({
        success: true,
        source: 'local',
        data: [
          {
            id: 'res-1',
            title: 'IEEE Conference Paper Presentation Template (PPTX)',
            category: 'Presentation',
            file_type: 'PPT',
            description: 'Official IEEE standard slide master template with GPTC PMNA & IEDC header crests.',
            file_url: '/resources/IEEE_PPT_Template.pptx',
            file_size: '4.2 MB',
            author: 'Faculty Nodal Officer',
            views: 480
          },
          {
            id: 'res-2',
            title: 'ESP32 & MicroPython Starter Lab Manual (PDF)',
            category: 'Study Material',
            file_type: 'PDF',
            description: 'Step-by-step pinout diagram, sensor wiring schematics and code samples for ICFC lab bootcamps.',
            file_url: '/resources/ESP32_Starter_Guide.pdf',
            file_size: '2.8 MB',
            author: 'Student Technical Lead',
            views: 650
          }
        ]
      });
    }

    return NextResponse.json({ success: true, count: data.length, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/resources - Upload learning resource / document
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, error } = await supabase.from('resources').insert([body]).select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
