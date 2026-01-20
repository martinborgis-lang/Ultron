import { createClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { readGoogleSheet, parseProspectsFromSheet, getValidCredentials } from '@/lib/google';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

// Handle preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

// GET /api/extension/prospect/[id] - Get prospect details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: prospectId } = await params;

    // Verify authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non authentifie' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token with Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401, headers: corsHeaders() }
      );
    }

    // Get user and organization
    const adminClient = createAdminClient();
    const { data: user, error: userError } = await adminClient
      .from('users')
      .select('id, organization_id')
      .eq('auth_id', authUser.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouve' },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Get organization with data_mode
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
      // CRM MODE - Query Supabase
      return await getProspectCRM(adminClient, org.id, prospectId);
    } else {
      // SHEET MODE - Query Google Sheets
      return await getProspectSheet(adminClient, org, prospectId);
    }
  } catch (error) {
    console.error('Extension get prospect error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation du prospect' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// Get prospect in CRM mode
async function getProspectCRM(adminClient: ReturnType<typeof createAdminClient>, orgId: string, prospectId: string) {
  const { data: prospect, error } = await adminClient
    .from('crm_prospects')
    .select('*')
    .eq('organization_id', orgId)
    .eq('id', prospectId)
    .single();

  if (error || !prospect) {
    return NextResponse.json(
      { error: 'Prospect non trouve' },
      { status: 404, headers: corsHeaders() }
    );
  }

  return NextResponse.json(
    {
      prospect: {
        id: prospect.id,
        nom: prospect.last_name,
        prenom: prospect.first_name,
        firstName: prospect.first_name,
        lastName: prospect.last_name,
        email: prospect.email,
        telephone: prospect.phone,
        phone: prospect.phone,
        source: prospect.source,
        age: prospect.age,
        situation_pro: prospect.profession,
        profession: prospect.profession,
        revenus: prospect.revenus_annuels,
        revenus_annuels: prospect.revenus_annuels,
        patrimoine: prospect.patrimoine_estime,
        patrimoine_estime: prospect.patrimoine_estime,
        besoins: prospect.notes,
        notes: prospect.notes,
        statut_appel: prospect.stage_slug,
        qualification: prospect.qualification,
        score: prospect.score_ia,
        score_ia: prospect.score_ia,
        justification: prospect.analyse_ia,
        analyse_ia: prospect.analyse_ia,
      },
    },
    { headers: corsHeaders() }
  );
}

// Get prospect in Sheet mode
async function getProspectSheet(
  adminClient: ReturnType<typeof createAdminClient>,
  org: { id: string; google_sheet_id: string | null; google_credentials: any },
  prospectId: string
) {
  if (!org.google_credentials || !org.google_sheet_id) {
    return NextResponse.json(
      { error: 'Google Sheet non configure' },
      { status: 400, headers: corsHeaders() }
    );
  }

  // Get valid credentials
  const validCredentials = await getValidCredentials(org.google_credentials);

  // Update credentials if refreshed
  if (validCredentials.access_token !== org.google_credentials.access_token) {
    await adminClient
      .from('organizations')
      .update({ google_credentials: validCredentials })
      .eq('id', org.id);
  }

  // Fetch prospects from Google Sheet
  const rows = await readGoogleSheet(validCredentials, org.google_sheet_id, 'A:Y');
  const allProspects = parseProspectsFromSheet(rows);

  // Find the prospect by ID
  const prospect = allProspects.find(p => p.id === prospectId);

  if (!prospect) {
    return NextResponse.json(
      { error: 'Prospect non trouve' },
      { status: 404, headers: corsHeaders() }
    );
  }

  return NextResponse.json(
    {
      prospect: {
        id: prospect.id,
        nom: prospect.nom,
        prenom: prospect.prenom,
        firstName: prospect.prenom,
        lastName: prospect.nom,
        email: prospect.email,
        telephone: prospect.telephone,
        phone: prospect.telephone,
        source: prospect.source,
        age: prospect.age,
        situation_pro: prospect.situationPro,
        revenus: prospect.revenus,
        patrimoine: prospect.patrimoine,
        besoins: prospect.besoins,
        notes_appel: prospect.notesAppel,
        notes: prospect.notesAppel,
        statut_appel: prospect.statutAppel,
        qualification: prospect.qualificationIA,
        score: prospect.scoreIA,
        priorite: prospect.prioriteIA,
        justification: prospect.justificationIA,
        date_rdv: prospect.dateRdv,
      },
    },
    { headers: corsHeaders() }
  );
}
