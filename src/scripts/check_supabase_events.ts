import { supabase } from '../lib/supabase';
import { supabaseAdmin, isSupabaseAdminConfigured } from '../lib/supabaseAdmin';

async function main() {
  console.log('--- SUPABASE CONFIGURATION AUDIT ---');
  console.log('isSupabaseAdminConfigured:', isSupabaseAdminConfigured());

  // 1. Check with supabaseAdmin (Service Role)
  try {
    const { data: adminEvents, error: adminErr } = await supabaseAdmin
      .from('events')
      .select('*');
    if (adminErr) {
      console.error('supabaseAdmin query error:', adminErr);
    } else {
      console.log(`supabaseAdmin found ${adminEvents?.length} events:`);
      adminEvents?.forEach((e) => {
        console.log(`  - [${e.id}] "${e.title}" | Status: ${e.status} | Date: ${e.date}`);
      });
      if (adminEvents && adminEvents.length > 0) {
        console.log('Supabase "events" columns:', Object.keys(adminEvents[0]));
      }
    }
  } catch (err: any) {
    console.error('Exception querying with supabaseAdmin:', err.message);
  }

  // 2. Check with public/anon supabase client
  try {
    const { data: anonEvents, error: anonErr } = await supabase
      .from('events')
      .select('*');
    if (anonErr) {
      console.error('anon supabase query error (RLS likely):', anonErr);
    } else {
      console.log(`anon supabase client found ${anonEvents?.length} events.`);
    }
  } catch (err: any) {
    console.error('Exception querying with anon supabase:', err.message);
  }

  // 3. Check db.json events
  const fs = await import('fs');
  const path = await import('path');
  const dbFile = path.join(process.cwd(), 'src', 'data', 'db.json');
  if (fs.existsSync(dbFile)) {
    const db = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
    console.log(`\ndb.json has ${db.events?.length} events:`);
    db.events?.forEach((e: any) => {
      console.log(`  - [${e.id}] "${e.title}" | Status: ${e.status} | Date: ${e.date}`);
    });
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
