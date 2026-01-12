import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { google } from 'googleapis';
import { getValidCredentials, GoogleCredentials } from '@/lib/google';

interface Organization {
  id: string;
  google_sheet_id: string;
  google_credentials: GoogleCredentials;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ prospectId: string }> }
) {
  try {
    const { prospectId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer l'utilisateur et son organisation
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_id', user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json(
        { error: 'Organisation non trouvée' },
        { status: 404 }
      );
    }

    // Récupérer l'organisation
    const { data: org } = await supabase
      .from('organizations')
      .select('id, google_sheet_id, google_credentials')
      .eq('id', userData.organization_id)
      .single();

    if (!org) {
      return NextResponse.json(
        { error: 'Organisation non trouvée' },
        { status: 404 }
      );
    }

    const organization = org as Organization;

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
  } catch (error: unknown) {
    console.error('Erreur meeting prepare:', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
