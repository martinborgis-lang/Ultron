import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface ExtensionTokenPayload {
  sub: string;        // user ID
  email: string;
  aud: string;        // 'authenticated'
  role: string;       // 'authenticated'
  iat: number;
  exp: number;
}

/**
 * Valide un token d'extension (custom HS256 ou Supabase natif)
 * Retourne les infos utilisateur si le token est valide
 */
export async function validateExtensionToken(token: string) {
  try {
    // Valider le format JWT de base (3 parties séparées par des points)
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token format invalide - doit être au format JWT (header.payload.signature)');
    }

    // D'abord essayer de décoder le token pour voir son algorithme
    const headerBase64 = parts[0];
    const headerJson = Buffer.from(headerBase64, 'base64').toString('utf-8');
    const header = JSON.parse(headerJson);

    let decoded: ExtensionTokenPayload;

    if (header.alg === 'HS256') {
      // Token custom ou Supabase HS256 - Valider avec jwt.verify
      const secret = process.env.SUPABASE_JWT_SECRET;
      if (!secret) {
        console.error('[Extension Auth] CRITICAL: SUPABASE_JWT_SECRET is not configured');
        throw new Error('Server configuration error: JWT secret not available');
      }
      decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as ExtensionTokenPayload;
    } else {
      // Token ES256 ou autre - Essayer validation Supabase standard
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        throw new Error(`Supabase token validation failed: ${error?.message}`);
      }

      decoded = {
        sub: user.id,
        email: user.email!,
        aud: 'authenticated',
        role: 'authenticated',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
    }

    // Récupérer les infos utilisateur depuis la DB
    const adminClient = createAdminClient();
    const { data: user, error: userError } = await adminClient
      .from('users')
      .select('id, email, full_name, organization_id, role')
      .eq('auth_id', decoded.sub)
      .single();

    if (userError || !user) {
      throw new Error(`User not found: ${userError?.message}`);
    }

    return {
      authUser: {
        id: decoded.sub,
        email: decoded.email,
      },
      dbUser: user,
    };

  } catch (error) {
    console.error('[Extension Auth] ❌ Token validation failed:', error);
    return null;
  }
}

/**
 * Middleware-like function pour les APIs d'extension
 */
export async function requireExtensionAuth(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      error: NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.replace('Bearer ', '');
  const auth = await validateExtensionToken(token);

  if (!auth) {
    return {
      error: NextResponse.json(
        { error: 'Token invalide - veuillez vous reconnecter via le popup Ultron' },
        { status: 401 }
      ),
    };
  }

  return { auth };
}