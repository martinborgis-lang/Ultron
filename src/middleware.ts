import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { securityMiddleware } from '@/lib/security/security-middleware';

export async function middleware(request: NextRequest) {
  // ✅ SÉCURITÉ : Appliquer les protections de sécurité en premier
  const securityResponse = await securityMiddleware.process(request);

  // Si la sécurité bloque la requête, retourner immédiatement
  if (securityResponse) {
    return securityResponse;
  }

  // Continuer avec l'authentification Supabase
  const authResponse = await updateSession(request);

  // Ajouter les headers de sécurité à la réponse finale
  if (authResponse instanceof NextResponse) {
    securityMiddleware.addSecurityHeaders(authResponse);
  }

  return authResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
