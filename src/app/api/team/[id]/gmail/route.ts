import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// DELETE /api/team/[id]/gmail - Disconnect Gmail for a user
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
      .select('id, organization_id')
      .eq('auth_id', authUser.id)
      .single();

    if (!currentUser?.organization_id) {
      return NextResponse.json({ error: 'Organisation non trouvee' }, { status: 404 });
    }

    // Users can only disconnect their own Gmail
    if (currentUser.id !== id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez deconnecter que votre propre Gmail' },
        { status: 403 }
      );
    }

    // Clear gmail_credentials
    const adminClient = createAdminClient();
    const { error: updateError } = await adminClient
      .from('users')
      .update({ gmail_credentials: null })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Gmail disconnect error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la deconnexion Gmail' },
      { status: 500 }
    );
  }
}
