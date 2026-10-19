import { NextResponse } from 'next/server';
import { getEvents } from '@/lib/serverStore';

export async function GET() {
  try {
    const publishedEvents = getEvents(true);
    return NextResponse.json({
      success: true,
      count: publishedEvents.length,
      data: publishedEvents
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
