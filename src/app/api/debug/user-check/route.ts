import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST /api/debug/user-check - Vérifier l'état d'un utilisateur par email
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Vérifier l'utilisateur dans la table users
    const { data: user, error: userError } = await adminClient
      .from('users')
      .select(`
        id,
        auth_id,
        organization_id,
        email,
        full_name,
        role,
        is_active,
        created_at,
        organization:organizations(
          id,
          name,
          slug,
          created_at
        )
      `)
      .eq('email', email)
      .single();

    // Vérifier également dans Supabase Auth
    let authUser = null;
    try {
      const { data: authUsers } = await adminClient.auth.admin.listUsers();
      authUser = authUsers.users.find(u => u.email === email);
    } catch (authError) {
      console.error('Erreur récupération auth user:', authError);
    }

    // Compter les prospects et autres données si l'organisation existe
    let orgStats = null;
    if (user?.organization_id) {
      const { data: prospectCount } = await adminClient
        .from('crm_prospects')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', user.organization_id);

      const { data: stageCount } = await adminClient
        .from('pipeline_stages')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', user.organization_id);

      orgStats = {
        prospects_count: prospectCount || 0,
        stages_count: stageCount || 0
      };
    }

    const result = {
      search_email: email,
      user_in_db: !!user,
      user_data: user || null,
      auth_user_exists: !!authUser,
      auth_user_data: authUser ? {
        id: authUser.id,
        email: authUser.email,
        email_confirmed_at: authUser.email_confirmed_at,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at
      } : null,
      organization_stats: orgStats,
      diagnosis: getDiagnosis(user, authUser)
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Erreur debug user check:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification utilisateur' },
      { status: 500 }
    );
  }
}

function getDiagnosis(user: any, authUser: any): string {
  if (!authUser) {
    return "❌ L'utilisateur n'existe pas dans Supabase Auth";
  }

  if (!authUser.email_confirmed_at) {
    return "⚠️ L'utilisateur existe mais n'a pas confirmé son email";
  }

  if (!user) {
    return "🔴 BUG: L'utilisateur a confirmé son email mais n'a pas de profil dans la DB (n'est jamais passé par /complete-registration)";
  }

  if (!user.organization_id) {
    return "🔴 BUG: L'utilisateur a un profil mais pas d'organisation rattachée";
  }

  return "✅ L'utilisateur est correctement configuré";
}