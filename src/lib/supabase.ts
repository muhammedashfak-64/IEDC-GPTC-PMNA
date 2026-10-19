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
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!isSupabaseConfigured()) {
      return {
        connected: false,
        message: 'Live Supabase Anon Key is not configured yet. Using local fallback persistence.'
      };
    }
    const res = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: key! }
    });
    if (res.ok || res.status === 200) {
      return { connected: true, message: 'Connected to live Supabase project successfully.' };
    }
    return { connected: false, message: `Supabase returned HTTP status ${res.status}` };
  } catch (err: any) {
    return { connected: false, message: err.message || 'Connection failed' };
  }
}

