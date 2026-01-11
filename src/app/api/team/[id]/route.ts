import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// PATCH /api/team/[id] - Modifier un conseiller
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Only admins can modify team members
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acces refuse - Admin requis' }, { status: 403 });
    }

    // Check target user belongs to same organization
    const { data: targetUser } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('id', id)
      .single();

    if (!targetUser || targetUser.organization_id !== currentUser.organization_id) {
      return NextResponse.json({ error: 'Conseiller non trouve' }, { status: 404 });
    }

    const body = await request.json();
    const { full_name, role, is_active } = body;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (role !== undefined) {
      if (!['admin', 'conseiller'].includes(role)) {
        return NextResponse.json({ error: 'Role invalide' }, { status: 400 });
      }
      updateData.role = role;
    }
    if (is_active !== undefined) updateData.is_active = is_active;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Aucune modification fournie' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: updatedUser, error: updateError } = await adminClient
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, email, full_name, role, gmail_credentials, is_active, created_at')
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      member: {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        role: updatedUser.role,
        is_active: updatedUser.is_active,
        gmail_connected: !!updatedUser.gmail_credentials,
        created_at: updatedUser.created_at,
      },
    });
  } catch (error) {
    console.error('Team member update error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la modification du conseiller' },
      { status: 500 }
    );
  }
}

// DELETE /api/team/[id] - Supprimer un conseiller
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('id, organization_id, role')
      .eq('auth_id', authUser.id)
      .single();

    if (!currentUser?.organization_id) {
      return NextResponse.json({ error: 'Organisation non trouvee' }, { status: 404 });
    }

    // Only admins can delete team members
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acces refuse - Admin requis' }, { status: 403 });
    }

    // Prevent self-deletion
    if (currentUser.id === id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      );
    }

    // Check target user belongs to same organization
    const adminClient = createAdminClient();
    const { data: targetUser } = await adminClient
      .from('users')
      .select('id, auth_id, organization_id')
      .eq('id', id)
      .single();

    if (!targetUser || targetUser.organization_id !== currentUser.organization_id) {
      return NextResponse.json({ error: 'Conseiller non trouve' }, { status: 404 });
    }

    // Delete user from users table
    const { error: deleteError } = await adminClient
      .from('users')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    // Delete auth user
    if (targetUser.auth_id) {
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

      await adminAuth.auth.admin.deleteUser(targetUser.auth_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Team member deletion error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du conseiller' },
      { status: 500 }
    );
  }
}
