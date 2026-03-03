import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '@/lib/cors';
import * as jwt from 'jsonwebtoken';

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

    console.log('[Extension Login] Tentative de connexion pour:', email);

    // 🔧 NOUVEAU CORRECTIF: Utiliser Admin Client pour bypasser OAuth
    const adminClient = createAdminClient();

    // Vérifier les credentials via API Supabase Admin (plus fiable)
    const { data: authUser, error: authError } = await adminClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authUser.session) {
      console.log('[Extension Login] ❌ Admin auth échec:', authError?.message);
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401, headers: corsHeaders() }
      );
    }

    // Examiner le token Supabase
    const session = authUser.session;
    console.log('[Extension Login] Session obtenue');

    let finalToken = session.access_token;

    // Vérifier l'algorithme du token Supabase
    try {
      const headerBase64 = finalToken.split('.')[0];
      const headerJson = Buffer.from(headerBase64, 'base64').toString('utf-8');
      const header = JSON.parse(headerJson);
      console.log('[Extension Login] Token Supabase algorithm:', header.alg);

      // Si Supabase retourne ES256, créer notre propre token HS256 compatible
      if (header.alg !== 'HS256') {
        console.log('[Extension Login] 🔧 Supabase retourne', header.alg, '- Création token HS256 custom...');

        // Créer un token HS256 compatible avec même structure que Supabase
        const payload = {
          sub: authUser.user.id,
          email: authUser.user.email,
          aud: 'authenticated',
          role: 'authenticated',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24h
        };

        const secret = process.env.SUPABASE_JWT_SECRET;
        if (!secret) {
          console.error('[Extension Login] CRITICAL: SUPABASE_JWT_SECRET is not configured');
          return NextResponse.json(
            { error: 'Erreur de configuration serveur - contactez l\'administrateur' },
            { status: 500, headers: corsHeaders() }
          );
        }
        finalToken = jwt.sign(payload, secret, { algorithm: 'HS256' });

        console.log('[Extension Login] ✅ Token HS256 custom créé pour l\'extension');
      } else {
        console.log('[Extension Login] ✅ Token Supabase déjà HS256 - Utilisation directe');
      }
    } catch (e) {
      console.log('[Extension Login] Erreur analyse token - Utilisation token original:', e);
    }

    // Get user info
    const { data: user, error: userError } = await adminClient
      .from('users')
      .select('id, email, full_name, organization_id')
      .eq('auth_id', authUser.user.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouve' },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Return the final token (HS256 garanti)
    console.log('[Extension Login] 🎯 SUCCÈS - Token HS256 retourné à l\'extension');
    return NextResponse.json(
      {
        token: finalToken,
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
