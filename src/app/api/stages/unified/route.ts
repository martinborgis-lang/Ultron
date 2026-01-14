import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { createAdminClient } from '@/lib/supabase-admin';
import { SHEET_STAGES, UnifiedStage } from '@/types/pipeline';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { organization } = context;

    // Mode Sheet : retourner les stages fixes
    if (organization.data_mode === 'sheet') {
      return NextResponse.json(SHEET_STAGES);
    }

    // Mode CRM : récupérer depuis la base
    const supabase = createAdminClient();

    const { data: stages, error } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('organization_id', organization.id)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching stages:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    // Mapper vers le format UnifiedStage
    const unifiedStages: UnifiedStage[] = (stages || []).map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      color: s.color || '#6366f1',
      position: s.position,
      is_won: s.is_won || false,
      is_lost: s.is_lost || false,
    }));

    return NextResponse.json(unifiedStages);
  } catch (error) {
    console.error('Error in unified stages API:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
