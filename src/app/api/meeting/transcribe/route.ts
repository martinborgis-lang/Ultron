import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getDeepgramApiKey, getDeepgramWebSocketUrl } from '@/lib/deepgram';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

// Handle preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

/**
 * GET /api/meeting/transcribe
 * Returns Deepgram WebSocket URL and temporary credentials for streaming transcription
 */
export async function GET(request: NextRequest) {
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

    // Verify token with Supabase
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

    // Get Deepgram credentials
    const apiKey = getDeepgramApiKey();
    const websocketUrl = getDeepgramWebSocketUrl({
      model: 'nova-2',
      language: 'fr',
      punctuate: true,
      interim_results: true,
    });

    return NextResponse.json(
      {
        websocket_url: websocketUrl,
        api_key: apiKey,
        config: {
          model: 'nova-2',
          language: 'fr',
          sample_rate: 16000,
          encoding: 'linear16',
        },
      },
      { headers: corsHeaders() }
    );
  } catch (error) {
    console.error('Meeting transcribe error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des credentials' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
