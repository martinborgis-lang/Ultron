import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
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

    const { data: org } = await supabase
      .from('organizations')
      .select('plaquette_url')
      .eq('id', user.organization_id)
      .single();

    return NextResponse.json({ plaquette_id: org?.plaquette_url || null });
  } catch (error) {
    console.error('Get plaquette error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

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
    const { plaquette_id } = body;

    if (typeof plaquette_id !== 'string') {
      return NextResponse.json(
        { error: 'ID de plaquette invalide' },
        { status: 400 }
      );
    }

    // Store the Google Drive file ID (we'll construct the URL when needed)
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ plaquette_url: plaquette_id || null })
      .eq('id', user.organization_id);

    if (updateError) {
      console.error('Failed to update plaquette ID:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise a jour' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update plaquette error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
