import { supabaseAdmin } from '../lib/supabaseAdmin';

async function checkRpc() {
  const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: 'SELECT 1;' });
  console.log('rpc exec_sql:', data, error);
}

checkRpc().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
