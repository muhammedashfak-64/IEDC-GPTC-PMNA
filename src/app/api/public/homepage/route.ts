import { NextResponse } from 'next/server';
import { getSettings, getEvents, getProjects, getPartners, getAnnouncements } from '@/lib/serverStore';

export async function GET() {
  try {
    const settings = getSettings();
    const publishedEvents = getEvents(true).slice(0, 3);
    const publishedProjects = getProjects(true).slice(0, 3);
    const partners = getPartners().filter((p: any) => p.isActive);
    const announcements = getAnnouncements().filter((a: any) => a.isActive);

    return NextResponse.json({
      success: true,
      data: {
        settings,
        featuredEvents: publishedEvents,
        featuredProjects: publishedProjects,
        partners,
        announcements
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
