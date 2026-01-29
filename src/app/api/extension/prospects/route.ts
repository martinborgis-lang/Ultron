import { createClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
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

    // Get organization
    const adminClient = createAdminClient();
    const { data: org, error: orgError } = await adminClient
      .from('organizations')
      .select('id')
      .eq('id', user.organization_id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organisation non trouvee' },
        { status: 404, headers: corsHeaders() }
      );
    }

    // CRM MODE - Query Supabase for prospects with upcoming meetings
    return await getProspectsCRM(adminClient, org.id, user.id);
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

  // First get events with prospects (use metadata for meet_link since column may not exist yet)
  const { data: events, error: eventsError } = await adminClient
    .from('crm_events')
    .select('prospect_id, prospect_name, start_date, metadata')
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
        meet_link: (e.metadata as { meet_link?: string })?.meet_link || null,
      };
    });

  return NextResponse.json(
    { prospects: formattedProspects },
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
