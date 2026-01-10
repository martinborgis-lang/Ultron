import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { data: user } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('auth_id', authUser.id)
      .single();

    if (!user?.organization_id) {
      return NextResponse.json({ error: 'Organisation non trouvee' }, { status: 404 });
    }

    const body = await request.json();
    const { sheet_id } = body;

    if (typeof sheet_id !== 'string') {
      return NextResponse.json(
        { error: 'ID de Sheet invalide' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('organizations')
      .update({ google_sheet_id: sheet_id || null })
      .eq('id', user.organization_id);

    if (updateError) {
      console.error('Failed to update sheet ID:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise a jour' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update sheet ID error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { data: user } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_id', authUser.id)
      .single();

    if (!user?.organization_id) {
      return NextResponse.json({ error: 'Organisation non trouvee' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('organizations')
      .update({ google_credentials: null })
      .eq('id', user.organization_id);

    if (updateError) {
      console.error('Failed to disconnect Google:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la deconnexion' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disconnect Google error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
