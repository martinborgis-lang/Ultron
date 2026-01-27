import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type'); // 'signup', 'recovery', 'invite'
  const next = searchParams.get('next');

  console.log('[API Auth Callback] Code:', code ? 'present' : 'missing');
  console.log('[API Auth Callback] Type:', type);

  if (code) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[API Auth Callback] Error exchanging code:', error.message);
      return NextResponse.redirect(
        `${origin}/login?error=callback_error&message=${encodeURIComponent(error.message)}`
      );
    }

    console.log('[API Auth Callback] Session created for:', data.user?.email);

    // Pour les inscriptions (signup), vérifier si l'utilisateur a une organisation
    if (type === 'signup' || type === 'email') {
      // Vérifier si l'utilisateur a déjà une organisation
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id, full_name')
        .eq('auth_id', data.user?.id)
        .single();

      if (!userData?.organization_id || !userData?.full_name) {
        // Pas d'organisation → compléter l'inscription
        console.log('[API Auth Callback] Redirecting to complete-registration');
        return NextResponse.redirect(`${origin}/complete-registration`);
      }
    }

    // Pour recovery (reset password), rediriger vers reset-password
    if (type === 'recovery') {
      console.log('[API Auth Callback] Redirecting to reset-password');
      return NextResponse.redirect(`${origin}/reset-password`);
    }

    // Sinon, rediriger vers le dashboard ou la destination demandée
    const redirectTo = next || '/dashboard';
    console.log('[API Auth Callback] Redirecting to:', redirectTo);
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // Pas de code → erreur
  console.error('[API Auth Callback] No code provided');
  return NextResponse.redirect(`${origin}/login?error=no_code&message=Lien de vérification invalide`);
}
