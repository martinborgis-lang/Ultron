import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { corsHeaders } from '@/lib/cors';
import type { RealtimeAnalysis } from '@/types/meeting';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic();

// Handle preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

const SYSTEM_PROMPT = `Tu es un coach commercial expert pour conseillers en gestion de patrimoine (CGP).
Tu analyses la conversation en temps réel et fournis des suggestions tactiques.

OBJECTIF: Aider le conseiller à convaincre le prospect et gérer les objections.

Tu dois TOUJOURS répondre en JSON valide avec cette structure exacte:
{
  "objectionDetectee": "description de l'objection si détectée dans les propos du prospect, sinon null",
  "reponseObjection": "réponse suggérée pour contrer l'objection, technique de vente adaptée, sinon null",
  "questionSuivante": "prochaine question stratégique à poser pour avancer vers le closing",
  "pointCle": "argument ou point important à mentionner maintenant si opportun, sinon null",
  "tonalite": "Positive" ou "Neutre" ou "Negative"
}

TECHNIQUES DE VENTE À UTILISER:
- Pour objection prix: reformuler en investissement, comparer au coût de l'inaction, fractionner le montant
- Pour objection confiance: social proof, garanties, témoignages, certifications
- Pour objection timing: créer l'urgence, coût du délai, opportunité limitée
- Pour objection "je dois réfléchir": isoler la vraie objection, récapituler les bénéfices

Sois concis, actionnable et adapté au contexte CGP (assurance-vie, PEA, SCPI, immobilier...).`;

/**
 * POST /api/meeting/analyze
 * Analyze transcript in real-time and provide AI suggestions
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const { prospect, transcript, conversationHistory } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript requis' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Build user prompt with context
    let userPrompt = '';

    if (prospect) {
      userPrompt += `CONTEXTE DU PROSPECT:
Nom: ${prospect.prenom || prospect.firstName} ${prospect.nom || prospect.lastName}
Profession: ${prospect.profession || prospect.situationPro || 'Non renseignée'}
Revenus: ${prospect.revenus || prospect.revenus_annuels || 'Non renseignés'}
Patrimoine: ${prospect.patrimoine || prospect.patrimoine_estime || 'Non renseigné'}
Besoins exprimés: ${prospect.besoins || prospect.notes || 'Non renseignés'}
Qualification: ${prospect.qualification || 'Non qualifié'}
Score IA: ${prospect.score_ia || prospect.scoreIa || 'N/A'}

`;
    }

    if (conversationHistory && conversationHistory.length > 0) {
      userPrompt += `HISTORIQUE RÉCENT DE LA CONVERSATION:
${conversationHistory.slice(-5).join('\n')}

`;
    }

    userPrompt += `TRANSCRIPTION EN COURS (dernières phrases):
"${transcript}"

Analyse cette portion de conversation et fournis des suggestions tactiques.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
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
    let analysis: RealtimeAnalysis;
    try {
      analysis = JSON.parse(textContent.text);
    } catch {
      // If JSON parsing fails, create a default structure
      analysis = {
        objectionDetectee: null,
        reponseObjection: null,
        questionSuivante: 'Pouvez-vous me parler de vos objectifs financiers à 5 ans ?',
        pointCle: null,
        tonalite: 'Neutre',
      };
    }

    return NextResponse.json(
      { analysis },
      { headers: corsHeaders() }
    );
  } catch (error) {
    console.error('Meeting analyze error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
