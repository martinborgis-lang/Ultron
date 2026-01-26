import { NextRequest, NextResponse } from 'next/server';
import { validateExtensionToken } from '@/lib/extension-auth';
import { corsHeaders } from '@/lib/cors';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCalendarEvents } from '@/lib/google-calendar';
import type { GoogleCredentials } from '@/types/database';

export const dynamic = 'force-dynamic';

// Handle preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

// GET /api/extension/calendar-events - Get upcoming or recent RDV events from Google Calendar
export async function GET(request: NextRequest) {
  try {
    // Valider le token d'extension
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Extension Calendar] Pas de header Authorization');
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const auth = await validateExtensionToken(token);

    if (!auth) {
      console.log('[Extension Calendar] ❌ Token invalide');
      return NextResponse.json(
        { error: 'Token invalide - veuillez vous reconnecter via le popup Ultron' },
        { status: 401, headers: corsHeaders() }
      );
    }

    console.log('[Extension Calendar] ✅ Token valide pour user:', auth.dbUser.email);
    const user = auth.dbUser;

    // Get Google credentials from user or organization
    const adminClient = createAdminClient();

    // First check user's individual Gmail credentials
    let credentials: GoogleCredentials | null = (user as any).gmail_credentials;

    // Fallback to organization credentials if user doesn't have individual ones
    if (!credentials) {
      const { data: org, error: orgError } = await adminClient
        .from('organizations')
        .select('google_credentials')
        .eq('id', user.organization_id)
        .single();

      if (orgError || !org) {
        return NextResponse.json(
          { error: 'Organisation non trouvée' },
          { status: 404, headers: corsHeaders() }
        );
      }

      credentials = org.google_credentials;
    }

    if (!credentials) {
      console.log('[Extension Calendar] ❌ Aucunes credentials Google disponibles');
      return NextResponse.json(
        { error: 'Google Calendar non configuré. Veuillez connecter Google dans les paramètres.' },
        { status: 400, headers: corsHeaders() }
      );
    }

    console.log('[Extension Calendar] ✅ Credentials Google trouvées, récupération des événements...');

    // Get current date/time
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Get all events from the past month to next month
    const allEvents = await getCalendarEvents(credentials, oneMonthAgo, oneMonthLater);

    // Filter events that look like RDV (meetings)
    const rdvEvents = (allEvents || []).filter(event => {
      const title = (event.summary || '').toLowerCase();
      return title.includes('rdv') ||
             title.includes('rendez-vous') ||
             title.includes('réunion') ||
             title.includes('meeting') ||
             title.includes('call') ||
             title.includes('entretien');
    });

    console.log('[Extension Calendar] 📅 Événements RDV Google Calendar trouvés:', rdvEvents.length);

    // ⭐ ENRICHISSEMENT : Mapper chaque événement Calendar vers un prospect Ultron
    console.log('[Extension Calendar] 🔍 Enrichissement avec prospects Ultron...');
    const enrichedEvents = await Promise.all(
      rdvEvents.map(async (calEvent) => {
        const prospectName = extractProspectName(calEvent.summary || '');
        const startDate = calEvent.start?.dateTime || calEvent.start?.date;
        const meetLink = calEvent.hangoutLink ||
                        calEvent.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri;

        let prospectId = null;

        try {
          // Option 1: Chercher par meet_link (le plus fiable)
          if (meetLink) {
            console.log('[Extension Calendar] 🔗 Recherche par Meet link:', meetLink);
            const { data: eventByMeet } = await adminClient
              .from('crm_events')
              .select('prospect_id, prospect_name')
              .eq('organization_id', user.organization_id)
              .or(`meet_link.eq.${meetLink},metadata->>meet_link.eq.${meetLink}`)
              .single();

            if (eventByMeet?.prospect_id) {
              prospectId = eventByMeet.prospect_id;
              console.log('[Extension Calendar] ✅ Prospect trouvé par Meet link:', prospectId);
            }
          }

          // Option 2: Si pas trouvé par meet_link, chercher par nom + date dans crm_events
          if (!prospectId && prospectName && startDate) {
            console.log('[Extension Calendar] 👤 Recherche par nom + date dans crm_events:', prospectName, startDate);
            const dateOnly = startDate.split('T')[0];
            const { data: eventByName } = await adminClient
              .from('crm_events')
              .select('prospect_id, prospect_name')
              .eq('organization_id', user.organization_id)
              .ilike('prospect_name', `%${prospectName}%`)
              .gte('start_date', `${dateOnly}T00:00:00`)
              .lte('start_date', `${dateOnly}T23:59:59`)
              .single();

            if (eventByName?.prospect_id) {
              prospectId = eventByName.prospect_id;
              console.log('[Extension Calendar] ✅ Prospect trouvé par nom+date dans crm_events:', prospectId);
            }
          }

          // Option 3: Si toujours pas trouvé, recherche directe dans crm_prospects par prénom/nom
          if (!prospectId && prospectName && prospectName.length >= 2 && startDate) {
            console.log('[Extension Calendar] 🔍 Recherche directe dans crm_prospects:', prospectName);

            // Séparer prénom et nom intelligemment
            const nameParts = prospectName.trim().split(/\s+/);
            const prenom = nameParts[0]?.toLowerCase();
            const nom = nameParts.slice(1).join(' ').toLowerCase() || prenom; // Si un seul mot, utiliser comme nom
            const dateOnly = startDate.split('T')[0]; // "2025-01-25"

            console.log(`[Extension Calendar] 🔍 Recherche: prenom="${prenom}", nom="${nom}", date="${dateOnly}"`);

            try {
              // Recherche TOUS les prospects correspondants (pas .single()!)
              const { data: prospects } = await adminClient
                .from('crm_prospects')
                .select('id, first_name, last_name, expected_close_date, updated_at, created_at')
                .eq('organization_id', user.organization_id)
                .or(`and(first_name.ilike.%${prenom}%,last_name.ilike.%${nom}%),and(last_name.ilike.%${prenom}%,first_name.ilike.%${nom}%)`);

              if (prospects && prospects.length > 0) {
                if (prospects.length === 1) {
                  // Un seul résultat → on le prend
                  prospectId = prospects[0].id;
                  console.log(`[Extension Calendar] ✅ Prospect unique trouvé: ${prospectId} (${prospects[0].first_name} ${prospects[0].last_name})`);
                } else {
                  // ⚠️ PLUSIEURS prospects avec le même nom → filtrage intelligent
                  console.log(`[Extension Calendar] ⚠️ ${prospects.length} prospects trouvés avec ce nom, résolution des doublons...`);

                  // Stratégie 1: Chercher celui avec expected_close_date proche de l'événement
                  let selectedProspect = prospects.find(p => {
                    if (!p.expected_close_date) return false;
                    const prospectDate = new Date(p.expected_close_date).toISOString().split('T')[0];
                    return prospectDate === dateOnly;
                  });

                  // Stratégie 2: Si pas de match par date, chercher dans les événements liés
                  if (!selectedProspect) {
                    console.log('[Extension Calendar] 📅 Recherche par événements liés...');
                    for (const prospect of prospects) {
                      const { data: relatedEvents } = await adminClient
                        .from('crm_events')
                        .select('id')
                        .eq('prospect_id', prospect.id)
                        .gte('start_date', `${dateOnly}T00:00:00`)
                        .lte('start_date', `${dateOnly}T23:59:59`)
                        .limit(1);

                      if (relatedEvents && relatedEvents.length > 0) {
                        selectedProspect = prospect;
                        console.log(`[Extension Calendar] ✅ Match trouvé via événement lié: ${prospect.id}`);
                        break;
                      }
                    }
                  }

                  // Stratégie 3: Fallback - prendre le plus récent (updated_at)
                  if (!selectedProspect) {
                    selectedProspect = prospects.sort((a, b) =>
                      new Date(b.updated_at || b.created_at).getTime() -
                      new Date(a.updated_at || a.created_at).getTime()
                    )[0];
                    console.log(`[Extension Calendar] ⚠️ Pas de match précis, prise du plus récent: ${selectedProspect.id} (${selectedProspect.first_name} ${selectedProspect.last_name})`);
                  }

                  prospectId = selectedProspect.id;
                  console.log(`[Extension Calendar] 🎯 Prospect sélectionné: ${prospectId}`);
                }
              }
            } catch (searchError) {
              console.log('[Extension Calendar] ⚠️ Erreur recherche crm_prospects:', searchError instanceof Error ? searchError.message : String(searchError));
            }
          }

        } catch (error) {
          console.log('[Extension Calendar] ⚠️ Erreur recherche prospect:', error instanceof Error ? error.message : String(error));
        }

        return {
          calendarId: calEvent.id, // ID Google Calendar
          prospectId: prospectId,  // ⭐ ID ULTRON !
          id: prospectId || calEvent.id, // Fallback vers Calendar ID si pas trouvé
          title: calEvent.summary || 'Événement sans titre',
          prospectName: prospectName,
          startDate: startDate,
          endDate: calEvent.end?.dateTime || calEvent.end?.date,
          meetLink: meetLink,
          isPast: startDate ? new Date(startDate) < now : false,
          location: calEvent.location,
          description: calEvent.description
        };
      })
    );

    console.log('[Extension Calendar] 📊 Enrichissement terminé:');
    enrichedEvents.forEach((event, i) => {
      const status = event.prospectId ? '✅ ULTRON' : '❌ CALENDAR';
      console.log(`  ${i + 1}. ${event.prospectName} → ${event.prospectId || event.calendarId} (${status})`);
    });

    // Separate future and past events (utiliser enrichedEvents maintenant)
    const futureEvents = enrichedEvents.filter(event => {
      const eventTime = new Date(event.startDate || 0);
      return eventTime > now;
    }).sort((a, b) => {
      const timeA = new Date(a.startDate || 0).getTime();
      const timeB = new Date(b.startDate || 0).getTime();
      return timeA - timeB; // Ascending - earliest first
    });

    const pastEvents = enrichedEvents.filter(event => {
      const eventTime = new Date(event.startDate || 0);
      return eventTime <= now;
    }).sort((a, b) => {
      const timeA = new Date(a.startDate || 0).getTime();
      const timeB = new Date(b.startDate || 0).getTime();
      return timeB - timeA; // Descending - most recent first
    });

    // Take up to 5 future events, or if none, take up to 5 recent past events
    let selectedEvents = futureEvents.slice(0, 5);
    if (selectedEvents.length === 0) {
      selectedEvents = pastEvents.slice(0, 5);
    }

    console.log('[Extension Calendar] 🎯 Événements sélectionnés:', selectedEvents.length);
    console.log('[Extension Calendar] Future events:', futureEvents.length, '- Past events:', pastEvents.length);

    // Les événements sont déjà enrichis et formatés !
    const formattedEvents = selectedEvents;

    console.log('[Extension Calendar] ✅ Événements formatés (enrichis):', formattedEvents.length);
    formattedEvents.forEach((event, i) => {
      const dateStr = event.startDate ? formatDateFr(new Date(event.startDate)) : 'Date inconnue';
      const prospectStatus = event.prospectId ? `✅ ${event.prospectId}` : '❌ Calendar only';
      console.log(`  ${i + 1}. ${event.prospectName} - ${dateStr} (${prospectStatus}) (Meet: ${event.meetLink ? 'OUI' : 'NON'})`);
    });

    return NextResponse.json(
      { events: formattedEvents },
      { headers: corsHeaders() }
    );
  } catch (error) {
    console.error('Extension calendar events error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des événements calendrier' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

/**
 * Extract prospect name from event title
 * "RDV avec Jules BORGIS" → "Jules BORGIS"
 * "Réunion John DOE" → "John DOE"
 * "Call Martin DUPONT" → "Martin DUPONT"
 */
function extractProspectName(title: string): string {
  if (!title) return '';

  console.log(`[Extension Calendar] 🎯 Extraction nom depuis: "${title}"`);

  // Nettoyer le titre : supprimer emojis et espaces en trop
  let cleanTitle = title
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Supprimer tous les emojis
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Supprimer emojis misc
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Supprimer dingbats
    .trim();

  console.log(`[Extension Calendar] 🧹 Titre nettoyé: "${cleanTitle}"`);

  // Patterns à matcher (ordre de priorité)
  const patterns = [
    /(?:RDV|rdv)\s+avec\s+(.+)/i,           // "RDV avec Jules BORGIS"
    /(?:RDV|rdv)\s*[-–—]\s*(.+)/i,          // "RDV - Jules BORGIS"
    /(?:Réunion|réunion)\s+avec\s+(.+)/i,   // "Réunion avec Jules BORGIS"
    /(?:Meeting|meeting)\s+avec\s+(.+)/i,   // "Meeting avec Jules BORGIS"
    /(?:Call|call)\s+avec\s+(.+)/i,         // "Call avec Jules BORGIS"
    /(?:Entretien|entretien)\s+avec\s+(.+)/i, // "Entretien avec Jules BORGIS"
    /avec\s+(.+)/i,                         // Fallback "avec ..."
  ];

  for (const pattern of patterns) {
    const match = cleanTitle.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim()
        .replace(/\s*[-–—].*$/, '') // Supprimer tout après un tiret
        .trim();

      if (name && name.length >= 2) {
        console.log(`[Extension Calendar] ✅ Nom extrait: "${name}" depuis "${title}"`);
        return name;
      }
    }
  }

  // Fallback : retourner le titre nettoyé si pas vide
  const fallback = cleanTitle || title;
  console.log(`[Extension Calendar] ⚠️ Pas de pattern trouvé, utilisation du titre: "${fallback}"`);
  return fallback;
}

/**
 * Try to extract Google Meet link from event description
 */
function extractMeetLinkFromDescription(description: string): string | null {
  if (!description) return null;

  // Look for meet.google.com links
  const meetRegex = /https:\/\/meet\.google\.com\/[a-z-]+/i;
  const match = description.match(meetRegex);

  return match ? match[0] : null;
}

/**
 * Format date to French format for logging
 */
function formatDateFr(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}