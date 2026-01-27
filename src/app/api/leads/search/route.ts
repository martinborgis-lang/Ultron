import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type {
  LeadSearchRequest,
  LeadSearchResponse,
  LeadResult,
  OutscraperResponse,
  GooglePlacesResponse,
  OutscraperPlace,
  GooglePlace
} from '@/types/leads';

// Configuration des APIs (à mettre dans .env)
const OUTSCRAPER_API_KEY = process.env.OUTSCRAPER_API_KEY;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const HUNTER_API_KEY = process.env.HUNTER_API_KEY;

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    // 1. Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // 2. Récupérer l'organisation de l'utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData?.organization_id) {
      console.error('[Lead Search] User error:', userError);
      return NextResponse.json(
        { error: 'Organisation non trouvée' },
        { status: 400 }
      );
    }

    const organizationId = userData.organization_id;
    const userId = userData.id;

    // 3. Vérifier les crédits
    const { data: credits } = await supabase
      .from('lead_credits')
      .select('credits_total, credits_used')
      .eq('organization_id', organizationId)
      .single();

    const available = (credits?.credits_total || 0) - (credits?.credits_used || 0);

    // 4. Parser la requête
    const body: LeadSearchRequest = await request.json();
    const { type, profession, location, postalCode, count } = body;

    // Validation des paramètres
    if (!profession?.trim()) {
      return NextResponse.json(
        { error: 'La profession est obligatoire' },
        { status: 400 }
      );
    }

    if (!location?.trim() && !postalCode?.trim()) {
      return NextResponse.json(
        { error: 'La ville ou le code postal est obligatoire' },
        { status: 400 }
      );
    }

    if (count <= 0 || count > 100) {
      return NextResponse.json(
        { error: 'Le nombre de leads doit être entre 1 et 100' },
        { status: 400 }
      );
    }

    if (available < count) {
      return NextResponse.json(
        {
          error: `Crédits insuffisants. Disponible: ${available}, Demandé: ${count}`,
          creditsAvailable: available,
          creditsRequired: count
        },
        { status: 402 }
      );
    }

    console.log('[Lead Search] Starting search:', {
      type, profession, location, postalCode, count,
      organizationId, userId, creditsAvailable: available
    });

    // 5. Créer l'entrée de recherche
    const { data: search, error: searchError } = await supabase
      .from('lead_searches')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        search_type: type,
        profession: profession.trim(),
        location: location?.trim(),
        postal_code: postalCode?.trim(),
        leads_requested: count,
        status: 'processing',
      })
      .select()
      .single();

    if (searchError) {
      console.error('[Lead Search] Error creating search:', searchError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la recherche' },
        { status: 500 }
      );
    }

    // 6. Construire la requête de recherche
    const query = `${profession} ${location || ''} ${postalCode || ''}`.trim();
    let leads: any[] = [];
    let apiSource = 'demo';

    try {
      // Appeler l'API de scraping
      if (OUTSCRAPER_API_KEY) {
        console.log('[Lead Search] Using Outscraper API');
        leads = await searchWithOutscraper(query, count);
        apiSource = 'outscraper';
      } else if (GOOGLE_PLACES_API_KEY) {
        console.log('[Lead Search] Using Google Places API');
        leads = await searchWithGooglePlaces(query, count, location, postalCode);
        apiSource = 'google_places';
      } else {
        console.log('[Lead Search] Using demo data');
        leads = generateDemoLeads(profession, location, postalCode, count);
        apiSource = 'demo';
      }

      console.log(`[Lead Search] Found ${leads.length} leads via ${apiSource}`);

      // 7. Enrichir les emails si Hunter.io est configuré
      if (HUNTER_API_KEY && leads.length > 0) {
        leads = await enrichLeadsWithEmails(leads);
      }

      // 8. Sauvegarder les résultats
      const leadsToInsert = leads.map((lead: any) => ({
        search_id: search.id,
        organization_id: organizationId,
        name: lead.name,
        company_name: lead.company_name,
        profession: profession,
        address: lead.address,
        postal_code: lead.postal_code || postalCode,
        city: lead.city || location,
        country: lead.country || 'France',
        phone: lead.phone,
        email: lead.email,
        website: lead.website,
        source: apiSource,
        confidence_score: lead.confidence_score || 75,
        raw_data: lead.raw_data || {},
        quality_score: calculateQualityScore(lead),
        is_valid: validateLead(lead),
      }));

      const { data: savedLeads, error: saveError } = await supabase
        .from('lead_results')
        .insert(leadsToInsert)
        .select();

      if (saveError) {
        console.error('[Lead Search] Error saving leads:', saveError);
        throw new Error('Erreur lors de la sauvegarde des leads');
      }

      // 9. Mettre à jour la recherche
      const searchDuration = Date.now() - startTime;
      const creditsUsed = savedLeads?.length || 0;

      await supabase
        .from('lead_searches')
        .update({
          leads_found: creditsUsed,
          credits_consumed: creditsUsed,
          status: 'completed',
          api_source: apiSource,
          search_duration_ms: searchDuration,
          completed_at: new Date().toISOString(),
        })
        .eq('id', search.id);

      // 10. Mettre à jour les crédits (fait automatiquement via trigger)
      // Le trigger update_lead_credits_after_search se charge de cela

      const response: LeadSearchResponse = {
        search_id: search.id,
        leads: savedLeads || [],
        creditsUsed,
        creditsRemaining: available - creditsUsed,
        searchDuration,
      };

      return NextResponse.json(response);

    } catch (apiError: any) {
      console.error('[Lead Search] API Error:', apiError);

      // Mettre à jour la recherche avec l'erreur
      await supabase
        .from('lead_searches')
        .update({
          status: 'failed',
          error_message: apiError.message,
          search_duration_ms: Date.now() - startTime,
          completed_at: new Date().toISOString(),
        })
        .eq('id', search.id);

      return NextResponse.json(
        { error: `Erreur lors de la recherche: ${apiError.message}` },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[Lead Search] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// Fonction pour Outscraper API
async function searchWithOutscraper(query: string, count: number): Promise<any[]> {
  const response = await fetch('https://api.outscraper.com/maps/search-v3', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': OUTSCRAPER_API_KEY!,
    },
    body: JSON.stringify({
      query: query,
      limit: count,
      language: 'fr',
      region: 'FR',
      extract_emails: true,
      extract_phone: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur Outscraper API: ${response.status} - ${errorText}`);
  }

  const data: OutscraperResponse = await response.json();

  return (data.data?.[0] || []).map((item: OutscraperPlace) => ({
    name: item.name,
    company_name: item.name,
    address: item.full_address,
    postal_code: item.postal_code,
    city: item.city,
    phone: item.phone,
    email: item.email,
    website: item.site,
    confidence_score: 85,
    raw_data: item,
  }));
}

// Fonction pour Google Places API
async function searchWithGooglePlaces(
  query: string,
  count: number,
  location?: string,
  postalCode?: string
): Promise<any[]> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.set('query', query);
  url.searchParams.set('key', GOOGLE_PLACES_API_KEY!);
  url.searchParams.set('language', 'fr');
  url.searchParams.set('region', 'fr');

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Erreur Google Places API: ${response.status}`);
  }

  const data: GooglePlacesResponse = await response.json();

  if (data.status !== 'OK') {
    throw new Error(`Google Places API error: ${data.status}`);
  }

  return (data.results || []).slice(0, count).map((item: GooglePlace) => ({
    name: item.name,
    company_name: item.name,
    address: item.formatted_address,
    postal_code: postalCode,
    city: location,
    phone: null,
    email: null,
    website: null,
    confidence_score: 70,
    raw_data: item,
  }));
}

// Fonction pour enrichir avec Hunter.io
async function enrichLeadsWithEmails(leads: any[]): Promise<any[]> {
  const enrichedLeads = [];

  for (const lead of leads) {
    let enrichedLead = { ...lead };

    if (lead.website && !lead.email) {
      try {
        const domain = new URL(lead.website).hostname;
        const response = await fetch(
          `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.data?.emails?.length > 0) {
            enrichedLead.email = data.data.emails[0].value;
            enrichedLead.confidence_score = Math.min((enrichedLead.confidence_score || 0) + 10, 95);
          }
        }
      } catch (error) {
        console.warn('[Lead Search] Hunter.io error for:', lead.website, error);
      }
    }

    enrichedLeads.push(enrichedLead);
  }

  return enrichedLeads;
}

// Fonction pour générer des données démo
function generateDemoLeads(
  profession: string,
  location?: string,
  postalCode?: string,
  count: number = 20
): any[] {
  const leads = [];
  const prenoms = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Michel', 'Catherine', 'Philippe', 'Isabelle', 'François', 'Nathalie'];
  const noms = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau'];
  const rues = ['rue de la République', 'avenue des Champs', 'boulevard Saint-Michel', 'place de la Mairie', 'rue du Commerce'];

  for (let i = 0; i < count; i++) {
    const prenom = prenoms[Math.floor(Math.random() * prenoms.length)];
    const nom = noms[Math.floor(Math.random() * noms.length)];
    const rue = rues[Math.floor(Math.random() * rues.length)];

    leads.push({
      name: `${prenom} ${nom}`,
      company_name: `Cabinet ${nom} - ${profession}`,
      address: `${Math.floor(Math.random() * 200) + 1} ${rue}`,
      postal_code: postalCode || '75015',
      city: location || 'Paris',
      country: 'France',
      phone: `0${Math.floor(Math.random() * 9) + 1} ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)}`,
      email: `contact@cabinet-${nom.toLowerCase()}.fr`,
      website: `https://www.cabinet-${nom.toLowerCase()}.fr`,
      confidence_score: Math.floor(Math.random() * 40) + 60, // 60-100
      raw_data: { source: 'demo', generated_at: new Date().toISOString() },
    });
  }

  return leads;
}

// Fonction pour calculer le score qualité
function calculateQualityScore(lead: any): number {
  let score = 50; // Score de base

  // Bonus pour les informations disponibles
  if (lead.email) score += 20;
  if (lead.phone) score += 15;
  if (lead.website) score += 10;
  if (lead.address) score += 10;
  if (lead.name && lead.name.split(' ').length >= 2) score += 5;

  // Bonus pour la qualité des données
  if (lead.email && lead.email.includes('@') && lead.email.includes('.')) score += 5;
  if (lead.website && lead.website.startsWith('http')) score += 5;

  return Math.min(score, 100);
}

// Fonction pour valider un lead
function validateLead(lead: any): boolean {
  // Vérifications basiques
  if (!lead.name && !lead.company_name) return false;
  if (lead.email && !lead.email.includes('@')) return false;
  if (lead.website && !lead.website.includes('.')) return false;

  return true;
}