import { NextResponse } from 'next/server';
import { getSettings, getEventsAsync, getProjects, getPartners, getAnnouncements } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const rawSettings = getSettings() || {};
    const heroVisual = {
      campusPhotoUrl: rawSettings.heroVisual?.campusPhotoUrl || rawSettings.campusPhotoUrl || '/campus-main.jpeg',
      bgOpacity: rawSettings.heroVisual?.bgOpacity ?? 28,
      bgBlur: rawSettings.heroVisual?.bgBlur ?? 12,
      darkOverlayOpacity: rawSettings.heroVisual?.darkOverlayOpacity ?? 85,
      imagePosition: rawSettings.heroVisual?.imagePosition || 'center',
      bgScale: rawSettings.heroVisual?.bgScale ?? 104
    };

    const footerSocial = {
      officialInstagramUsername: rawSettings.footerSocial?.officialInstagramUsername || '@iedc_gpc_pmna',
      officialInstagramUrl: rawSettings.footerSocial?.officialInstagramUrl || 'https://www.instagram.com/iedc_gpc_pmna/',
      creatorName: rawSettings.footerSocial?.creatorName || 'Muhammed Ashfak O',
      creatorInstagramUsername: rawSettings.footerSocial?.creatorInstagramUsername || '@_aasshfaakk_',
      creatorInstagramUrl: rawSettings.footerSocial?.creatorInstagramUrl || 'https://www.instagram.com/_aasshfaakk/',
      showOfficialInstagram: rawSettings.footerSocial?.showOfficialInstagram ?? true,
      showCreatorAttribution: rawSettings.footerSocial?.showCreatorAttribution ?? true,
      showFooterSocialSection: rawSettings.footerSocial?.showFooterSocialSection ?? true,
      featuredReel: {
        enabled: rawSettings.footerSocial?.featuredReel?.enabled ?? false,
        reelUrl: rawSettings.footerSocial?.featuredReel?.reelUrl || '',
        caption: rawSettings.footerSocial?.featuredReel?.caption || '',
        thumbnailUrl: rawSettings.footerSocial?.featuredReel?.thumbnailUrl || ''
      }
    };

    const settings = {
      ...rawSettings,
      heroVisual,
      footerSocial
    };

    // All published events intended for public viewing
    const allPublishedEvents = await getEventsAsync(true);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Compute dynamic registration status for each event according to CMS rules
    const enrichedEvents = allPublishedEvents.map((evt: any) => {
      const eventDateStr = evt.date ? String(evt.date).split('T')[0] : '';
      const isPast = eventDateStr ? eventDateStr < todayStr : false;
      const isToday = eventDateStr === todayStr;

      let registrationStatus: 'Registration Open' | 'Registration Closing Soon' | 'Registration Closed' | 'Ongoing' = 'Registration Open';

      if (isToday) {
        registrationStatus = 'Ongoing';
      } else if (isPast) {
        registrationStatus = 'Registration Closed';
      } else if (evt.registrationOpen === false || (typeof evt.seatsAvailable === 'number' && evt.seatsAvailable <= 0)) {
        registrationStatus = 'Registration Closed';
      } else if (evt.registrationDeadline) {
        const deadlineDate = new Date(evt.registrationDeadline);
        const timeDiff = deadlineDate.getTime() - today.getTime();
        if (timeDiff <= 0) {
          registrationStatus = 'Registration Closed';
        } else if (timeDiff <= 48 * 60 * 60 * 1000) {
          registrationStatus = 'Registration Closing Soon';
        } else {
          registrationStatus = 'Registration Open';
        }
      }

      return {
        ...evt,
        isPast,
        isToday,
        registrationStatus
      };
    });

    // Upcoming events: scheduled date >= today, sorted by date ascending
    const upcomingEvents = enrichedEvents
      .filter((e: any) => !e.isPast)
      .sort((a: any, b: any) => (a.date || '').localeCompare(b.date || ''));

    // Ongoing events (event date is today)
    const ongoingEvents = enrichedEvents.filter((e: any) => e.isToday);

    // Active announcements sorted by publication date or createdAt descending
    const announcements = getAnnouncements()
      .filter((a: any) => a.isActive !== false)
      .sort((a: any, b: any) => {
        const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });

    const publishedProjects = getProjects(true).slice(0, 6);
    const partners = getPartners().filter((p: any) => p.isActive);

    return NextResponse.json({
      success: true,
      data: {
        settings,
        heroVisual,
        upcomingEvents,
        ongoingEvents,
        featuredEvents: upcomingEvents.slice(0, 3),
        featuredProjects: publishedProjects,
        partners,
        announcements
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
