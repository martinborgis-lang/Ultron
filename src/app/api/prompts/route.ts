import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
      .select('prompt_qualification, prompt_synthese, prompt_rappel, prompt_plaquette')
      .eq('id', user.organization_id)
      .single();

    return NextResponse.json({
      prompts: {
        prompt_qualification: org?.prompt_qualification,
        prompt_synthese: org?.prompt_synthese,
        prompt_rappel: org?.prompt_rappel,
        prompt_plaquette: org?.prompt_plaquette,
      },
    });
  } catch (error) {
    console.error('Prompts fetch error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation des prompts' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    // Seuls les admins peuvent modifier les prompts
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Seuls les admins peuvent modifier les prompts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, config } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Type requis' },
        { status: 400 }
      );
    }

    // Valider le type (accepte prompt_synthese ou synthese)
    const validTypes = ['prompt_qualification', 'prompt_synthese', 'prompt_rappel', 'prompt_plaquette'];
    const normalizedType = type.startsWith('prompt_') ? type : `prompt_${type}`;

    if (!validTypes.includes(normalizedType)) {
      return NextResponse.json(
        { error: 'Type de prompt invalide' },
        { status: 400 }
      );
    }

    // Mettre à jour avec le config object
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ [normalizedType]: config })
      .eq('id', user.organization_id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Prompt update error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise a jour du prompt' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { type } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Type requis' },
        { status: 400 }
      );
    }

    const validTypes = ['qualification', 'synthese', 'rappel', 'plaquette'] as const;
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Type de prompt invalide' },
        { status: 400 }
      );
    }

    // Reset to default
    const updateData: Record<string, string | null> = {};
    updateData[`prompt_${type}`] = null;

    const { error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', user.organization_id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'Prompt reset to default',
    });
  } catch (error) {
    console.error('Prompt reset error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la reinitialisation du prompt' },
      { status: 500 }
    );
  }
}
