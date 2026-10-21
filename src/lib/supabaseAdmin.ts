import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxlaazpcbvzxmdboqlxe.supabase.co';
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bGFhenBjYnZ6eG1kYm9xbHhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjM5NTU2NywiZXhwIjoyMTA3OTcxNTY3fQ.-BysgmlNeo_hfzTGuZBDJFo_FCs4XtHzOwnLwyFg6ac';

// Server-side only admin client with service_role privileges
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(supabaseUrl && serviceRoleKey && !serviceRoleKey.includes('placeholder'));
}
