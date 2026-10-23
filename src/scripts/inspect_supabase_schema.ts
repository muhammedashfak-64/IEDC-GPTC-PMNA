import { supabaseAdmin } from '../lib/supabaseAdmin';

async function inspectSchema() {
  console.log('=== INSPECTING SUPABASE DATABASE SCHEMA ===');

  // Test tables
  const tables = ['events', 'registrations', 'certificates', 'program_leaders', 'audit_logs', 'settings'];

  for (const table of tables) {
    try {
      const { data, error } = await supabaseAdmin.from(table).select('*').limit(1);
      if (error) {
        console.log(`Table "${table}": ERROR -> ${error.message} (code: ${error.code})`);
      } else {
        const cols = data && data.length > 0 ? Object.keys(data[0]) : '(table empty)';
        console.log(`Table "${table}": EXISTS. Columns:`, cols);
      }
    } catch (e: any) {
      console.log(`Table "${table}": EXCEPTION -> ${e.message}`);
    }
  }

  // Check RLS policies if accessible via RPC or query
  console.log('\n=== CURRENT EVENTS IN SUPABASE ===');
  const { data: events, error: evErr } = await supabaseAdmin.from('events').select('*');
  if (evErr) {
    console.error('Error fetching events:', evErr);
  } else {
    console.log(`Found ${events.length} events in Supabase:`);
    events.forEach(e => {
      console.log(`  ID: ${e.id} | Title: ${e.title} | Status: ${e.status} | Date: ${e.date}`);
    });
  }
}

inspectSchema().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
