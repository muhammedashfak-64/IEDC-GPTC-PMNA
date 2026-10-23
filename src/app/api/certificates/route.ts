import { NextResponse } from 'next/server';
import { getCertificates } from '@/lib/serverStore';
import { supabase } from '@/lib/supabase';

// GET /api/certificates - Fetch certificates list
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reg = searchParams.get('reg')?.trim();
    const id = searchParams.get('id')?.trim();

    // 1. Load from authoritative server store
    let certificates = getCertificates(false);

    if (id) {
      certificates = certificates.filter(
        (c: any) =>
          c.certificateId?.toLowerCase() === id.toLowerCase() ||
          c.id?.toLowerCase() === id.toLowerCase()
      );
    }

    if (reg) {
      certificates = certificates.filter(
        (c: any) => c.registerNumber?.toLowerCase() === reg.toLowerCase()
      );
    }

    // 2. If nothing found in local store and Supabase is configured, check Supabase
    if (certificates.length === 0) {
      try {
        let query = supabase.from('certificates').select('*');
        if (reg) query = query.eq('register_number', reg);
        if (id) query = query.eq('certificate_id', id);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return NextResponse.json({ success: true, count: data.length, data });
        }
      } catch {}
    }

    return NextResponse.json({ success: true, count: certificates.length, data: certificates });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/certificates - Issue / Generate certificate
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, error } = await supabase.from('certificates').insert([body]).select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
