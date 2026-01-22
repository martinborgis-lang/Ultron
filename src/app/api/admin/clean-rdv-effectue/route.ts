import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { createAdminClient } from '@/lib/supabase-admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (context.user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé - admin requis' }, { status: 403 });
    }

    const adminClient = createAdminClient();

    // 1. Trouver toutes les organisations qui ont le stage "rdv_effectue"
    const { data: rdvEffectueStages } = await adminClient
      .from('pipeline_stages')
      .select('id, organization_id, name')
      .eq('slug', 'rdv_effectue');

    if (!rdvEffectueStages || rdvEffectueStages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun stage "RDV Effectué" trouvé à supprimer',
        stages_found: 0,
        prospects_migrated: 0,
        stages_deleted: 0
      });
    }

    let totalProspectsMigrated = 0;
    let totalStagesDeleted = 0;
    const results = [];

    for (const stage of rdvEffectueStages) {
      try {
        logger.info(`Nettoyage stage RDV Effectué pour organisation ${stage.organization_id}`);

        // 2. Trouver le stage "negociation" pour cette organisation (où migrer les prospects)
        const { data: negociationStage } = await adminClient
          .from('pipeline_stages')
          .select('id')
          .eq('organization_id', stage.organization_id)
          .eq('slug', 'negociation')
          .single();

        if (!negociationStage) {
          throw new Error(`Stage "negociation" non trouvé pour organisation ${stage.organization_id}`);
        }

        // 3. Migrer tous les prospects de "rdv_effectue" vers "negociation"
        const { data: migratedProspects, error: migrateError } = await adminClient
          .from('crm_prospects')
          .update({
            stage_id: negociationStage.id,
            stage_slug: 'negociation'
          })
          .eq('stage_id', stage.id)
          .select('id, first_name, last_name');

        if (migrateError) {
          throw migrateError;
        }

        const prospectsMigrated = migratedProspects?.length || 0;
        totalProspectsMigrated += prospectsMigrated;

        // 4. Supprimer le stage "rdv_effectue"
        const { error: deleteError } = await adminClient
          .from('pipeline_stages')
          .delete()
          .eq('id', stage.id);

        if (deleteError) {
          throw deleteError;
        }

        totalStagesDeleted++;

        results.push({
          organization_id: stage.organization_id,
          prospects_migrated: prospectsMigrated,
          stage_deleted: true,
          prospects_details: migratedProspects?.map(p => `${p.first_name} ${p.last_name}`) || []
        });

        logger.info(`✓ Organisation ${stage.organization_id}: ${prospectsMigrated} prospects migrés vers négociation, stage supprimé`);

      } catch (orgError) {
        logger.error(`Erreur nettoyage pour organisation ${stage.organization_id}:`, orgError);
        results.push({
          organization_id: stage.organization_id,
          error: orgError instanceof Error ? orgError.message : 'Erreur inconnue'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Nettoyage terminé: ${totalStagesDeleted} stage(s) supprimé(s), ${totalProspectsMigrated} prospect(s) migré(s)`,
      stages_found: rdvEffectueStages.length,
      stages_deleted: totalStagesDeleted,
      prospects_migrated: totalProspectsMigrated,
      results
    });

  } catch (error) {
    logger.error('Erreur API clean-rdv-effectue:', error);
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

    // Analyser les stages "rdv_effectue" existants
    const { data: rdvEffectueStages } = await adminClient
      .from('pipeline_stages')
      .select('id, organization_id, name')
      .eq('slug', 'rdv_effectue');

    const analysis = [];

    for (const stage of rdvEffectueStages || []) {
      // Récupérer le nom de l'organisation
      const { data: org } = await adminClient
        .from('organizations')
        .select('name')
        .eq('id', stage.organization_id)
        .single();

      // Récupérer les prospects affectés
      const { data: prospects } = await adminClient
        .from('crm_prospects')
        .select('id, first_name, last_name, email')
        .eq('stage_id', stage.id);

      analysis.push({
        organization_id: stage.organization_id,
        organization_name: org?.name || 'Unknown',
        stage_id: stage.id,
        stage_name: stage.name,
        prospects_count: prospects?.length || 0,
        prospects_list: (prospects || []).map(p => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          email: p.email
        }))
      });
    }

    return NextResponse.json({
      stages_found: analysis.length,
      total_prospects_affected: analysis.reduce((sum, org) => sum + org.prospects_count, 0),
      analysis,
      action_needed: analysis.length > 0,
      migration_plan: analysis.length > 0 ? 'Tous les prospects seront migrés vers le stage "Négociation"' : null
    });

  } catch (error) {
    logger.error('Erreur GET clean-rdv-effectue:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}