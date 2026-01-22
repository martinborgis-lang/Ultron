import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { createAdminClient } from '@/lib/supabase-admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Stages par défaut identiques à ceux dans le schéma database/
const DEFAULT_STAGES = [
  { name: 'Nouveau', slug: 'nouveau', color: '#6366f1', position: 0, is_won: false, is_lost: false },
  { name: 'En attente', slug: 'en_attente', color: '#f59e0b', position: 1, is_won: false, is_lost: false },
  { name: 'RDV Pris', slug: 'rdv_pris', color: '#10b981', position: 2, is_won: false, is_lost: false },
  { name: 'RDV Effectué', slug: 'rdv_effectue', color: '#3b82f6', position: 3, is_won: false, is_lost: false },
  { name: 'Négociation', slug: 'negociation', color: '#8b5cf6', position: 4, is_won: false, is_lost: false },
  { name: 'Gagné', slug: 'gagne', color: '#22c55e', position: 5, is_won: true, is_lost: false },
  { name: 'Perdu', slug: 'perdu', color: '#ef4444', position: 6, is_won: false, is_lost: true },
];

export async function POST(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (context.user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé - admin requis' }, { status: 403 });
    }

    const body = await request.json();
    const { organization_id, sync_all = false } = body;

    const adminClient = createAdminClient();

    let organizationsToSync = [];

    if (sync_all && context.user.role === 'admin') {
      // Super admin peut sync toutes les orgs
      const { data: orgs } = await adminClient
        .from('organizations')
        .select('id, name');

      organizationsToSync = orgs || [];
    } else if (organization_id) {
      // Admin peut sync son organisation ou une spécifique
      organizationsToSync = [{ id: organization_id }];
    } else {
      // Par défaut, sync l'organisation de l'admin
      organizationsToSync = [{ id: context.organization.id, name: context.organization.name }];
    }

    const results = [];

    for (const org of organizationsToSync) {
      try {
        logger.info(`Synchronisation stages pour organisation ${org.id}`);

        // Vérifier les stages existants
        const { data: existingStages } = await adminClient
          .from('pipeline_stages')
          .select('slug')
          .eq('organization_id', org.id);

        const existingSlugs = new Set((existingStages || []).map(s => s.slug));
        const stagesToCreate = DEFAULT_STAGES.filter(stage => !existingSlugs.has(stage.slug));

        let created = 0;
        let skipped = existingStages?.length || 0;

        if (stagesToCreate.length > 0) {
          const { data: newStages, error: insertError } = await adminClient
            .from('pipeline_stages')
            .insert(
              stagesToCreate.map(stage => ({
                organization_id: org.id,
                name: stage.name,
                slug: stage.slug,
                color: stage.color,
                position: stage.position,
                is_won: stage.is_won,
                is_lost: stage.is_lost,
              }))
            )
            .select();

          if (insertError) {
            throw insertError;
          }

          created = newStages?.length || 0;
        }

        results.push({
          organization_id: org.id,
          organization_name: 'name' in org ? (org.name || 'Unknown') : 'Unknown',
          stages_created: created,
          stages_existing: skipped,
          total_stages: created + skipped,
        });

      } catch (orgError) {
        logger.error(`Erreur sync stages pour org ${org.id}:`, orgError);
        results.push({
          organization_id: org.id,
          organization_name: 'name' in org ? (org.name || 'Unknown') : 'Unknown',
          error: orgError instanceof Error ? orgError.message : 'Erreur inconnue'
        });
      }
    }

    return NextResponse.json({
      success: true,
      organizations_synced: results.length,
      results
    });

  } catch (error) {
    logger.error('Erreur API sync-stages:', error);
    return NextResponse.json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (context.user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const adminClient = createAdminClient();

    // Récupérer toutes les organisations et leurs stages
    const { data: organizations } = await adminClient
      .from('organizations')
      .select(`
        id,
        name,
        pipeline_stages (
          id,
          slug,
          name,
          position
        )
      `)
      .order('name');

    const analysis = (organizations || []).map(org => {
      const stages = org.pipeline_stages || [];
      const stageSlugs = stages.map(s => s.slug);
      const expectedSlugs = DEFAULT_STAGES.map(s => s.slug);

      const missing = expectedSlugs.filter(slug => !stageSlugs.includes(slug));
      const extra = stageSlugs.filter(slug => !expectedSlugs.includes(slug));

      return {
        organization_id: org.id,
        organization_name: org.name,
        total_stages: stages.length,
        expected_stages: expectedSlugs.length,
        missing_stages: missing,
        extra_stages: extra,
        needs_sync: missing.length > 0,
        stage_list: stages.map(s => ({ slug: s.slug, name: s.name, position: s.position }))
      };
    });

    const needSync = analysis.filter(org => org.needs_sync);

    return NextResponse.json({
      total_organizations: analysis.length,
      organizations_need_sync: needSync.length,
      analysis,
      default_stages: DEFAULT_STAGES
    });

  } catch (error) {
    logger.error('Erreur GET sync-stages:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}