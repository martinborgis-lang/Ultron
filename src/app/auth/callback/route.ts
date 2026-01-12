import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  console.log('[Auth Callback] Params:', { code: !!code, token_hash: !!token_hash, type });

  const supabase = await createClient();

  // Handle invitation/signup token (from inviteUserByEmail)
  if (token_hash && (type === 'invite' || type === 'signup' || type === 'email' || type === 'recovery')) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'invite' | 'signup' | 'email' | 'recovery',
    });

    if (!error) {
      console.log('[Auth Callback] OTP verified, redirecting to set-password');
      // Redirect to set password page
      return NextResponse.redirect(`${origin}/auth/set-password`);
    }

    console.error('[Auth Callback] OTP verification error:', error);
    return NextResponse.redirect(`${origin}/login?error=invalid_token&message=${encodeURIComponent(error.message)}`);
  }

  // Handle OAuth code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      console.log('[Auth Callback] Code exchanged, redirecting to dashboard');
      return NextResponse.redirect(`${origin}/dashboard`);
    }

    console.error('[Auth Callback] Code exchange error:', error);
    return NextResponse.redirect(`${origin}/login?error=auth_error&message=${encodeURIComponent(error.message)}`);
  }

  // No valid params, redirect to login
  console.log('[Auth Callback] No valid params, redirecting to login');
  return NextResponse.redirect(`${origin}/login?error=missing_params`);
}
