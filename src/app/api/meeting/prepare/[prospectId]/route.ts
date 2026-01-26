import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { google } from 'googleapis';
import { getValidCredentials, GoogleCredentials } from '@/lib/google';
import { validateExtensionToken } from '@/lib/extension-auth';

interface Organization {
  id: string;
  data_mode: string;
  google_sheet_id: string | null;
  google_credentials: GoogleCredentials | null;
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

    // Récupérer l'organisation avec data_mode
    const { data: org } = await supabase
      .from('organizations')
      .select('id, data_mode, google_sheet_id, google_credentials')
      .eq('id', userData.organization_id)
      .single();

    if (!org) {
      return NextResponse.json(
        { error: 'Organisation non trouvée' },
        { status: 404 }
      );
    }

    const organization = org as Organization;

    // BI-MODE: Route based on data_mode
    if (organization.data_mode === 'crm') {
      return await getProspectCRM(prospectId, organization.id);
    } else {
      return await getProspectSheet(prospectId, organization, supabase);
    }
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

// Get prospect from Google Sheet
async function getProspectSheet(
  prospectId: string,
  organization: Organization,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  if (!organization.google_credentials || !organization.google_sheet_id) {
    return NextResponse.json(
      { error: 'Google Sheets non configuré' },
      { status: 400 }
    );
  }

  // Get valid credentials
  const credentials = await getValidCredentials(organization.google_credentials);

  // Update credentials if refreshed
  if (credentials !== organization.google_credentials) {
    await supabase
      .from('organizations')
      .update({ google_credentials: credentials })
      .eq('id', organization.id);
  }

  // Configurer Google Sheets API
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials(credentials);

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  // Lire les données du prospect
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: organization.google_sheet_id,
    range: 'prospect!A:Z',
  });

  const rows = response.data.values || [];

  // Trouver le prospect par ID (colonne A)
  const prospectRow = rows.find((row, index) => {
    if (index === 0) return false; // Skip header
    return String(row[0]) === prospectId;
  });

  if (!prospectRow) {
    return NextResponse.json(
      { error: 'Prospect non trouvé' },
      { status: 404 }
    );
  }

  const prospect = {
    id: prospectRow[0] || '',
    date_lead: prospectRow[1] || '',
    nom: prospectRow[2] || '',
    prenom: prospectRow[3] || '',
    email: prospectRow[4] || '',
    telephone: prospectRow[5] || '',
    source: prospectRow[6] || '',
    age: prospectRow[7] || '',
    situation_pro: prospectRow[8] || '',
    revenus: prospectRow[9] || '',
    patrimoine: prospectRow[10] || '',
    besoins: prospectRow[11] || '',
    notes_appel: prospectRow[12] || '',
    statut: prospectRow[13] || '',
    date_rdv: prospectRow[14] || '',
    qualification: prospectRow[16] || '',
    score: parseInt(prospectRow[17]) || 0,
    priorite: prospectRow[18] || '',
    justification: prospectRow[19] || '',
  };

  // Récupérer l'historique des emails depuis email_logs
  const { data: emailLogs } = await supabase
    .from('email_logs')
    .select('*')
    .eq('organization_id', organization.id)
    .eq('prospect_email', prospect.email)
    .order('sent_at', { ascending: false });

  // Construire l'historique des interactions
  const interactions: {
    type: string;
    date: string;
    description: string;
    status: string;
  }[] = [];

  // Ajouter l'appel de prospection si notes présentes
  if (prospect.notes_appel) {
    interactions.push({
      type: 'appel',
      date: prospect.date_lead || 'Date inconnue',
      description: 'Appel de prospection',
      status: 'sent',
    });
  }

  // Ajouter les emails
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
