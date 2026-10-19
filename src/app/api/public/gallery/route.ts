import { NextResponse } from 'next/server';
import { getGallery } from '@/lib/serverStore';

export async function GET() {
  try {
    const published = getGallery(true);
    return NextResponse.json({ success: true, count: published.length, data: published });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
