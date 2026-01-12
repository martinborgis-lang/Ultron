import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// GET /api/team - Liste des conseillers de l'organisation
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('auth_id', authUser.id)
      .single();

    if (!currentUser?.organization_id) {
      return NextResponse.json({ error: 'Organisation non trouvee' }, { status: 404 });
    }

    // Get all users in the organization
    const { data: teamMembers, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, gmail_credentials, avatar_url, is_active, created_at')
      .eq('organization_id', currentUser.organization_id)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Map users to include gmail_connected status
    const members = teamMembers?.map(member => ({
      id: member.id,
      email: member.email,
      full_name: member.full_name,
      role: member.role,
      is_active: member.is_active,
      avatar_url: member.avatar_url,
      gmail_connected: !!member.gmail_credentials,
      created_at: member.created_at,
    })) || [];

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Team fetch error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation de l\'equipe' },
      { status: 500 }
    );
  }
}

// POST /api/team - Ajouter un conseiller
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('auth_id', authUser.id)
      .single();

    if (!currentUser?.organization_id) {
      return NextResponse.json({ error: 'Organisation non trouvee' }, { status: 404 });
    }

    // Only admins can add team members
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acces refuse - Admin requis' }, { status: 403 });
    }

    const body = await request.json();
    const { email, full_name, role = 'conseiller' } = body;

    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Email et nom complet requis' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'conseiller'].includes(role)) {
      return NextResponse.json(
        { error: 'Role invalide' },
        { status: 400 }
      );
    }

    // Check if user already exists with this email
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe deja' },
        { status: 409 }
      );
    }

    // Create auth user using admin client
    const adminAuth = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Invite user by email - this sends an invitation email automatically
    const { data: inviteData, error: inviteError } = await adminAuth.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: {
        full_name,
        role,
      },
    });

    if (inviteError) {
      console.error('Invite user error:', inviteError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'invitation: ' + inviteError.message },
        { status: 500 }
      );
    }

    if (!inviteData.user) {
      return NextResponse.json(
        { error: 'Erreur lors de la creation du compte' },
        { status: 500 }
      );
    }

    // Create user record in users table
    const adminClient = createAdminClient();
    const { data: newUser, error: userError } = await adminClient
      .from('users')
      .insert({
        auth_id: inviteData.user.id,
        organization_id: currentUser.organization_id,
        email,
        full_name,
        role,
        is_active: true,
      })
      .select('id, email, full_name, role, is_active, created_at')
      .single();

    if (userError) {
      // Cleanup: delete auth user if DB insert fails
      await adminAuth.auth.admin.deleteUser(inviteData.user.id);
      throw userError;
    }

    return NextResponse.json({
      success: true,
      member: {
        ...newUser,
        gmail_connected: false,
      },
      message: `Invitation envoyee a ${email}`,
    });
  } catch (error) {
    console.error('Team member creation error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout du conseiller' },
      { status: 500 }
    );
  }
}
