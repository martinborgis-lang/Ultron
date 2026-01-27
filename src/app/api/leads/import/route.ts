import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { LeadImportRequest, LeadImportResponse } from '@/types/leads';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // 2. Récupérer l'organisation de l'utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, id, full_name')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData?.organization_id) {
      console.error('[Lead Import] User error:', userError);
      return NextResponse.json(
        { error: 'Organisation non trouvée' },
        { status: 400 }
      );
    }

    const organizationId = userData.organization_id;
    const userId = userData.id;

    // 3. Parser la requête
    const body: LeadImportRequest = await request.json();
    const { leadIds } = body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: 'Aucun lead sélectionné' },
        { status: 400 }
      );
    }

    console.log('[Lead Import] Importing leads:', { leadIds, organizationId, userId });

    // 4. Récupérer les leads à importer
    const { data: leads, error: leadsError } = await supabase
      .from('lead_results')
      .select('*')
      .in('id', leadIds)
      .eq('organization_id', organizationId)
      .eq('imported_to_crm', false);

    if (leadsError) {
      console.error('[Lead Import] Error fetching leads:', leadsError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des leads' },
        { status: 500 }
      );
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json(
        { error: 'Aucun lead à importer ou leads déjà importés' },
        { status: 400 }
      );
    }

    console.log(`[Lead Import] Found ${leads.length} leads to import`);

    // 5. Récupérer le stage par défaut pour les nouveaux prospects
    const { data: defaultStage } = await supabase
      .from('pipeline_stages')
      .select('id, slug')
      .eq('organization_id', organizationId)
      .eq('slug', 'nouveau')
      .single();

    // 6. Préparer les prospects pour insertion dans le CRM
    const prospectsToInsert = leads.map(lead => {
      // Diviser le nom en prénom/nom
      const nameParts = (lead.name || lead.company_name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || lead.company_name || 'N/A';

      // Construire les notes avec toutes les informations du lead
      const notes = [
        `🔍 Importé depuis Lead Finder`,
        `📅 Date d'import: ${new Date().toLocaleDateString('fr-FR')}`,
        lead.address ? `📍 Adresse: ${lead.address}` : null,
        lead.postal_code && lead.city ? `📮 Ville: ${lead.postal_code} ${lead.city}` : null,
        lead.website ? `🌐 Site web: ${lead.website}` : null,
        lead.source ? `🔗 Source: ${lead.source}` : null,
        lead.quality_score ? `⭐ Score qualité: ${lead.quality_score}/100` : null,
      ].filter(Boolean).join('\n');

      return {
        organization_id: organizationId,
        first_name: firstName,
        last_name: lastName,
        email: lead.email || null,
        phone: lead.phone || null,
        company: lead.company_name || null,
        profession: lead.profession || null,
        address: lead.address || null,
        city: lead.city || null,
        postal_code: lead.postal_code || null,
        country: lead.country || 'France',
        notes: notes,
        source: 'lead_finder',
        source_detail: `Lead Finder (${lead.source})`,
        stage_id: defaultStage?.id || null,
        stage_slug: 'nouveau',
        assigned_to: userId, // Assigner à l'utilisateur qui importe
        tags: ['lead_finder', lead.profession?.toLowerCase()].filter(Boolean),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    // 7. Insérer les prospects dans le CRM
    const { data: prospects, error: insertError } = await supabase
      .from('crm_prospects')
      .insert(prospectsToInsert)
      .select();

    if (insertError) {
      console.error('[Lead Import] Error inserting prospects:', insertError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'import dans le CRM' },
        { status: 500 }
      );
    }

    console.log(`[Lead Import] Successfully inserted ${prospects?.length} prospects`);

    // 8. Mettre à jour les leads comme importés
    const importResults = [];

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      const prospect = prospects?.[i];

      if (prospect) {
        const { error: updateError } = await supabase
          .from('lead_results')
          .update({
            imported_to_crm: true,
            prospect_id: prospect.id,
            imported_at: new Date().toISOString(),
            imported_by: userId,
          })
          .eq('id', lead.id);

        if (updateError) {
          console.error('[Lead Import] Error updating lead:', lead.id, updateError);
        } else {
          importResults.push(prospect);
        }
      }
    }

    // 9. Créer une activité pour chaque prospect importé
    const activitiesToInsert = importResults.map(prospect => ({
      organization_id: organizationId,
      prospect_id: prospect.id,
      user_id: userId,
      type: 'note',
      subject: '🔍 Prospect importé depuis Lead Finder',
      content: `Prospect automatiquement importé depuis Lead Finder par ${userData.full_name}. Prochaines étapes recommandées: qualification et prise de contact.`,
      metadata: {
        import_source: 'lead_finder',
        imported_by: userId,
        import_timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    }));

    if (activitiesToInsert.length > 0) {
      const { error: activityError } = await supabase
        .from('crm_activities')
        .insert(activitiesToInsert);

      if (activityError) {
        console.warn('[Lead Import] Error creating activities:', activityError);
      }
    }

    // 10. Mettre à jour les statistiques d'import (trigger automatique)
    // Le trigger update_import_stats se charge de cela

    const response: LeadImportResponse = {
      imported: importResults.length,
      prospects: importResults,
      failed: leads.length > importResults.length
        ? leads.slice(importResults.length).map(l => l.id)
        : undefined,
    };

    console.log(`[Lead Import] Import completed: ${response.imported}/${leads.length} prospects imported`);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[Lead Import] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// Endpoint pour récupérer l'historique des imports
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer l'organisation
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return NextResponse.json(
        { error: 'Organisation non trouvée' },
        { status: 400 }
      );
    }

    // Récupérer les leads importés
    const { data: importedLeads, error: importError } = await supabase
      .from('lead_results')
      .select(`
        *,
        imported_by_user:users!lead_results_imported_by_fkey(full_name),
        prospect:crm_prospects!lead_results_prospect_id_fkey(
          id, first_name, last_name, email, phone, stage_slug
        )
      `)
      .eq('organization_id', userData.organization_id)
      .eq('imported_to_crm', true)
      .order('imported_at', { ascending: false })
      .limit(100);

    if (importError) {
      console.error('[Lead Import] Error fetching import history:', importError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération de l\'historique' },
        { status: 500 }
      );
    }

    // Statistiques d'import
    const { data: importStats } = await supabase
      .from('lead_stats')
      .select('leads_imported, import_rate, date')
      .eq('organization_id', userData.organization_id)
      .order('date', { ascending: false })
      .limit(30);

    return NextResponse.json({
      imports: importedLeads || [],
      stats: importStats || [],
      total_imported: importedLeads?.length || 0,
    });

  } catch (error: any) {
    console.error('[Lead Import] Unexpected error in GET:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}