import { NextRequest, NextResponse } from 'next/server';
import { getBrochuresAsync } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const list = await getBrochuresAsync();
    return NextResponse.json(
      { success: true, count: list.length, data: list },
      { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

