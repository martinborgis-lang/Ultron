import { createClient } from '@/lib/supabase/server';
import {
  getValidCredentials,
  readGoogleSheet,
  parseProspectsFromSheet,
  GoogleCredentials,
} from '@/lib/google';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { data: user } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_id', authUser.id)
      .single();

    if (!user?.organization_id) {
      return NextResponse.json({ error: 'Organisation non trouvee' }, { status: 404 });
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('google_credentials, google_sheet_id')
      .eq('id', user.organization_id)
      .single();

    if (!org?.google_credentials) {
      return NextResponse.json(
        { error: 'Google non connecte', connected: false },
        { status: 400 }
      );
    }

    if (!org.google_sheet_id) {
      return NextResponse.json(
        { error: 'Aucun ID de Google Sheet configure', configured: false },
        { status: 400 }
      );
    }

    const credentials = await getValidCredentials(org.google_credentials as GoogleCredentials);

    // Compare access_token to detect if credentials were refreshed
    const originalCredentials = org.google_credentials as GoogleCredentials;
    if (credentials.access_token !== originalCredentials.access_token) {
      console.log('🔄 Google credentials refreshed, saving new tokens');
      await supabase
        .from('organizations')
        .update({ google_credentials: credentials })
        .eq('id', user.organization_id);
    }

    const rows = await readGoogleSheet(credentials, org.google_sheet_id);
    const prospects = parseProspectsFromSheet(rows);

    return NextResponse.json({ prospects });
  } catch (error) {
    console.error('Prospects fetch error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

    if (errorMessage.includes('invalid_grant') || errorMessage.includes('Token has been expired')) {
      return NextResponse.json(
        { error: 'Session Google expiree', needsReconnect: true },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la recuperation des prospects' },
      { status: 500 }
    );
  }
}
