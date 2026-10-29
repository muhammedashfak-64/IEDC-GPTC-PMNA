import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/committee - Executive Committee members list
export async function GET() {
  try {
    const { data, error } = await supabase.from('committee').select('*').order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return NextResponse.json({
        success: true,
        source: 'local',
        data: [
          { id: 'com-1', name: 'Prof. Anoop K', role: 'Faculty Coordinator / Nodal Officer', department: 'Mechanical Engg', type: 'Faculty Coordinator', email: 'anoop@gptcpmna.edu.in', photo_url: '/college-logo.png', display_order: 1 },
          { id: 'com-2', name: 'Rahul V', role: 'Student CEO & Innovation Lead', department: 'Electronics Engg', type: 'Executive Committee', email: 'rahul.v@gptcpmna.edu.in', photo_url: '/iedc-logo.png', display_order: 2 },
          { id: 'com-3', name: 'Fathima Riya', role: 'Student COO & Project Lead', department: 'Electronics Engg', type: 'Executive Committee', email: 'fathima.riya@gptcpmna.edu.in', photo_url: '/iedc-logo.png', display_order: 3 },
          { id: 'com-4', name: 'Arjun K', role: 'Student CTO & Tech Lead', department: 'Electrical & Electronics Engg', type: 'Executive Committee', email: 'arjun.k@gptcpmna.edu.in', photo_url: '/iedc-logo.png', display_order: 4 }
        ]
      });
    }

    return NextResponse.json({ success: true, count: data.length, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/committee - Add / Update Executive Committee member
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, error } = await supabase.from('committee').insert([body]).select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
