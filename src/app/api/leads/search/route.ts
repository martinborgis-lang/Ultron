import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Clés API
const OUTSCRAPER_API_KEY = process.env.OUTSCRAPER_API_KEY;
const PAPPERS_API_KEY = process.env.PAPPERS_API_KEY;
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
    const body = await request.json();
    const { category, searchTerm, location, postalCode, count } = body;

    // Validation des paramètres
    if (!category) {
      return NextResponse.json(
        { error: 'La catégorie est obligatoire' },
        { status: 400 }
      );
    }

    if (!searchTerm?.trim()) {
      return NextResponse.json(
        { error: 'Le terme de recherche est obligatoire' },
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
      category, searchTerm, location, postalCode, count,
      organizationId, userId, creditsAvailable: available
    });

    // 5. Créer l'entrée de recherche
    const { data: search, error: searchError } = await supabase
      .from('lead_searches')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        search_type: category,
        profession: searchTerm.trim(),
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

    let leads: any[] = [];
    let apiSource = 'demo';

    try {
      // ══════════════════════════════════════════════════════════════
      // ROUTER VERS LA BONNE API SELON LA CATÉGORIE
      // ══════════════════════════════════════════════════════════════

      if (category === 'commercants' || category === 'professions_liberales') {
        // OUTSCRAPER pour Google Maps
        if (OUTSCRAPER_API_KEY) {
          console.log('[Lead Search] Using Outscraper API');
          leads = await searchWithOutscraper(searchTerm, location, postalCode, count);
          apiSource = 'outscraper';
        } else {
          console.log('[Lead Search] Using demo data (Outscraper not configured)');
          leads = generateDemoLeads(searchTerm, location, postalCode, count);
          apiSource = 'demo';
        }

      } else if (category === 'dirigeants') {
        // PAPPERS pour les dirigeants
        if (PAPPERS_API_KEY) {
          console.log('[Lead Search] Using Pappers API');
          leads = await searchWithPappers(searchTerm, location, postalCode, count);
          apiSource = 'pappers';
        } else {
          console.log('[Lead Search] Using demo data (Pappers not configured)');
          leads = generateDemoDirigeantsLeads(searchTerm, location, postalCode, count);
          apiSource = 'demo';
        }
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
        profession: lead.profession || searchTerm,
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

      const response = {
        search_id: search.id,
        leads: savedLeads || [],
        creditsUsed,
        creditsRemaining: available - creditsUsed,
        searchDuration,
        source: apiSource,
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

// ══════════════════════════════════════════════════════════════
// OUTSCRAPER - Google Maps (Commerçants & Professions Libérales)
// ══════════════════════════════════════════════════════════════
async function searchWithOutscraper(
  searchTerm: string,
  location: string,
  postalCode: string,
  count: number
): Promise<any[]> {
  // Construire la requête
  const query = `${searchTerm} ${location} ${postalCode}`.trim();

  console.log('[Outscraper] Query:', query);

  const response = await fetch('https://api.app.outscraper.com/maps/search-v3?' + new URLSearchParams({
    query: query,
    limit: count.toString(),
    language: 'fr',
    region: 'FR',
    async: 'false',
  }), {
    method: 'GET',
    headers: {
      'X-API-KEY': OUTSCRAPER_API_KEY!,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Outscraper] Error:', errorText);
    throw new Error('Erreur API Outscraper');
  }

  const data = await response.json();
  console.log('[Outscraper] Results:', data.data?.[0]?.length || 0);

  // Outscraper retourne un tableau de tableaux
  const results = data.data?.[0] || [];

  return results.map((item: any) => ({
    name: item.name,
    company_name: item.name,
    profession: item.type || item.subtypes?.[0],
    address: item.full_address || item.street,
    postal_code: item.postal_code,
    city: item.city,
    phone: item.phone,
    email: item.email,
    website: item.site ? (item.site.startsWith('http') ? item.site : `https://${item.site}`) : null,
    confidence_score: 85,
    raw_data: {
      place_id: item.place_id,
      rating: item.rating,
      reviews: item.reviews,
      working_hours: item.working_hours,
    },
  }));
}

// ══════════════════════════════════════════════════════════════
// PAPPERS - Dirigeants d'entreprises
// ══════════════════════════════════════════════════════════════
async function searchWithPappers(
  sector: string,
  location: string,
  postalCode: string,
  count: number
): Promise<any[]> {
  console.log('[Pappers] Search:', sector, location, postalCode);

  // Construire les paramètres
  const params: Record<string, string> = {
    api_token: PAPPERS_API_KEY!,
    par_page: count.toString(),
    precision: 'standard',
  };

  // Ajouter les filtres
  if (postalCode) {
    params.code_postal = postalCode;
  } else if (location) {
    params.ville = location;
  }

  if (sector) {
    params.objet_social = sector;
  }

  // Filtrer pour avoir des entreprises actives avec dirigeants
  params.statut = 'active';

  const response = await fetch('https://api.pappers.fr/v2/recherche?' + new URLSearchParams(params), {
    method: 'GET',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Pappers] Error:', errorText);
    throw new Error('Erreur API Pappers');
  }

  const data = await response.json();
  console.log('[Pappers] Results:', data.resultats?.length || 0);

  return (data.resultats || []).map((item: any) => {
    // Trouver le dirigeant principal
    const dirigeant = item.dirigeants?.[0];

    return {
      name: dirigeant ? `${dirigeant.prenom || ''} ${dirigeant.nom || ''}`.trim() : item.nom_entreprise,
      company_name: item.nom_entreprise,
      position: dirigeant?.qualite || 'Dirigeant',
      profession: item.objet_social?.substring(0, 100),
      address: item.siege?.adresse_ligne_1,
      postal_code: item.siege?.code_postal,
      city: item.siege?.ville,
      phone: null, // Pappers ne donne pas le téléphone en recherche basique
      email: null, // Idem pour l'email
      website: null,
      confidence_score: 80,
      raw_data: {
        siren: item.siren,
        siret: item.siege?.siret,
        date_creation: item.date_creation,
        forme_juridique: item.forme_juridique,
        dirigeants: item.dirigeants,
        capital: item.capital_formate,
        effectif: item.effectif,
      },
    };
  });
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

// Fonction pour générer des données démo (commerçants/professions libérales)
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
      profession,
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

// Fonction pour générer des données démo dirigeants
function generateDemoDirigeantsLeads(
  sector: string,
  location?: string,
  postalCode?: string,
  count: number = 20
): any[] {
  const leads = [];
  const prenoms = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Michel', 'Catherine', 'Philippe', 'Isabelle', 'François', 'Nathalie'];
  const noms = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau'];
  const positions = ['PDG', 'Directeur Général', 'Gérant', 'Directeur', 'Président'];
  const rues = ['rue de la République', 'avenue des Champs', 'boulevard Saint-Michel', 'place de la Mairie', 'rue du Commerce'];

  for (let i = 0; i < count; i++) {
    const prenom = prenoms[Math.floor(Math.random() * prenoms.length)];
    const nom = noms[Math.floor(Math.random() * noms.length)];
    const position = positions[Math.floor(Math.random() * positions.length)];
    const rue = rues[Math.floor(Math.random() * rues.length)];
    const siren = Math.random().toString().slice(2, 11);

    leads.push({
      name: `${prenom} ${nom}`,
      company_name: `${nom} ${sector} SAS`,
      position,
      profession: sector,
      address: `${Math.floor(Math.random() * 200) + 1} ${rue}`,
      postal_code: postalCode || '75015',
      city: location || 'Paris',
      country: 'France',
      phone: null,
      email: null,
      website: null,
      confidence_score: Math.floor(Math.random() * 30) + 70, // 70-100
      raw_data: {
        source: 'demo',
        siren: siren,
        capital: `${Math.floor(Math.random() * 500) + 50}000 EUR`,
        effectif: `${Math.floor(Math.random() * 50) + 5} salariés`,
        generated_at: new Date().toISOString()
      },
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