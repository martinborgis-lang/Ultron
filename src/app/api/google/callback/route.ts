import { createClient } from '@/lib/supabase/server';
import { exchangeCodeForTokens } from '@/lib/google';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        new URL('/settings?google=error&message=' + encodeURIComponent(error), process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings?google=error&message=missing_params', process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    let stateData: { organization_id: string };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.redirect(
        new URL('/settings?google=error&message=invalid_state', process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL));
    }

    const { data: user } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_id', authUser.id)
      .single();

    if (!user || user.organization_id !== stateData.organization_id) {
      return NextResponse.redirect(
        new URL('/settings?google=error&message=unauthorized', process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    const tokens = await exchangeCodeForTokens(code);

    const { error: updateError } = await supabase
      .from('organizations')
      .update({ google_credentials: tokens })
      .eq('id', stateData.organization_id);

    if (updateError) {
      console.error('Failed to save credentials:', updateError);
      return NextResponse.redirect(
        new URL('/settings?google=error&message=save_failed', process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    return NextResponse.redirect(
      new URL('/settings?google=success', process.env.NEXT_PUBLIC_APP_URL)
    );
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect(
      new URL('/settings?google=error&message=exchange_failed', process.env.NEXT_PUBLIC_APP_URL)
    );
  }
}
