import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let adminClient: SupabaseClient | null = null;

// Client admin qui bypass les RLS policies
// A utiliser UNIQUEMENT dans les API routes apres verification de l'auth
// Implémente le pattern Singleton pour éviter l'épuisement des connexions
export function createAdminClient(): SupabaseClient {
  if (adminClient) {
    return adminClient;
  }

  adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}

// Pour les tests ou reset
export function resetAdminClient(): void {
  adminClient = null;
}
