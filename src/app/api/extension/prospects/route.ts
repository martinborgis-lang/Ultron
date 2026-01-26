import { createClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { readGoogleSheet, parseProspectsFromSheet, getValidCredentials, GoogleCredentials } from '@/lib/google';
import { corsHeaders } from '@/lib/cors';
import { validateExtensionToken } from '@/lib/extension-auth';

export const dynamic = 'force-dynamic';

// Handle preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

// GET /api/extension/prospects - Get prospects with upcoming appointments
export async function GET(request: NextRequest) {
  try {
    // Valider le token d'extension (custom HS256 ou Supabase natif)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Extension API] Pas de header Authorization');
      return NextResponse.json(
        { error: 'Non authentifie' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const auth = await validateExtensionToken(token);

    if (!auth) {
      console.log('[Extension API] ❌ Token invalide');
      return NextResponse.json(
        { error: 'Token invalide - veuillez vous reconnecter via le popup Ultron' },
        { status: 401, headers: corsHeaders() }
      );
    }

    console.log('[Extension API] ✅ Token valide pour user:', auth.dbUser.email);
    const user = auth.dbUser;

    // Get organization with data_mode
    const adminClient = createAdminClient();
    const { data: org, error: orgError } = await adminClient
      .from('organizations')
      .select('id, data_mode, google_sheet_id, google_credentials')
      .eq('id', user.organization_id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organisation non trouvee' },
        { status: 404, headers: corsHeaders() }
      );
    }

    // BI-MODE: Route based on data_mode
    if (org.data_mode === 'crm') {
      // CRM MODE - Query Supabase for prospects with upcoming meetings
      return await getProspectsCRM(adminClient, org.id, user.id);
    } else {
      // SHEET MODE - Query Google Sheets
      return await getProspectsSheet(adminClient, org, user.organization_id);
    }
  } catch (error) {
    console.error('Extension prospects error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation des prospects' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// Get prospects with RDV in CRM mode
async function getProspectsCRM(
  adminClient: ReturnType<typeof createAdminClient>,
  orgId: string,
  userId: string
) {
  // Get prospects that have upcoming meetings (events with type 'meeting' or 'rdv')
  const now = new Date().toISOString();
  const oneWeekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // First get events with prospects (include meet_link column AND metadata)
  const { data: events, error: eventsError } = await adminClient
    .from('crm_events')
    .select('prospect_id, prospect_name, start_date, meet_link, metadata')
    .eq('organization_id', orgId)
    .in('type', ['meeting', 'rdv', 'call'])
    .gte('start_date', now)
    .lte('start_date', oneWeekLater)
    .order('start_date', { ascending: true })
    .limit(10);

  if (eventsError) {
    console.error('Error fetching events:', eventsError);
  }

  // Get prospect IDs from events
  const prospectIds = events?.filter(e => e.prospect_id).map(e => e.prospect_id) || [];

  if (prospectIds.length === 0) {
    // Fallback: get recent prospects with RDV stage
    const { data: prospects, error } = await adminClient
      .from('crm_prospects')
      .select('id, first_name, last_name, email, phone, qualification, stage_slug')
      .eq('organization_id', orgId)
      .in('stage_slug', ['rdv_pris', 'rdv_valide', 'rdv_effectue'])
      .order('updated_at', { ascending: false })
      .limit(5);

    if (error) {
      return NextResponse.json(
        { error: 'Erreur CRM' },
        { status: 500, headers: corsHeaders() }
      );
    }

    const formattedProspects = (prospects || []).map(p => ({
      id: p.id,
      nom: p.last_name,
      prenom: p.first_name,
      firstName: p.first_name,
      lastName: p.last_name,
      email: p.email,
      telephone: p.phone,
      phone: p.phone,
      qualification: p.qualification,
      date_rdv: null,
    }));

    return NextResponse.json(
      { prospects: formattedProspects },
      { headers: corsHeaders() }
    );
  }

  // Get full prospect details for those with events
  const { data: prospects, error: prospectsError } = await adminClient
    .from('crm_prospects')
    .select('id, first_name, last_name, email, phone, qualification')
    .in('id', prospectIds);

  if (prospectsError) {
    return NextResponse.json(
      { error: 'Erreur CRM' },
      { status: 500, headers: corsHeaders() }
    );
  }

  // Map prospects with their event dates
  const prospectMap = new Map(prospects?.map(p => [p.id, p]) || []);

  const formattedProspects = (events || [])
    .filter(e => e.prospect_id && prospectMap.has(e.prospect_id))
    .map(e => {
      const p = prospectMap.get(e.prospect_id)!;
      return {
        id: p.id,
        nom: p.last_name,
        prenom: p.first_name,
        firstName: p.first_name,
        lastName: p.last_name,
        email: p.email,
        telephone: p.phone,
        phone: p.phone,
        qualification: p.qualification,
        date_rdv: e.start_date ? formatDateFr(new Date(e.start_date)) : null,
        meet_link: (e as { meet_link?: string }).meet_link || (e.metadata as { meet_link?: string })?.meet_link || null,
      };
    });

  return NextResponse.json(
    { prospects: formattedProspects },
    { headers: corsHeaders() }
  );
}

// Get prospects with RDV in Sheet mode
async function getProspectsSheet(
  adminClient: ReturnType<typeof createAdminClient>,
  org: { id: string; google_sheet_id: string | null; google_credentials: GoogleCredentials | null },
  organizationId: string
) {
  if (!org.google_credentials || !org.google_sheet_id) {
    return NextResponse.json(
      { prospects: [] },
      { headers: corsHeaders() }
    );
  }

  // Get valid credentials
  const validCredentials = await getValidCredentials(org.google_credentials);

  // Update credentials if refreshed
  if (validCredentials.access_token !== org.google_credentials.access_token) {
    await adminClient
      .from('organizations')
      .update({ google_credentials: validCredentials })
      .eq('id', organizationId);
  }

  // Fetch prospects from Google Sheet
  const rows = await readGoogleSheet(validCredentials, org.google_sheet_id, 'A:Y');
  const allProspects = parseProspectsFromSheet(rows);

  // Filter prospects with upcoming appointments (date_rdv not empty)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prospectsWithRdv = allProspects
    .filter(p => {
      if (!p.dateRdv) return false;

      // Parse date (format: DD/MM/YYYY or YYYY-MM-DD)
      let rdvDate: Date | null = null;
      if (p.dateRdv.includes('/')) {
        const [day, month, year] = p.dateRdv.split('/');
        rdvDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (p.dateRdv.includes('-')) {
        rdvDate = new Date(p.dateRdv);
      }

      if (!rdvDate || isNaN(rdvDate.getTime())) return false;

      // Include today and future appointments
      return rdvDate >= today;
    })
    .map(p => ({
      id: p.id,
      nom: p.nom,
      prenom: p.prenom,
      firstName: p.prenom,
      lastName: p.nom,
      email: p.email,
      telephone: p.telephone,
      phone: p.telephone,
      date_rdv: p.dateRdv,
      qualification: p.qualificationIA,
    }))
    .slice(0, 10); // Limit to 10 prospects

  return NextResponse.json(
    { prospects: prospectsWithRdv },
    { headers: corsHeaders() }
  );
}

// Format date to French format
function formatDateFr(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
