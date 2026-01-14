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

    // Get query parameter
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase().trim();

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
      .eq('auth_id', authUser.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouve' },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Get organization with Google credentials
    const { data: org, error: orgError } = await adminClient
      .from('organizations')
      .select('google_sheet_id, google_credentials')
      .eq('id', user.organization_id)
      .single();

    if (orgError || !org?.google_credentials || !org?.google_sheet_id) {
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
        .eq('id', user.organization_id);
    }

    // Fetch prospects from Google Sheet
    const rows = await readGoogleSheet(validCredentials, org.google_sheet_id, 'A:Y');
    const allProspects = parseProspectsFromSheet(rows);

    // Search by name
    const matchedProspects = allProspects
      .filter(p => {
        const fullName = `${p.prenom} ${p.nom}`.toLowerCase();
        const reverseName = `${p.nom} ${p.prenom}`.toLowerCase();
        return fullName.includes(query) || reverseName.includes(query);
      })
      .map(p => ({
        id: p.id,
        nom: p.nom,
        prenom: p.prenom,
        email: p.email,
        telephone: p.telephone,
        qualification: p.qualificationIA,
        date_rdv: p.dateRdv,
      }))
      .slice(0, 5); // Limit to 5 results

    // If only one result, also return it as "prospect" for direct match
    if (matchedProspects.length === 1) {
      const fullProspect = allProspects.find(p => p.id === matchedProspects[0].id);
      if (fullProspect) {
        return NextResponse.json(
          {
            prospect: {
              id: fullProspect.id,
              nom: fullProspect.nom,
              prenom: fullProspect.prenom,
              email: fullProspect.email,
              telephone: fullProspect.telephone,
              situation_pro: fullProspect.situationPro,
              revenus: fullProspect.revenus,
              patrimoine: fullProspect.patrimoine,
              besoins: fullProspect.besoins,
              notes_appel: fullProspect.notesAppel,
              qualification: fullProspect.qualificationIA,
              date_rdv: fullProspect.dateRdv,
            },
            prospects: matchedProspects,
          },
          { headers: corsHeaders() }
        );
      }
    }

    return NextResponse.json(
      { prospects: matchedProspects },
      { headers: corsHeaders() }
    );
  } catch (error) {
    console.error('Extension search error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
