import { syncEventToSupabase, deleteEventFromSupabase } from '../lib/supabaseSync';
import { supabaseAdmin } from '../lib/supabaseAdmin';

async function testSync() {
  const testEvt = {
    id: 'evt-test-sync-1',
    title: 'Test Sync Event',
    category: 'Workshop',
    level: 'College',
    date: '2026-10-30',
    time: '10:00 AM',
    venue: 'Lab 1',
    description: 'Test description',
    speaker: 'Test speaker',
    totalSeats: 50,
    seatsAvailable: 50,
    status: 'Draft'
  };

  console.log('Testing syncEventToSupabase...');
  const res = await syncEventToSupabase(testEvt, false);
  console.log('syncEventToSupabase returned:', res);

  const { data, error } = await supabaseAdmin.from('events').select('*').eq('id', 'evt-test-sync-1');
  console.log('Supabase check data:', data, 'error:', error);

  // Clean up
  await supabaseAdmin.from('events').delete().eq('id', 'evt-test-sync-1');
  console.log('Cleanup complete.');
}

testSync().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
