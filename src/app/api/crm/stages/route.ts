import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET : Liste des stages
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_id', user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 404 });
    }

    // Récupérer les stages avec le count de prospects par stage
    const { data: stages, error } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('position', { ascending: true });

    if (error) throw error;

    // Récupérer les counts par stage
    const { data: counts } = await supabase
      .from('crm_prospects')
      .select('stage_slug')
      .eq('organization_id', userData.organization_id);

    const countByStage = (counts || []).reduce((acc: Record<string, number>, p) => {
      acc[p.stage_slug] = (acc[p.stage_slug] || 0) + 1;
      return acc;
    }, {});

    const stagesWithCount = stages?.map(stage => ({
      ...stage,
      prospects_count: countByStage[stage.slug] || 0
    }));

    return NextResponse.json(stagesWithCount);

  } catch (error: any) {
    console.error('Error fetching stages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
