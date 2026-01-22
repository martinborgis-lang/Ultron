import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { createAdminClient } from '@/lib/supabase-admin';
import { logger } from '@/lib/logger';
import { DEFAULT_PROMPTS } from '@/lib/anthropic';

export const dynamic = 'force-dynamic';

// Configuration par défaut des prompts pour les nouvelles organisations
const DEFAULT_PROMPT_CONFIGS = {
  prompt_qualification: {
    useAI: true,
    systemPrompt: DEFAULT_PROMPTS.analyseQualification,
    userPromptTemplate: `Informations du prospect à qualifier:

Prénom: {{prenom}}
Nom: {{nom}}
Email: {{email}}
Téléphone: {{telephone}}
Âge: {{age}}
Situation professionnelle: {{situation_pro}}
Revenus: {{revenus}}
Patrimoine: {{patrimoine}}
Besoins exprimés: {{besoins}}
Notes de l'appel: {{notes_appel}}`,
    fixedEmailSubject: '',
    fixedEmailBody: ''
  },
  prompt_synthese: {
    useAI: true,
    systemPrompt: DEFAULT_PROMPTS.synthese,
    userPromptTemplate: `Rédige un email de synthèse pour :
- Prénom : {{prenom}}
- Nom : {{nom}}
- Qualification : {{qualification}}
- Besoins : {{besoins}}
- Notes de l'appel : {{notes_appel}}
- Date du RDV : {{date_rdv}}

L'appel de prospection vient d'avoir lieu. Le RDV est à la date mentionnée (futur).`,
    fixedEmailSubject: '',
    fixedEmailBody: ''
  },
  prompt_rappel: {
    useAI: true,
    systemPrompt: DEFAULT_PROMPTS.rappel,
    userPromptTemplate: `Rédige un email de rappel pour le RDV demain :
- Prénom : {{prenom}}
- Nom : {{nom}}
- Date du RDV : {{date_rdv}}
- Besoins : {{besoins}}`,
    fixedEmailSubject: '',
    fixedEmailBody: ''
  },
  prompt_plaquette: {
    useAI: true,
    systemPrompt: DEFAULT_PROMPTS.plaquette,
    userPromptTemplate: `Rédige un email sobre pour accompagner la plaquette :
- Prénom : {{prenom}}
- Nom : {{nom}}
- Besoins : {{besoins}}

Email court et professionnel pour présenter la plaquette en pièce jointe.`,
    fixedEmailSubject: '',
    fixedEmailBody: ''
  }
};

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

    let organizationsToUpdate: any[] = [];

    if (force_all && context.user.role === 'admin') {
      // Super admin peut initialiser toutes les orgs
      const { data: orgs } = await adminClient
        .from('organizations')
        .select('id, name, prompt_qualification, prompt_synthese, prompt_rappel, prompt_plaquette');

      organizationsToUpdate = orgs || [];
    } else if (organization_id) {
      // Admin peut initialiser une org spécifique
      const { data: org } = await adminClient
        .from('organizations')
        .select('id, name, prompt_qualification, prompt_synthese, prompt_rappel, prompt_plaquette')
        .eq('id', organization_id)
        .single();

      if (org) organizationsToUpdate = [org];
    } else {
      // Par défaut, initialiser l'organisation de l'admin
      const { data: org } = await adminClient
        .from('organizations')
        .select('id, name, prompt_qualification, prompt_synthese, prompt_rappel, prompt_plaquette')
        .eq('id', context.organization.id)
        .single();

      if (org) organizationsToUpdate = [org];
    }

    const results = [];

    for (const org of organizationsToUpdate) {
      try {
        logger.info(`Initialisation prompts pour organisation ${org.id}`);

        const updates: any = {};
        let promptsAdded = 0;

        // Vérifier et ajouter les prompts manquants
        if (!org.prompt_qualification) {
          updates.prompt_qualification = DEFAULT_PROMPT_CONFIGS.prompt_qualification;
          promptsAdded++;
        }
        if (!org.prompt_synthese) {
          updates.prompt_synthese = DEFAULT_PROMPT_CONFIGS.prompt_synthese;
          promptsAdded++;
        }
        if (!org.prompt_rappel) {
          updates.prompt_rappel = DEFAULT_PROMPT_CONFIGS.prompt_rappel;
          promptsAdded++;
        }
        if (!org.prompt_plaquette) {
          updates.prompt_plaquette = DEFAULT_PROMPT_CONFIGS.prompt_plaquette;
          promptsAdded++;
        }

        if (promptsAdded > 0) {
          const { error: updateError } = await adminClient
            .from('organizations')
            .update(updates)
            .eq('id', org.id);

          if (updateError) {
            throw updateError;
          }

          logger.info(`✅ Organisation ${org.id}: ${promptsAdded} prompts initialisés`);
        }

        results.push({
          organization_id: org.id,
          organization_name: org.name || 'Unknown',
          prompts_added: promptsAdded,
          prompts_existing: 4 - promptsAdded,
          total_prompts: 4,
          success: true
        });

      } catch (orgError) {
        logger.error(`❌ Erreur initialisation prompts pour org ${org.id}:`, orgError);
        results.push({
          organization_id: org.id,
          organization_name: org.name || 'Unknown',
          error: orgError instanceof Error ? orgError.message : 'Erreur inconnue',
          success: false
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalPromptsAdded = results.reduce((sum, r) => sum + (r.prompts_added || 0), 0);

    return NextResponse.json({
      success: true,
      message: `Initialisation terminée: ${successCount}/${results.length} organisations`,
      organizations_updated: successCount,
      total_prompts_added: totalPromptsAdded,
      results
    });

  } catch (error) {
    logger.error('Erreur API init-prompts:', error);
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

    // Analyser les organisations avec prompts manquants
    const { data: organizations } = await adminClient
      .from('organizations')
      .select('id, name, prompt_qualification, prompt_synthese, prompt_rappel, prompt_plaquette')
      .order('name');

    const analysis = (organizations || []).map(org => {
      const prompts = [
        { name: 'Qualification', exists: !!org.prompt_qualification },
        { name: 'Synthèse', exists: !!org.prompt_synthese },
        { name: 'Rappel', exists: !!org.prompt_rappel },
        { name: 'Plaquette', exists: !!org.prompt_plaquette },
      ];

      const existingCount = prompts.filter(p => p.exists).length;
      const missingPrompts = prompts.filter(p => !p.exists).map(p => p.name);

      return {
        organization_id: org.id,
        organization_name: org.name,
        existing_prompts: existingCount,
        total_prompts: 4,
        missing_prompts: missingPrompts,
        needs_init: missingPrompts.length > 0,
        status: missingPrompts.length === 0 ? 'complete' : 'incomplete'
      };
    });

    const needsInit = analysis.filter(org => org.needs_init);

    return NextResponse.json({
      total_organizations: analysis.length,
      organizations_need_init: needsInit.length,
      organizations_complete: analysis.length - needsInit.length,
      analysis,
      default_prompts_available: Object.keys(DEFAULT_PROMPT_CONFIGS)
    });

  } catch (error) {
    logger.error('Erreur GET init-prompts:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}