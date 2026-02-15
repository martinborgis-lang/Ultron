import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { createAdminClient } from '@/lib/supabase-admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Nouveaux stages RDV à ajouter
const NEW_RDV_STAGES = [
  { name: 'RDV 2 Programmé', slug: 'rdv_2_programme', position: 2.1, color: '#8B5CF6', is_won: false, is_lost: false },
  { name: 'RDV 2 Effectué', slug: 'rdv_2_effectue', position: 2.2, color: '#7C3AED', is_won: false, is_lost: false },
  { name: 'RDV 3 Programmé', slug: 'rdv_3_programme', position: 2.3, color: '#6D28D9', is_won: false, is_lost: false },
  { name: 'RDV 3 Effectué', slug: 'rdv_3_effectue', position: 2.4, color: '#5B21B6', is_won: false, is_lost: false },
  { name: 'Proposition Envoyée', slug: 'proposition_envoyee', position: 2.5, color: '#F59E0B', is_won: false, is_lost: false },
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

    let organizationsToMigrate = [];

    if (sync_all && context.user.role === 'admin') {
      // Super admin peut migrer toutes les orgs
      const { data: orgs } = await adminClient
        .from('organizations')
        .select('id, name');

      organizationsToMigrate = orgs || [];
    } else if (organization_id) {
      // Admin peut migrer son organisation ou une spécifique
      organizationsToMigrate = [{ id: organization_id }];
    } else {
      // Par défaut, migrer l'organisation de l'admin
      organizationsToMigrate = [{ id: context.organization.id, name: context.organization.name }];
    }

    const results = [];

    for (const org of organizationsToMigrate) {
      try {
        logger.info(`Migration stages RDV pour organisation ${org.id}`);

        // Vérifier les stages existants
        const { data: existingStages } = await adminClient
          .from('pipeline_stages')
          .select('slug')
          .eq('organization_id', org.id);

        const existingSlugs = new Set((existingStages || []).map(s => s.slug));

        // Filtrer les stages qui n'existent pas encore
        const stagesToCreate = NEW_RDV_STAGES.filter(stage => !existingSlugs.has(stage.slug));

        let created = 0;
        let skipped = NEW_RDV_STAGES.length - stagesToCreate.length;

        if (stagesToCreate.length > 0) {
          // Insérer les nouveaux stages
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

        // Mettre à jour les positions des stages existants pour maintenir l'ordre
        const { error: updateError } = await adminClient
          .from('pipeline_stages')
          .update({
            position: 3.0,
            updated_at: new Date().toISOString()
          })
          .eq('organization_id', org.id)
          .eq('slug', 'negociation');

        if (updateError) {
          logger.warn(`Erreur mise à jour position négociation org ${org.id}:`, updateError);
        }

        // Mettre à jour position stage Gagné
        await adminClient
          .from('pipeline_stages')
          .update({
            position: 4.0,
            updated_at: new Date().toISOString()
          })
          .eq('organization_id', org.id)
          .eq('slug', 'gagne');

        // Mettre à jour position stage Perdu
        await adminClient
          .from('pipeline_stages')
          .update({
            position: 5.0,
            updated_at: new Date().toISOString()
          })
          .eq('organization_id', org.id)
          .eq('slug', 'perdu');

        results.push({
          organization_id: org.id,
          organization_name: 'name' in org ? (org.name || 'Unknown') : 'Unknown',
          stages_created: created,
          stages_existing: skipped,
          total_new_stages: NEW_RDV_STAGES.length,
          success: true
        });

      } catch (orgError) {
        logger.error(`Erreur migration org ${org.id}:`, orgError);
        results.push({
          organization_id: org.id,
          organization_name: 'name' in org ? (org.name || 'Unknown') : 'Unknown',
          error: orgError instanceof Error ? orgError.message : 'Erreur inconnue',
          success: false
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Migration stages RDV terminée - ${successCount} succès, ${errorCount} erreurs`,
      organizations_migrated: results.length,
      results
    });

  } catch (error) {
    logger.error('Erreur API migrate-stages-rdv:', error);
    return NextResponse.json({
      error: 'Erreur serveur lors de la migration',
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

    // Analyser l'état des stages RDV par organisation
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

    const newStagesSlugs = NEW_RDV_STAGES.map(s => s.slug);

    const analysis = (organizations || []).map(org => {
      const stages = org.pipeline_stages || [];
      const stageSlugs = stages.map(s => s.slug);

      const hasNewStages = newStagesSlugs.filter(slug => stageSlugs.includes(slug));
      const missingStages = newStagesSlugs.filter(slug => !stageSlugs.includes(slug));

      return {
        organization_id: org.id,
        organization_name: org.name,
        total_stages: stages.length,
        has_rdv_stages: hasNewStages,
        missing_rdv_stages: missingStages,
        needs_migration: missingStages.length > 0,
        rdv_stages_count: hasNewStages.length
      };
    });

    const needMigration = analysis.filter(org => org.needs_migration);

    return NextResponse.json({
      total_organizations: analysis.length,
      organizations_need_migration: needMigration.length,
      new_stages_to_add: NEW_RDV_STAGES,
      analysis
    });

  } catch (error) {
    logger.error('Erreur GET migrate-stages-rdv:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}