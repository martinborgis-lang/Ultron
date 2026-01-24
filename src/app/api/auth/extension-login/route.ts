import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

// Handle preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

// POST /api/auth/extension-login - Login from Chrome extension
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Use Supabase auth to sign in
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    console.log('[Extension Login] Tentative de connexion pour:', email);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session) {
      console.log('[Extension Login] ❌ Échec auth:', authError?.message);
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401, headers: corsHeaders() }
      );
    }

    // Log TRÈS détaillé pour diagnostic
    console.log('[Extension Login] ✅ Auth réussie pour:', authData.user.email);
    console.log('[Extension Login] User ID:', authData.user.id);
    console.log('[Extension Login] Auth provider:', authData.user.app_metadata?.provider || 'email');

    // Examiner la structure de la session
    const session = authData.session;
    console.log('[Extension Login] Session keys:', Object.keys(session));
    console.log('[Extension Login] access_token existe:', !!session.access_token);
    console.log('[Extension Login] provider_token existe:', !!session.provider_token);
    console.log('[Extension Login] refresh_token existe:', !!session.refresh_token);

    // Vérifier les deux tokens s'ils existent
    const accessToken = session.access_token;
    const providerToken = session.provider_token;

    console.log('[Extension Login] access_token preview:', accessToken?.substring(0, 50) + '...');
    if (providerToken) {
      console.log('[Extension Login] ⚠️ provider_token EXISTE:', providerToken.substring(0, 50) + '...');
    }

    // Vérifier l'algorithme du access_token
    try {
      const headerBase64 = accessToken.split('.')[0];
      const headerJson = Buffer.from(headerBase64, 'base64').toString('utf-8');
      const header = JSON.parse(headerJson);
      console.log('[Extension Login] access_token algorithm:', header.alg);
      console.log('[Extension Login] access_token type:', header.typ);

      if (header.alg !== 'HS256') {
        console.error('[Extension Login] ⚠️ CRITIQUE: access_token n\'est PAS HS256!');
        console.error('[Extension Login] Algo détecté:', header.alg);
        console.error('[Extension Login] Ceci est ANORMAL - Supabase devrait toujours retourner HS256');

        // Si provider_token existe et access_token est ES256, c'est très bizarre
        if (providerToken) {
          try {
            const providerHeader = JSON.parse(Buffer.from(providerToken.split('.')[0], 'base64').toString('utf-8'));
            console.log('[Extension Login] provider_token algorithm:', providerHeader.alg);
          } catch {}
        }
      } else {
        console.log('[Extension Login] ✅ access_token est bien HS256 (Supabase)');
      }
    } catch (e) {
      console.log('[Extension Login] Erreur décodage header JWT:', e);
    }

    // Get user info
    const adminClient = createAdminClient();
    const { data: user, error: userError } = await adminClient
      .from('users')
      .select('id, email, full_name, organization_id')
      .eq('auth_id', authData.user.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouve' },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Return the access token for the extension to use
    return NextResponse.json(
      {
        token: authData.session.access_token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          organization_id: user.organization_id,
        },
      },
      { headers: corsHeaders() }
    );
  } catch (error) {
    console.error('Extension login error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la connexion' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
