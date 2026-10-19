import { NextResponse } from 'next/server';
import { getBlogs } from '@/lib/serverStore';

export async function GET() {
  try {
    const list = getBlogs();
    const published = list.filter((b: any) => b.status === 'Published' || !b.status);
    return NextResponse.json({
      success: true,
      count: published.length,
      data: published
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
