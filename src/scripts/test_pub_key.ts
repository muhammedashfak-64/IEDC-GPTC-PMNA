import { createClient } from '@supabase/supabase-js';

const url = 'https://nxlaazpcbvzxmdboqlxe.supabase.co';
const pubKey = 'sb_publishable_cFnnnURY7SkKzPdU1AVjhw_qbM4QOPZ';

async function testPubKey() {
  const client = createClient(url, pubKey);
  const { data, error } = await client.from('events').select('*');
  console.log('Result with sb_publishable key:', data?.length, error);
}

testPubKey().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
