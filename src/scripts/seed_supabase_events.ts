import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../lib/supabaseAdmin';

function packEvent(e: any) {
  const meta: Record<string, any> = {
    registrationLink: e.registrationLink || e.registration_link || '',
    registrationOpen: e.registrationOpen !== false,
    certificateEligible: e.certificateEligible !== false,
    facultyCoordinator: e.facultyCoordinator || '',
    studentCoordinator: e.studentCoordinator || '',
    certificateTitle: e.certificateTitle || '',
    certificateParagraph: e.certificateParagraph || '',
    certificateStatus: e.certificateStatus || e.status || 'Draft',
    certificateTemplateUrl: e.certificateTemplateUrl || '',
    templateConfig: e.templateConfig || null,
    winnerCertificateTitle: e.winnerCertificateTitle || '',
    winnerCertificateParagraph: e.winnerCertificateParagraph || '',
    winnerTemplateConfig: e.winnerTemplateConfig || null,
    awardCategory: e.awardCategory || '',
    quotaConfig: e.quotaConfig || null
  };

  return {
    id: e.id,
    title: e.title,
    category: e.category || 'Workshop',
    level: e.level || 'College',
    date: e.date,
    time: e.time || '10:00 AM - 04:00 PM',
    venue: e.venue || 'Main Auditorium',
    description: e.description || '',
    speaker: e.speaker || '',
    total_seats: Number(e.totalSeats ?? e.total_seats) || 60,
    seats_available: Number(e.seatsAvailable ?? e.seats_available ?? e.totalSeats ?? e.total_seats) || 60,
    banner_image: e.bannerImage || e.banner_image || '',
    brochure_url: e.brochureUrl || e.brochure_url || '',
    registration_link: JSON.stringify(meta),
    status: e.status || 'Published',
    updated_at: e.updatedAt || new Date().toISOString()
  };
}

async function syncAllDbEventsToSupabase() {
  const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

  console.log(`Syncing ${db.events?.length || 0} events from db.json to Supabase...`);
  for (const e of db.events || []) {
    const row = packEvent(e);
    const { error } = await supabaseAdmin.from('events').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error(`Failed upsert for [${e.id}] ${e.title}:`, error.message);
    } else {
      console.log(`[SYNCED] [${e.id}] ${e.title}`);
    }
  }

  // Check count in Supabase
  const { data: allSupabase, error: selErr } = await supabaseAdmin.from('events').select('*');
  console.log(`\nSupabase now has ${allSupabase?.length} events:`);
  allSupabase?.forEach(s => {
    console.log(`  - [${s.id}] "${s.title}" (${s.status})`);
  });
}

syncAllDbEventsToSupabase().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
