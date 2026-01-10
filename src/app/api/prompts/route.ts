import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROMPTS } from '@/lib/anthropic';
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

    const prompts = {
      qualification: org?.prompt_qualification || DEFAULT_PROMPTS.qualification,
      synthese: org?.prompt_synthese || DEFAULT_PROMPTS.synthese,
      rappel: org?.prompt_rappel || DEFAULT_PROMPTS.rappel,
      plaquette: org?.prompt_plaquette || DEFAULT_PROMPTS.plaquette,
    };

    return NextResponse.json({ prompts });
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
      .select('organization_id')
      .eq('auth_id', authUser.id)
      .single();

    if (!user?.organization_id) {
      return NextResponse.json({ error: 'Organisation non trouvee' }, { status: 404 });
    }

    const body = await request.json();
    const { type, prompt } = body;

    if (!type || !prompt) {
      return NextResponse.json(
        { error: 'Type et prompt requis' },
        { status: 400 }
      );
    }

    const validTypes = ['qualification', 'synthese', 'rappel', 'plaquette'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Type de prompt invalide' },
        { status: 400 }
      );
    }

    const updateData: Record<string, string> = {};
    updateData[`prompt_${type}`] = prompt;

    const { error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
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
      defaultPrompt: DEFAULT_PROMPTS[type as keyof typeof DEFAULT_PROMPTS],
    });
  } catch (error) {
    console.error('Prompt reset error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la reinitialisation du prompt' },
      { status: 500 }
    );
  }
}
