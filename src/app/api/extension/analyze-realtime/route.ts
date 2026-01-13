import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic();

// Handle preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

// POST /api/extension/analyze-realtime - Real-time AI analysis during meeting
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

    // Verify token with Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const { prospect, transcript } = await request.json();

    if (!prospect || !transcript) {
      return NextResponse.json(
        { error: 'Prospect et transcription requis' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Generate real-time AI analysis
    const systemPrompt = `Tu es un assistant specialise dans l'analyse en temps reel de conversations commerciales pour les conseillers en gestion de patrimoine.
Tu analyses la transcription d'une conversation en cours et fournis des suggestions contextuelles.

Tu dois TOUJOURS repondre en JSON valide avec la structure exacte suivante :
{
  "objectionDetectee": "description de l'objection si detectee, sinon null",
  "reponseObjection": "suggestion de reponse a l'objection si detectee, sinon null",
  "questionSuivante": "prochaine question pertinente a poser basee sur la conversation",
  "pointCle": "point important a aborder maintenant si pertinent, sinon null",
  "tonalite": "Positive" ou "Neutre" ou "Negative"
}

Sois concis et actionnable. Analyse le contexte de la conversation pour donner des conseils pertinents.`;

    const userPrompt = `Contexte du prospect :
Nom: ${prospect.prenom} ${prospect.nom}
Situation: ${prospect.situation_pro || 'Non renseignee'}
Revenus: ${prospect.revenus || 'Non renseignes'}
Patrimoine: ${prospect.patrimoine || 'Non renseigne'}
Besoins: ${prospect.besoins || 'Non renseignes'}
Qualification: ${prospect.qualification || 'Non qualifie'}

Transcription recente de la conversation :
"${transcript}"

Analyse cette portion de conversation et fournis des suggestions en temps reel.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
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
        objectionDetectee: null,
        reponseObjection: null,
        questionSuivante: 'Pouvez-vous me parler de vos projets a moyen terme ?',
        pointCle: null,
        tonalite: 'Neutre',
      };
    }

    return NextResponse.json(
      { analysis },
      { headers: corsHeaders() }
    );
  } catch (error) {
    console.error('Extension realtime analyze error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse temps reel' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
