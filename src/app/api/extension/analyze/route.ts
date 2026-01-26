import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { corsHeaders } from '@/lib/cors';
import { validateExtensionToken } from '@/lib/extension-auth';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic();

// Handle preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

// POST /api/extension/analyze - AI analysis for meeting preparation
export async function POST(request: NextRequest) {
  try {
    // Verify authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non authentifie' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const auth = await validateExtensionToken(token);

    if (!auth) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const { prospect } = await request.json();

    if (!prospect) {
      return NextResponse.json(
        { error: 'Prospect requis' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Generate AI analysis
    const systemPrompt = `Tu es un assistant specialise dans la preparation de rendez-vous pour les conseillers en gestion de patrimoine.
Ton role est d'analyser le profil d'un prospect et de fournir des suggestions pertinentes pour le rendez-vous.

Tu dois TOUJOURS repondre en JSON valide avec la structure exacte suivante :
{
  "questionsSuggerees": ["question 1", "question 2", "question 3"],
  "argumentsCles": ["argument 1", "argument 2", "argument 3"],
  "objectionsProba": ["objection 1", "objection 2", "objection 3"]
}

Sois concis et pertinent. Maximum 3-4 elements par categorie.`;

    // Support both Sheet and CRM field names
    const firstName = prospect.prenom || prospect.firstName || prospect.first_name || '';
    const lastName = prospect.nom || prospect.lastName || prospect.last_name || '';
    const situationPro = prospect.situation_pro || prospect.profession || 'Non renseignee';
    const revenus = prospect.revenus || prospect.revenus_annuels || 'Non renseignes';
    const patrimoine = prospect.patrimoine || prospect.patrimoine_estime || 'Non renseigne';
    const besoins = prospect.besoins || prospect.notes || 'Non renseignes';
    const notesAppel = prospect.notes_appel || prospect.notes || 'Aucune note';
    const qualification = prospect.qualification || 'Non qualifie';

    const userPrompt = `Analyse ce prospect pour preparer un rendez-vous :

Nom: ${firstName} ${lastName}
Situation professionnelle: ${situationPro}
Revenus: ${revenus}
Patrimoine: ${patrimoine}
Besoins exprimes: ${besoins}
Notes de l'appel precedent: ${notesAppel}
Qualification: ${qualification}

Fournis des suggestions pour ce rendez-vous.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    });

    // Extract text from response
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    // Parse JSON response
    let analysis;
    try {
      analysis = JSON.parse(textContent.text);
    } catch {
      // If JSON parsing fails, create a default structure
      analysis = {
        questionsSuggerees: [
          'Quels sont vos objectifs patrimoniaux a 5-10 ans ?',
          'Quelle est votre tolerance au risque ?',
          'Avez-vous des projets specifiques a financer ?',
        ],
        argumentsCles: [
          'Diversification du patrimoine',
          'Optimisation fiscale',
          'Preparation de la retraite',
        ],
        objectionsProba: [
          'Le timing n\'est pas le bon',
          'Je dois en parler avec mon conjoint',
          'Je veux comparer avec d\'autres offres',
        ],
      };
    }

    return NextResponse.json(
      { analysis },
      { headers: corsHeaders() }
    );
  } catch (error) {
    console.error('Extension analyze error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
