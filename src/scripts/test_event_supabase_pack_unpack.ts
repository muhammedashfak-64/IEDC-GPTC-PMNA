import { supabaseAdmin } from '../lib/supabaseAdmin';

function packEventForSupabase(event: any) {
  const meta: Record<string, any> = {
    registrationLink: event.registrationLink || event.registration_link || '',
    registrationOpen: event.registrationOpen !== false,
    certificateEligible: event.certificateEligible !== false,
    facultyCoordinator: event.facultyCoordinator || '',
    studentCoordinator: event.studentCoordinator || '',
    certificateTitle: event.certificateTitle || '',
    certificateParagraph: event.certificateParagraph || '',
    certificateStatus: event.certificateStatus || event.status || 'Draft',
    certificateTemplateUrl: event.certificateTemplateUrl || '',
    templateConfig: event.templateConfig || null,
    winnerCertificateTitle: event.winnerCertificateTitle || '',
    winnerCertificateParagraph: event.winnerCertificateParagraph || '',
    winnerTemplateConfig: event.winnerTemplateConfig || null,
    awardCategory: event.awardCategory || '',
    quotaConfig: event.quotaConfig || null
  };

  return {
    id: event.id,
    title: event.title,
    category: event.category || 'Workshop',
    level: event.level || 'College',
    date: event.date,
    time: event.time || '10:00 AM - 04:00 PM',
    venue: event.venue || 'Main Auditorium',
    description: event.description || '',
    speaker: event.speaker || '',
    total_seats: Number(event.totalSeats ?? event.total_seats) || 60,
    seats_available: Number(event.seatsAvailable ?? event.seats_available ?? event.totalSeats ?? event.total_seats) || 60,
    banner_image: event.bannerImage || event.banner_image || '',
    brochure_url: event.brochureUrl || event.brochure_url || '',
    registration_link: JSON.stringify(meta),
    status: event.status || 'Published',
    updated_at: new Date().toISOString()
  };
}

function unpackEventFromSupabase(row: any) {
  let meta: any = {};
  if (row.registration_link && row.registration_link.startsWith('{')) {
    try {
      meta = JSON.parse(row.registration_link);
    } catch {}
  }

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    level: row.level,
    date: row.date,
    time: row.time,
    venue: row.venue,
    description: row.description,
    speaker: row.speaker,
    totalSeats: row.total_seats,
    seatsAvailable: row.seats_available,
    bannerImage: row.banner_image,
    brochureUrl: row.brochure_url,
    registrationLink: meta.registrationLink || (typeof row.registration_link === 'string' && !row.registration_link.startsWith('{') ? row.registration_link : ''),
    registrationOpen: meta.registrationOpen !== false,
    certificateEligible: meta.certificateEligible !== false,
    status: row.status,
    facultyCoordinator: meta.facultyCoordinator || '',
    studentCoordinator: meta.studentCoordinator || '',
    certificateTitle: meta.certificateTitle || '',
    certificateParagraph: meta.certificateParagraph || '',
    certificateStatus: meta.certificateStatus || row.status || 'Draft',
    certificateTemplateUrl: meta.certificateTemplateUrl || '',
    templateConfig: meta.templateConfig || null,
    winnerCertificateTitle: meta.winnerCertificateTitle || '',
    winnerCertificateParagraph: meta.winnerCertificateParagraph || '',
    winnerTemplateConfig: meta.winnerTemplateConfig || null,
    awardCategory: meta.awardCategory || '',
    quotaConfig: meta.quotaConfig || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function runTest() {
  const testId = `evt-test-pack-${Date.now()}`;
  const inputEvent = {
    id: testId,
    title: 'Packed Meta Test Event',
    category: 'Hackathon',
    level: 'State',
    date: '2026-11-20',
    time: '09:00 AM - 05:00 PM',
    venue: 'Main Auditorium',
    description: 'A test event description',
    speaker: 'Er. Test Speaker',
    totalSeats: 120,
    seatsAvailable: 110,
    bannerImage: 'https://images.unsplash.com/test.jpg',
    brochureUrl: 'https://images.unsplash.com/brochure.pdf',
    status: 'Published',
    quotaConfig: {
      participationType: 'Single Class',
      singleClass: { department: 'Electronics Engineering', academicYear: '3rd Year', maxSeats: 60 }
    },
    templateConfig: { nameY: 300, nameFontSize: 32 }
  };

  console.log('1. Packing and inserting into Supabase...');
  const row = packEventForSupabase(inputEvent);
  const { error: insErr } = await supabaseAdmin.from('events').insert(row);
  if (insErr) {
    throw new Error('Insert failed: ' + insErr.message);
  }
  console.log('Insert succeeded.');

  console.log('2. Querying row back from Supabase...');
  const { data: fetched, error: fetchErr } = await supabaseAdmin.from('events').select('*').eq('id', testId).single();
  if (fetchErr || !fetched) {
    throw new Error('Fetch failed: ' + fetchErr?.message);
  }

  const unpacked = unpackEventFromSupabase(fetched);
  console.log('Unpacked event:', unpacked.title, 'quotaConfig:', unpacked.quotaConfig);

  if (unpacked.quotaConfig?.singleClass?.department !== 'Electronics Engineering') {
    throw new Error('Quota config mismatch');
  }

  console.log('3. Cleaning up test event...');
  await supabaseAdmin.from('events').delete().eq('id', testId);
  console.log('SUCCESS: Pack/Unpack round-trip verified!');
}

runTest().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
