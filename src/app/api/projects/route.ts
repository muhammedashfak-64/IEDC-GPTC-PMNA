import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/projects - Public student projects list
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return NextResponse.json({
        success: true,
        source: 'local',
        data: [
          {
            id: 'proj-1',
            title: 'Autonomous Solar IoT Irrigation System',
            description: 'AI-driven soil moisture sensor array with automated solar pumping and mobile telemetry for smart farming.',
            department: 'Electronics & Communication',
            technology: ['ESP32', 'React', 'Supabase', 'Python', 'Solar PV'],
            year: '2026',
            status: 'Prototype',
            author: 'Rahul V & Team',
            mentor: 'Er. Shafi M',
            likes: 142,
            github_url: 'https://github.com/iedcgptcpmna/solar-iot-irrigation',
            demoUrl: 'https://demo.iedcgptcpmna.in/irrigation',
            image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80'
          },
          {
            id: 'proj-2',
            title: 'Polytechnic AI Attendance & QR Pass System',
            description: 'Face recognition and encrypted QR pass generator for instant campus workshop check-ins.',
            department: 'Electronics Engineering',
            technology: ['Next.js', 'OpenCV', 'TypeScript', 'TailwindCSS'],
            year: '2026',
            status: 'Completed',
            author: 'Fathima Riya & Team',
            mentor: 'Prof. Anoop K',
            likes: 98,
            github_url: 'https://github.com/iedcgptcpmna/ai-qr-pass',
            demoUrl: 'https://demo.iedcgptcpmna.in/qr-pass',
            image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80'
          }
        ]
      });
    }

    return NextResponse.json({ success: true, count: data.length, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/projects - Submit / Create new project
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, error } = await supabase.from('projects').insert([body]).select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
