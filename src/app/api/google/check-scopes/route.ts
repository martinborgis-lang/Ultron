import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer le user
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, gmail_credentials')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'Utilisateur non trouvé', hasCalendarScope: false });
    }

    // Récupérer les credentials de l'organisation si pas de gmail_credentials
    let credentials = userData.gmail_credentials;

    if (!credentials && userData.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('google_credentials')
        .eq('id', userData.organization_id)
        .single();

      credentials = org?.google_credentials;
    }

    if (!credentials) {
      return NextResponse.json({
        error: 'Pas de credentials',
        hasCalendarScope: false,
        needsReconnect: true
      });
    }

    // Vérifier les scopes avec l'API Google
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials(credentials);

    try {
      // Tester l'accès au Calendar
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      await calendar.calendarList.list({ maxResults: 1 });

      return NextResponse.json({
        hasCalendarScope: true,
        message: 'Accès Calendar OK'
      });
    } catch (error: any) {
      // Vérifier si c'est une erreur de scope
      const isInsufficientScope = error.message?.includes('insufficient') ||
                                   error.code === 403 ||
                                   error.message?.includes('scope');

      return NextResponse.json({
        hasCalendarScope: false,
        error: error.message,
        needsReconnect: isInsufficientScope
      });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
