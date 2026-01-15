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
    console.log('📊 Sheets prospects - Starting request');
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    console.log('📊 Sheets prospects - authUser:', authUser?.id);

    if (!authUser) {
      console.log('📊 Sheets prospects - No auth user, returning 401');
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { data: user } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_id', authUser.id)
      .single();

    console.log('📊 Sheets prospects - user organization_id:', user?.organization_id);

    if (!user?.organization_id) {
      return NextResponse.json({ error: 'Organisation non trouvee' }, { status: 404 });
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('id, google_credentials, google_sheet_id')
      .eq('id', user.organization_id)
      .single();

    console.log('📊 Sheets prospects - org:', org?.id);
    console.log('📊 Sheets prospects - has credentials:', !!org?.google_credentials);
    console.log('📊 Sheets prospects - sheet_id:', org?.google_sheet_id);

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

    console.log('📊 Sheets prospects - Getting valid credentials...');
    const credentials = await getValidCredentials(org.google_credentials as GoogleCredentials);
    console.log('📊 Sheets prospects - Got valid credentials');

    // Compare access_token to detect if credentials were refreshed
    const originalCredentials = org.google_credentials as GoogleCredentials;
    if (credentials.access_token !== originalCredentials.access_token) {
      console.log('🔄 Google credentials refreshed, saving new tokens');
      await supabase
        .from('organizations')
        .update({ google_credentials: credentials })
        .eq('id', user.organization_id);
    }

    console.log('📊 Sheets prospects - Reading sheet...');
    const rows = await readGoogleSheet(credentials, org.google_sheet_id);
    console.log('📊 Sheets prospects - Got rows:', rows.length);
    const prospects = parseProspectsFromSheet(rows);
    console.log('📊 Sheets prospects - Parsed prospects:', prospects.length);

    return NextResponse.json({ prospects });
  } catch (error) {
    console.error('📊 Sheets prospects - ERROR:', error);

    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('📊 Sheets prospects - Error message:', errorMessage);

    if (errorMessage.includes('invalid_grant') || errorMessage.includes('Token has been expired')) {
      console.log('📊 Sheets prospects - Token expired, returning 401');
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
