import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { Organization } from './interfaces';

export async function getCurrentUserAndOrganization(): Promise<{
  user: { id: string; email: string; role: 'admin' | 'conseiller' };
  organization: Organization;
} | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const adminClient = createAdminClient();

    // Recuperer l'user avec le rôle
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('id, email, role, organization_id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData?.organization_id) {
      console.error('Error fetching user:', userError);
      return null;
    }

    // Recuperer l'organization avec credentials
    const { data: orgData, error: orgError } = await adminClient
      .from('organizations')
      .select('id, name, google_credentials')
      .eq('id', userData.organization_id)
      .single();

    if (orgError || !orgData) {
      console.error('Error fetching organization:', orgError);
      return null;
    }

    return {
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role || 'conseiller',
      },
      organization: {
        id: orgData.id,
        name: orgData.name,
        google_credentials: orgData.google_credentials as Record<string, unknown> | undefined,
      } as Organization,
    };
  } catch (error) {
    // Error silencieuse pour Lighthouse - les erreurs auth sont gérées par les composants
    if (process.env.NODE_ENV === 'development') {
      console.error('getCurrentUserAndOrganization error:', error);
    }
    return null;
  }
}
