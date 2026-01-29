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

// GET /api/extension/search-prospect - Search prospects by name
export async function GET(request: NextRequest) {
  try {
    // Verify authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non authentifie' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const auth = await validateExtensionToken(token);

    if (!auth) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401, headers: corsHeaders() }
      );
    }

    // Get query parameter (support both 'q' and 'query' for compatibility)
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('query') || searchParams.get('q'))?.toLowerCase().trim();

    if (!query || query.length < 2) {
      return NextResponse.json(
        { prospects: [] },
        { headers: corsHeaders() }
      );
    }

    // Get user and organization
    const adminClient = createAdminClient();
    const { data: user, error: userError } = await adminClient
      .from('users')
      .select('id, organization_id')
      .eq('auth_id', auth.authUser.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouve' },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Get organization
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

    // CRM MODE - Query Supabase
    return await searchProspectsCRM(adminClient, org.id, query);
  } catch (error) {
    console.error('Extension search error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// POST /api/extension/search-prospect - Search prospects by name (for backward compatibility)
export async function POST(request: NextRequest) {
  try {
    // Verify authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non authentifie' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const auth = await validateExtensionToken(token);

    if (!auth) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401, headers: corsHeaders() }
      );
    }

    // Get query from body
    const body = await request.json();
    const query = body.query?.toLowerCase().trim();

    if (!query || query.length < 2) {
      return NextResponse.json(
        { prospects: [] },
        { headers: corsHeaders() }
      );
    }

    // Get user and organization
    const adminClient = createAdminClient();
    const { data: user, error: userError } = await adminClient
      .from('users')
      .select('id, organization_id')
      .eq('auth_id', auth.authUser.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouve' },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Get organization
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

    // CRM MODE - Query Supabase
    return await searchProspectsCRM(adminClient, org.id, query);
  } catch (error) {
    console.error('Extension search POST error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// Search in CRM mode (Supabase)
async function searchProspectsCRM(adminClient: ReturnType<typeof createAdminClient>, orgId: string, query: string) {
  const { data: prospects, error } = await adminClient
    .from('crm_prospects')
    .select('id, first_name, last_name, email, phone, qualification, score_ia, patrimoine_estime, revenus_annuels, notes, profession')
    .eq('organization_id', orgId)
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(5);

  if (error) {
    console.error('CRM search error:', error);
    return NextResponse.json(
      { error: 'Erreur recherche CRM' },
      { status: 500, headers: corsHeaders() }
    );
  }

  const matchedProspects = (prospects || []).map(p => ({
    id: p.id,
    nom: p.last_name,
    prenom: p.first_name,
    firstName: p.first_name,
    lastName: p.last_name,
    email: p.email,
    telephone: p.phone,
    phone: p.phone,
    qualification: p.qualification,
    scoreIa: p.score_ia,
  }));

  // If only one result, return full details
  if (matchedProspects.length === 1) {
    const p = prospects![0];
    return NextResponse.json(
      {
        prospect: {
          id: p.id,
          nom: p.last_name,
          prenom: p.first_name,
          firstName: p.first_name,
          lastName: p.last_name,
          email: p.email,
          telephone: p.phone,
          phone: p.phone,
          situation_pro: p.profession,
          revenus: p.revenus_annuels,
          revenus_annuels: p.revenus_annuels,
          patrimoine: p.patrimoine_estime,
          patrimoine_estime: p.patrimoine_estime,
          besoins: p.notes,
          notes: p.notes,
          qualification: p.qualification,
          score_ia: p.score_ia,
        },
        prospects: matchedProspects,
      },
      { headers: corsHeaders() }
    );
  }

  return NextResponse.json(
    { prospects: matchedProspects },
    { headers: corsHeaders() }
  );
}

