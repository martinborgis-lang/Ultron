import { createClient } from '@supabase/supabase-js';

// Client admin qui bypass les RLS policies
// A utiliser UNIQUEMENT dans les API routes apres verification de l'auth
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
