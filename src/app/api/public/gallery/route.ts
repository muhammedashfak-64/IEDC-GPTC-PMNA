import { NextResponse } from 'next/server';
import { getGalleryAsync } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const published = await getGalleryAsync(true);
    return NextResponse.json({ success: true, count: published.length, data: published });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
