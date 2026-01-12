import { createClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { readGoogleSheet, parseProspectsFromSheet, getValidCredentials } from '@/lib/google';

export const dynamic = 'force-dynamic';

// GET /api/extension/prospects - Get prospects with upcoming appointments
export async function GET(request: NextRequest) {
  try {
    // Verify authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token with Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    // Get user and organization
    const adminClient = createAdminClient();
    const { data: user, error: userError } = await adminClient
      .from('users')
      .select('id, organization_id')
      .eq('auth_id', authUser.id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }

    // Get organization with Google credentials
    const { data: org, error: orgError } = await adminClient
      .from('organizations')
      .select('google_sheet_id, google_credentials')
      .eq('id', user.organization_id)
      .single();

    if (orgError || !org?.google_credentials || !org?.google_sheet_id) {
      return NextResponse.json({ error: 'Google Sheet non configure' }, { status: 400 });
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
        email: p.email,
        telephone: p.telephone,
        date_rdv: p.dateRdv,
        qualification: p.qualificationIA,
      }))
      .slice(0, 10); // Limit to 10 prospects

    return NextResponse.json({ prospects: prospectsWithRdv });
  } catch (error) {
    console.error('Extension prospects error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation des prospects' },
      { status: 500 }
    );
  }
}
