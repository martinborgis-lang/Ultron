import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { createAdminClient } from '@/lib/supabase-admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// STAGES EXACTS VOULUS (6 stages comme Borgis&Co)
const CORRECT_STAGES = [
  { name: 'Nouveau', slug: 'nouveau', color: '#6366f1', position: 0, is_won: false, is_lost: false },
  { name: 'En attente', slug: 'en_attente', color: '#f59e0b', position: 1, is_won: false, is_lost: false },
  { name: 'RDV Pris', slug: 'rdv_pris', color: '#10b981', position: 2, is_won: false, is_lost: false },
  { name: 'Négociation', slug: 'negociation', color: '#8b5cf6', position: 3, is_won: false, is_lost: false },
  { name: 'Gagné', slug: 'gagne', color: '#22c55e', position: 4, is_won: true, is_lost: false },
  { name: 'Perdu', slug: 'perdu', color: '#ef4444', position: 5, is_won: false, is_lost: true },
];

const CORRECT_SLUGS = CORRECT_STAGES.map(s => s.slug);

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
    const { organization_id, force_all = false } = body;

    const adminClient = createAdminClient();

    let organizationsToFix = [];

    if (force_all) {
      // Forcer toutes les orgs
      const { data: orgs } = await adminClient
        .from('organizations')
        .select('id, name');

      organizationsToFix = orgs || [];
    } else if (organization_id) {
      // Forcer une org spécifique
      organizationsToFix = [{ id: organization_id }];
    } else {
      return NextResponse.json({ error: 'organization_id ou force_all requis' }, { status: 400 });
    }

    const results = [];

    for (const org of organizationsToFix) {
      try {
        logger.info(`🧹 NETTOYAGE FORCÉ organisation ${org.id}`);

        // 1. Récupérer tous les stages actuels
        const { data: currentStages } = await adminClient
          .from('pipeline_stages')
          .select('id, slug, name')
          .eq('organization_id', org.id);

        // 2. Identifier les stages à garder, supprimer, créer
        const currentSlugs = new Set((currentStages || []).map(s => s.slug));
        const stagesToDelete = (currentStages || []).filter(s => !CORRECT_SLUGS.includes(s.slug));
        const stagesToCreate = CORRECT_STAGES.filter(s => !currentSlugs.has(s.slug));

        let deleted = 0;
        let created = 0;
        let prospectsMigrated = 0;

        // 3. MIGRER LES PROSPECTS des stages à supprimer vers "nouveau"
        if (stagesToDelete.length > 0) {
          // Trouver le stage "nouveau" de cette org
          const nouveauStage = (currentStages || []).find(s => s.slug === 'nouveau');

          if (nouveauStage) {
            for (const stageToDelete of stagesToDelete) {
              // Migrer les prospects vers "nouveau"
              const { data: migratedProspects } = await adminClient
                .from('crm_prospects')
                .update({
                  stage_id: nouveauStage.id,
                  stage_slug: 'nouveau'
                })
                .eq('stage_id', stageToDelete.id)
                .select('id');

              prospectsMigrated += migratedProspects?.length || 0;
              logger.info(`  Migré ${migratedProspects?.length || 0} prospects de "${stageToDelete.name}" vers "Nouveau"`);
            }
          }

          // Supprimer les stages en trop
          const { error: deleteError } = await adminClient
            .from('pipeline_stages')
            .delete()
            .in('id', stagesToDelete.map(s => s.id));

          if (deleteError) {
            throw deleteError;
          }

          deleted = stagesToDelete.length;
          logger.info(`  🗑️ Supprimé ${deleted} stages en trop: ${stagesToDelete.map(s => s.name).join(', ')}`);
        }

        // 4. CRÉER les stages manquants
        if (stagesToCreate.length > 0) {
          const { data: newStages, error: createError } = await adminClient
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

          if (createError) {
            throw createError;
          }

          created = newStages?.length || 0;
          logger.info(`  ➕ Créé ${created} stages manquants: ${stagesToCreate.map(s => s.name).join(', ')}`);
        }

        // 5. RÉORGANISER les positions des stages restants
        const { data: finalStages } = await adminClient
          .from('pipeline_stages')
          .select('id, slug')
          .eq('organization_id', org.id);

        if (finalStages) {
          for (const correctStage of CORRECT_STAGES) {
            const stage = finalStages.find(s => s.slug === correctStage.slug);
            if (stage) {
              await adminClient
                .from('pipeline_stages')
                .update({
                  position: correctStage.position,
                  name: correctStage.name,
                  color: correctStage.color
                })
                .eq('id', stage.id);
            }
          }
        }

        results.push({
          organization_id: org.id,
          organization_name: 'name' in org ? (org.name || 'Unknown') : 'Unknown',
          stages_deleted: deleted,
          stages_created: created,
          prospects_migrated: prospectsMigrated,
          final_stages_count: 6,
          stages_cleaned: stagesToDelete.map(s => s.name),
          stages_added: stagesToCreate.map(s => s.name),
          success: true
        });

        logger.info(`✅ Organisation ${org.id} nettoyée: ${deleted} supprimés, ${created} créés, ${prospectsMigrated} prospects migrés`);

      } catch (orgError) {
        logger.error(`❌ Erreur nettoyage organisation ${org.id}:`, orgError);
        results.push({
          organization_id: org.id,
          organization_name: 'name' in org ? (org.name || 'Unknown') : 'Unknown',
          error: orgError instanceof Error ? orgError.message : 'Erreur inconnue',
          success: false
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalDeleted = results.reduce((sum, r) => sum + (r.stages_deleted || 0), 0);
    const totalMigrated = results.reduce((sum, r) => sum + (r.prospects_migrated || 0), 0);

    return NextResponse.json({
      success: true,
      message: `🧹 NETTOYAGE TERMINÉ: ${successCount}/${results.length} organisations nettoyées`,
      organizations_fixed: successCount,
      total_stages_deleted: totalDeleted,
      total_prospects_migrated: totalMigrated,
      results
    });

  } catch (error) {
    logger.error('Erreur API force-stages:', error);
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

    // Analyser les organisations avec des stages incorrects
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
      const currentCount = stages.length;

      const extraStages = stages.filter(s => !CORRECT_SLUGS.includes(s.slug));
      const missingStages = CORRECT_STAGES.filter(s => !stageSlugs.includes(s.slug));

      const needsCleaning = extraStages.length > 0 || missingStages.length > 0 || currentCount !== 6;

      return {
        organization_id: org.id,
        organization_name: org.name,
        current_stages_count: currentCount,
        expected_stages_count: 6,
        extra_stages: extraStages.map(s => s.name),
        missing_stages: missingStages.map(s => s.name),
        needs_cleaning: needsCleaning,
        status: currentCount === 6 && !needsCleaning ? 'correct' : 'needs_fix',
        stage_list: stages.map(s => ({ slug: s.slug, name: s.name, position: s.position }))
      };
    });

    const needsCleaning = analysis.filter(org => org.needs_cleaning);

    return NextResponse.json({
      total_organizations: analysis.length,
      organizations_need_cleaning: needsCleaning.length,
      organizations_correct: analysis.length - needsCleaning.length,
      expected_stages: CORRECT_STAGES.map(s => ({ name: s.name, slug: s.slug, position: s.position })),
      analysis
    });

  } catch (error) {
    logger.error('Erreur GET force-stages:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}