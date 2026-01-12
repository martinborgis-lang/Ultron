import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCalendarEvents, createCalendarEvent } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
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
      return NextResponse.json({ error: 'Google non connecté' }, { status: 400 });
    }

    // Récupérer les paramètres de date
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!start || !end) {
      return NextResponse.json({ error: 'Paramètres start et end requis' }, { status: 400 });
    }

    const events = await getCalendarEvents(
      credentials,
      new Date(start),
      new Date(end)
    );

    return NextResponse.json({ events });

  } catch (error: any) {
    console.error('Erreur calendar events:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
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
      return NextResponse.json({ error: 'Google non connecté' }, { status: 400 });
    }

    const body = await request.json();
    const { summary, description, startDateTime, endDateTime, attendees, location } = body;

    if (!summary || !startDateTime || !endDateTime) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    const event = await createCalendarEvent(credentials, {
      summary,
      description,
      startDateTime,
      endDateTime,
      attendees,
      location,
    });

    return NextResponse.json({ event });

  } catch (error: any) {
    console.error('Erreur création événement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
