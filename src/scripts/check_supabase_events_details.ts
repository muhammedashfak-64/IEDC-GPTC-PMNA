import { supabaseAdmin } from '../lib/supabaseAdmin';

async function checkEvents() {
  const { data } = await supabaseAdmin.from('events').select('*');
  console.log('Current events in Supabase:');
  console.log(JSON.stringify(data, null, 2));
}

checkEvents().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
