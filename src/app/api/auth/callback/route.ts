import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);

  console.log('[API Auth Callback] ====== DÉBUT ======');
  console.log('[API Auth Callback] Full URL:', request.url);

  const code = url.searchParams.get('code');
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') || url.searchParams.get('token_type') || 'email';
  const next = url.searchParams.get('next') ?? '/dashboard';

  console.log('[API Auth Callback] Code:', code ? 'PRESENT' : 'ABSENT');
  console.log('[API Auth Callback] Token hash:', token_hash ? 'PRESENT' : 'ABSENT');
  console.log('[API Auth Callback] Type:', type);

  const supabase = await createClient();

  try {
    // Échanger le code ou vérifier le token
    if (code) {
      console.log('[API Auth Callback] Exchanging code for session...');
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('[API Auth Callback] Exchange error:', error.message);
        return NextResponse.redirect(
          `${url.origin}/login?error=callback_error&message=${encodeURIComponent(error.message)}`
        );
      }

      console.log('[API Auth Callback] ✅ Session created for:', data.user?.email);

    } else if (token_hash) {
      console.log('[API Auth Callback] Verifying OTP...');
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: (type as any) || 'email',
      });

      if (error) {
        console.error('[API Auth Callback] OTP error:', error.message);
        return NextResponse.redirect(`${url.origin}/login?error=verification_failed`);
      }

      console.log('[API Auth Callback] ✅ OTP verified for:', data.user?.email);
    } else {
      console.error('[API Auth Callback] No code or token_hash');
      return NextResponse.redirect(`${url.origin}/login?error=no_code`);
    }

    // Récupérer l'utilisateur authentifié
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('[API Auth Callback] No user after auth');
      return NextResponse.redirect(`${url.origin}/login?error=no_user`);
    }

    console.log('[API Auth Callback] User authenticated:', user.email, 'ID:', user.id);

    // Pour les inscriptions (signup), vérifier si l'utilisateur a une organisation
    if (type === 'signup' || type === 'email') {
      // CORRECTION CLÉ : Ne pas utiliser .single() qui crash si 0 rows
      const { data: usersData, error: userError } = await supabase
        .from('users')
        .select('organization_id, full_name')
        .eq('auth_id', user.id);
        // PAS de .single() ici !

      if (userError) {
        console.error('[API Auth Callback] Error fetching user:', userError);
      }

      console.log('[API Auth Callback] Users query result:', usersData);

      // Premier résultat ou undefined si pas trouvé
      const userData = usersData?.[0];

      // L'utilisateur a besoin de compléter son inscription si :
      // - Il n'existe pas dans public.users
      // - OU il n'a pas d'organisation
      // - OU il n'a pas de nom complet
      const needsCompleteRegistration =
        !userData ||
        !userData.organization_id ||
        !userData.full_name;

      if (needsCompleteRegistration) {
        console.log('[API Auth Callback] → Needs complete registration');
        return NextResponse.redirect(`${url.origin}/complete-registration`);
      }

      console.log('[API Auth Callback] ✅ User already has organization');
    }

    // Pour recovery (reset password), rediriger vers reset-password
    if (type === 'recovery') {
      console.log('[API Auth Callback] → Recovery, redirecting to /reset-password');
      return NextResponse.redirect(`${url.origin}/reset-password`);
    }

    // Sinon, rediriger vers le dashboard ou la destination demandée
    console.log('[API Auth Callback] → Redirecting to', next);
    return NextResponse.redirect(`${url.origin}${next}`);

  } catch (error) {
    console.error('[API Auth Callback] Unexpected error:', error);
    return NextResponse.redirect(`${url.origin}/login?error=unexpected_error`);
  }
}
