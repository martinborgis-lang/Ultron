import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();

    // Récupérer l'organisation de l'utilisateur
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('organization_id, role')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Récupérer la config de scoring
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('scoring_config')
      .eq('id', userData.organization_id)
      .single();

    return NextResponse.json({ config: org?.scoring_config || null });
  } catch (error: unknown) {
    console.error('Error fetching scoring config:', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();

    // Vérifier que l'utilisateur est admin
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('organization_id, role')
      .eq('auth_id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { config } = body;

    // Valider la config
    const totalPoids = config.poids_analyse_ia + config.poids_patrimoine + config.poids_revenus;
    if (totalPoids !== 100) {
      return NextResponse.json(
        { error: 'La somme des poids doit être égale à 100%' },
        { status: 400 }
      );
    }

    // Mettre à jour
    const { error } = await supabaseAdmin
      .from('organizations')
      .update({ scoring_config: config })
      .eq('id', userData.organization_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error updating scoring config:', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
