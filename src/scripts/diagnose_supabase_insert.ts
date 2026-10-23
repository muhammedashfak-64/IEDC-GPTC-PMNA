import { isSupabaseConfigured } from '../lib/supabase';
import { isSupabaseAdminConfigured, supabaseAdmin } from '../lib/supabaseAdmin';

async function diagnose() {
  console.log('isSupabaseConfigured():', isSupabaseConfigured());
  console.log('isSupabaseAdminConfigured():', isSupabaseAdminConfigured());

  const baseRow = {
    id: 'evt-diag-1',
    title: 'Diagnostic Event',
    category: 'Workshop',
    level: 'College',
    date: '2026-10-30',
    time: '10:00 AM',
    venue: 'Lab 1',
    description: 'Test',
    speaker: 'Test',
    total_seats: 50,
    seats_available: 50,
    status: 'Published'
  };

  const res = await supabaseAdmin.from('events').insert(baseRow);
  console.log('Direct insert with supabaseAdmin:', res);

  const { data } = await supabaseAdmin.from('events').select('*').eq('id', 'evt-diag-1');
  console.log('Direct select with supabaseAdmin:', data);

  await supabaseAdmin.from('events').delete().eq('id', 'evt-diag-1');
}

diagnose().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
