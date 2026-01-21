import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const context = await getCurrentUserAndOrganization();
  if (!context) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const prospectId = request.nextUrl.searchParams.get('prospect_id');
  if (!prospectId) {
    return NextResponse.json({ error: 'prospect_id requis' }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Récupérer toutes les données du prospect
  const { data: prospect, error } = await adminClient
    .from('crm_prospects')
    .select('*')
    .eq('id', prospectId)
    .eq('organization_id', context.organization.id)
    .single();

  if (error || !prospect) {
    return NextResponse.json({ error: 'Prospect non trouvé' }, { status: 404 });
  }

  // Récupérer les activités
  const { data: activities } = await adminClient
    .from('crm_activities')
    .select('type, subject, content, created_at')
    .eq('prospect_id', prospectId)
    .order('created_at', { ascending: false });

  // Récupérer les événements
  const { data: events } = await adminClient
    .from('crm_events')
    .select('type, title, start_date, status, created_at')
    .eq('prospect_id', prospectId)
    .order('created_at', { ascending: false });

  // Formater l'export
  const exportData = {
    _info: {
      export_date: new Date().toISOString(),
      data_controller: 'Martin Borgis',
      contact: 'martin.borgis@gmail.com',
    },
    prospect: {
      identite: {
        nom: prospect.last_name,
        prenom: prospect.first_name,
        email: prospect.email,
        telephone: prospect.phone,
      },
      adresse: {
        adresse: prospect.address,
        ville: prospect.city,
        code_postal: prospect.postal_code,
      },
      professionnel: {
        entreprise: prospect.company,
        profession: prospect.profession,
      },
      donnees_crm: {
        statut: prospect.stage_slug,
        qualification: prospect.qualification,
        source: prospect.source,
        notes: prospect.notes,
        tags: prospect.tags,
      },
      consentement: {
        marketing: prospect.consent_marketing,
        date_consentement: prospect.consent_date,
        source_consentement: prospect.consent_source,
        date_desinscription: prospect.unsubscribed_at,
      },
      dates: {
        creation: prospect.created_at,
        modification: prospect.updated_at,
      },
    },
    activites: activities || [],
    evenements: events || [],
  };

  // Logger l'export
  await adminClient
    .from('crm_prospects')
    .update({ gdpr_export_requested_at: new Date().toISOString() })
    .eq('id', prospectId);

  return NextResponse.json(exportData);
}