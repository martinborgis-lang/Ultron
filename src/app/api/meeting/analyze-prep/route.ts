import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { validateExtensionToken } from '@/lib/extension-auth';

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

export async function POST(request: NextRequest) {
  try {
    // Valider le token d'extension (custom HS256 ou Supabase natif)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[analyze-prep] Pas de header Authorization');
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const auth = await validateExtensionToken(token);

    if (!auth) {
      console.log('[analyze-prep] ❌ Token invalide');
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    console.log('[analyze-prep] ✅ User authentifié:', auth.dbUser.email);

    const body = await request.json();
    const { prospect, interactions } = body as {
      prospect: Prospect;
      interactions: Interaction[];
    };

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

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
      return NextResponse.json({ error: 'Réponse inattendue' }, { status: 500 });
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
      return NextResponse.json({ analysis });
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
      });
    }
  } catch (error: unknown) {
    console.error('Erreur analyze-prep:', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
