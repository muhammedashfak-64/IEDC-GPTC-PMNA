import { NextResponse } from 'next/server';
import { getStartups } from '@/lib/serverStore';

export async function GET() {
  try {
    const list = getStartups();
    const published = list.filter((s: any) => s.status === 'Published' || !s.status);
    return NextResponse.json({
      success: true,
      count: published.length,
      data: published
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
