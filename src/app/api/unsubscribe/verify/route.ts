import { NextRequest, NextResponse } from 'next/server';
import { verifyUnsubscribeToken } from '@/lib/gdpr/unsubscribe-token';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ valid: false, error: 'Token manquant' });
  }

  const payload = verifyUnsubscribeToken(token);

  if (!payload) {
    return NextResponse.json({ valid: false, error: 'Lien expiré ou invalide' });
  }

  return NextResponse.json({
    valid: true,
    email: payload.email
  });
}