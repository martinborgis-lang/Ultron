import { NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';

export const dynamic = 'force-dynamic';

// Rate limiting cache
const requestCache = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // 10 requests per minute
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const key = `user_me_${ip}`;
  const existing = requestCache.get(key);

  if (!existing || now > existing.resetTime) {
    requestCache.set(key, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (existing.count >= RATE_LIMIT) {
    return false;
  }

  existing.count++;
  return true;
}

export async function GET(request: Request) {
  try {
    // Rate limiting check
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before retrying.' },
        { status: 429 }
      );
    }

    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Retourner les infos de l'utilisateur avec le rôle
    return NextResponse.json({
      user: {
        id: context.user.id,
        email: context.user.email,
        role: context.user.role,
      },
      organization: {
        id: context.organization.id,
        name: context.organization.name,
        data_mode: context.organization.data_mode,
      }
    });

  } catch (error) {
    console.error('Erreur API user/me:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}