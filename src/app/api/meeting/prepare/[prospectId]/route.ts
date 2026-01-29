import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateExtensionToken } from '@/lib/extension-auth';

interface Organization {
  id: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ prospectId: string }> }
) {
  try {
    const { prospectId } = await params;

    // Valider le token d'extension
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const auth = await validateExtensionToken(token);

    if (!auth) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const userData = auth.dbUser;

    // Récupérer l'organisation
    const adminClient = createAdminClient();
    const { data: org } = await adminClient
      .from('organizations')
      .select('id')
      .eq('id', userData.organization_id)
      .single();

    if (!org) {
      return NextResponse.json(
        { error: 'Organisation non trouvée' },
        { status: 404 }
      );
    }

    const organization = org as Organization;

    // CRM MODE
    return await getProspectCRM(prospectId, organization.id);
  } catch (error: unknown) {
    console.error('Erreur meeting prepare:', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Get prospect from CRM (Supabase)
async function getProspectCRM(prospectId: string, organizationId: string) {
  const adminClient = createAdminClient();

  // Get prospect
  const { data: prospectData, error: prospectError } = await adminClient
    .from('crm_prospects')
    .select('*')
    .eq('id', prospectId)
    .eq('organization_id', organizationId)
    .single();

  if (prospectError || !prospectData) {
    return NextResponse.json(
      { error: 'Prospect non trouvé' },
      { status: 404 }
    );
  }

  const prospect = {
    id: prospectData.id,
    date_lead: prospectData.created_at ? new Date(prospectData.created_at).toLocaleDateString('fr-FR') : '',
    nom: prospectData.last_name || '',
    prenom: prospectData.first_name || '',
    email: prospectData.email || '',
    telephone: prospectData.phone || '',
    source: prospectData.source || '',
    age: prospectData.age || '',
    situation_pro: prospectData.profession || '',
    revenus: prospectData.revenus_annuels || '',
    patrimoine: prospectData.patrimoine_estime || '',
    besoins: prospectData.notes || '',
    notes_appel: prospectData.notes || '',
    statut: prospectData.stage_slug || '',
    date_rdv: '',
    qualification: prospectData.qualification || '',
    score: prospectData.score_ia || 0,
    priorite: '',
    justification: prospectData.analyse_ia || '',
  };

  // Get activities for interactions
  const { data: activities } = await adminClient
    .from('crm_activities')
    .select('*')
    .eq('prospect_id', prospectId)
    .order('created_at', { ascending: false })
    .limit(20);

  // Get upcoming meeting date if exists
  const { data: events } = await adminClient
    .from('crm_events')
    .select('start_date')
    .eq('prospect_id', prospectId)
    .in('type', ['meeting', 'rdv', 'call'])
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(1);

  if (events && events.length > 0) {
    prospect.date_rdv = new Date(events[0].start_date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Build interactions from activities
  const interactions: {
    type: string;
    date: string;
    description: string;
    status: string;
  }[] = [];

  if (activities) {
    for (const activity of activities) {
      interactions.push({
        type: activity.type || 'note',
        date: activity.created_at ? new Date(activity.created_at).toLocaleDateString('fr-FR') : '',
        description: activity.subject || activity.content?.substring(0, 100) || 'Activité',
        status: 'completed',
      });
    }
  }

  // Get email logs
  const { data: emailLogs } = await adminClient
    .from('email_logs')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('prospect_email', prospect.email)
    .order('sent_at', { ascending: false });

  if (emailLogs) {
    for (const log of emailLogs) {
      interactions.push({
        type: `email_${log.email_type}`,
        date: new Date(log.sent_at).toLocaleDateString('fr-FR'),
        description: `Email ${log.email_type} : ${log.subject}`,
        status: 'sent',
      });
    }
  }

  return NextResponse.json({
    prospect,
    interactions,
  });
}

