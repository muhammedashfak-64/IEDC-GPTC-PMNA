import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxlaazpcbvzxmdboqlxe.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_cFnnnURY7SkKzPdU1AVjhw_qbM4QOPZ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export { supabaseAdmin } from './supabaseAdmin';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseAnonKey.includes('placeholder')
  );
};

export async function testSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxlaazpcbvzxmdboqlxe.supabase.co';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!isSupabaseConfigured()) {
      return {
        connected: false,
        message: 'Live Supabase Anon Key is not configured yet. Using local fallback persistence.'
      };
    }

    // Ping Auth settings with anon key
    const authRes = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key! }
    });
    if (authRes.ok || authRes.status === 200) {
      return { connected: true, message: 'Connected to live Supabase project nxlaazpcbvzxmdboqlxe successfully.' };
    }

    if (serviceKey) {
      const restRes = await fetch(`${url}/rest/v1/`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
      });
      if (restRes.ok || restRes.status === 200) {
        return { connected: true, message: 'Connected to live Supabase project nxlaazpcbvzxmdboqlxe successfully via Service Key.' };
      }
    }

    return { connected: false, message: `Supabase returned HTTP status ${authRes.status}` };
  } catch (err: any) {
    return { connected: false, message: err.message || 'Connection failed' };
  }
}

