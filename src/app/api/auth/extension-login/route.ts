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

    // Log détaillé du token pour diagnostic
    const accessToken = authData.session.access_token;
    console.log('[Extension Login] ✅ Auth réussie pour:', authData.user.email);
    console.log('[Extension Login] Token preview:', accessToken.substring(0, 50) + '...');

    // Vérifier l'algorithme du token
    try {
      const headerBase64 = accessToken.split('.')[0];
      const headerJson = Buffer.from(headerBase64, 'base64').toString('utf-8');
      const header = JSON.parse(headerJson);
      console.log('[Extension Login] Token algorithm:', header.alg);
      console.log('[Extension Login] Token type:', header.typ);

      if (header.alg !== 'HS256') {
        console.error('[Extension Login] ⚠️ ATTENTION: Token NON-Supabase détecté! Algo:', header.alg);
        console.error('[Extension Login] Ce token ne fonctionnera pas avec l\'API extension!');
      } else {
        console.log('[Extension Login] ✅ Token Supabase valide (HS256)');
      }
    } catch (e) {
      console.log('[Extension Login] Impossible de décoder le header JWT');
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
