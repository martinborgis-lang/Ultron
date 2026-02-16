import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { validateExtensionToken } from '@/lib/extension-auth';
import { corsHeaders } from '@/lib/cors';

interface Prospect {
  prenom: string;
  nom: string;
  age: string;
  situation_pro: string;
  revenus: string;
  patrimoine: string;
  qualification: string;
  score: number;
  besoins: string;
  notes_appel: string;
  justification: string;
}

interface Interaction {
  date: string;
  description: string;
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('[analyze-prep] 🟢 Début requête analyze-prep');

    // Valider le token d'extension (custom HS256 ou Supabase natif)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[analyze-prep] ❌ Pas de header Authorization');
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401, headers: corsHeaders() });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('[analyze-prep] 🔑 Token présent (longueur:', token.length, ')');

    let auth;
    try {
      auth = await validateExtensionToken(token);
    } catch (tokenError) {
      console.error('[analyze-prep] ❌ Erreur validation token:', tokenError);
      return NextResponse.json({ error: 'Erreur validation token: ' + (tokenError as Error).message }, { status: 401, headers: corsHeaders() });
    }

    if (!auth) {
      console.log('[analyze-prep] ❌ Token invalide');
      return NextResponse.json({ error: 'Token invalide' }, { status: 401, headers: corsHeaders() });
    }

    console.log('[analyze-prep] ✅ User authentifié:', auth.dbUser.email);

    let body;
    try {
      body = await request.json();
      console.log('[analyze-prep] 📝 Body parsé, keys:', Object.keys(body));
    } catch (jsonError) {
      console.error('[analyze-prep] ❌ Erreur parsing JSON body:', jsonError);
      return NextResponse.json({ error: 'Body JSON invalide: ' + (jsonError as Error).message }, { status: 400, headers: corsHeaders() });
    }

    const { prospect, interactions } = body as {
      prospect: Prospect;
      interactions: Interaction[];
    };

    if (!prospect) {
      console.log('[analyze-prep] ❌ Prospect manquant dans le body');
      return NextResponse.json({ error: 'Prospect requis' }, { status: 400, headers: corsHeaders() });
    }

    console.log('[analyze-prep] 👤 Prospect:', `${prospect.prenom} ${prospect.nom}`, 'Interactions:', interactions?.length || 0);

    console.log('[analyze-prep] 🤖 Initialisation Anthropic...');

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[analyze-prep] ❌ ANTHROPIC_API_KEY manquante');
      return NextResponse.json({ error: 'Configuration API manquante' }, { status: 500, headers: corsHeaders() });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    console.log('[analyze-prep] ✅ Anthropic initialisé');

    const systemPrompt = `Tu es un expert en gestion de patrimoine et en techniques de vente consultative.

Tu dois analyser un prospect et préparer un conseiller pour son RDV.

Retourne un JSON avec cette structure exacte :
{
  "questionsSuggerees": ["question 1", "question 2", ...],  // 5-7 questions pertinentes à poser
  "argumentsCles": ["argument 1", "argument 2", ...],       // 3-5 arguments de vente adaptés au profil
  "pointsAttention": ["point 1", "point 2", ...],          // 3-5 points à surveiller
  "objectionsProba": ["objection 1", "objection 2", ...],  // 3-5 objections probables avec réponses suggérées
  "profilPsycho": "Description du profil comportemental"   // 2-3 phrases sur le type de client
}

Adapte ton analyse au profil financier et aux besoins exprimés.
Sois précis et actionnable.`;

    const userPrompt = `Analyse ce prospect pour préparer le RDV :

PROFIL :
- Nom : ${prospect.prenom} ${prospect.nom}
- Âge : ${prospect.age || 'Non renseigné'}
- Situation pro : ${prospect.situation_pro || 'Non renseigné'}
- Revenus : ${prospect.revenus || 'Non renseigné'}
- Patrimoine : ${prospect.patrimoine || 'Non renseigné'}
- Qualification : ${prospect.qualification || 'Non qualifié'} (Score: ${prospect.score}%)

BESOINS EXPRIMÉS :
${prospect.besoins || 'Non renseigné'}

NOTES DE L'APPEL PRÉCÉDENT :
${prospect.notes_appel || 'Aucune note'}

HISTORIQUE DES INTERACTIONS :
${interactions.map((i: Interaction) => `- ${i.date} : ${i.description}`).join('\n') || 'Aucune interaction'}

ANALYSE IA PRÉCÉDENTE :
${prospect.justification || 'Aucune'}

Génère l'analyse JSON.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Réponse inattendue' }, { status: 500, headers: corsHeaders() });
    }

    // Parser le JSON
    try {
      // Nettoyer la réponse (enlever les backticks markdown si présents)
      let jsonText = content.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7);
      }
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }

      const analysis = JSON.parse(jsonText.trim());
      return NextResponse.json({ analysis }, { headers: corsHeaders() });
    } catch {
      console.error('Erreur parsing JSON:', content.text);
      return NextResponse.json({
        analysis: {
          questionsSuggerees: [
            'Quels sont vos objectifs patrimoniaux à 5 ans ?',
            'Quelle est votre tolérance au risque ?',
            'Avez-vous des projets importants à financer ?',
          ],
          argumentsCles: [
            'Analyse personnalisée de votre situation',
            'Accompagnement sur mesure',
          ],
          pointsAttention: ['Vérifier les informations financières'],
          objectionsProba: ['Besoin de réfléchir', 'Comparer avec d\'autres offres'],
          profilPsycho: 'Analyse non disponible - données insuffisantes.',
        },
      }, { headers: corsHeaders() });
    }
  } catch (error: unknown) {
    console.error('Erreur analyze-prep:', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders() });
  }
}
