import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-iedc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (key.includes('placeholder') || key.includes('demo-live-key') || key.includes('.demo')) return false;
  return true;
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

