import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const rawSettings = getSettings() || {};

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

    const heroVisual = {
      campusPhotoUrl: rawSettings.heroVisual?.campusPhotoUrl || rawSettings.campusPhotoUrl || '/campus-main.jpeg',
      bgOpacity: rawSettings.heroVisual?.bgOpacity ?? 28,
      bgBlur: rawSettings.heroVisual?.bgBlur ?? 12,
      darkOverlayOpacity: rawSettings.heroVisual?.darkOverlayOpacity ?? 85,
      imagePosition: rawSettings.heroVisual?.imagePosition || 'center',
      bgScale: rawSettings.heroVisual?.bgScale ?? 104
    };

    const data = {
      ...rawSettings,
      footerSocial,
      heroVisual
    };

    return NextResponse.json({
      success: true,
      data
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
