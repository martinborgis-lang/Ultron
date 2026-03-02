import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { exchangeCodeForTokens, OAuthType } from '@/lib/google';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    console.log('🔐 OAuth callback started at:', new Date().toISOString());

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('📥 OAuth params:', { hasCode: !!code, hasState: !!state, error });

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        new URL('/settings?google=error&message=' + encodeURIComponent(error), process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    if (!code || !state) {
      console.error('❌ Missing OAuth params:', { code: !!code, state: !!state });
      return NextResponse.redirect(
        new URL('/settings?google=error&message=missing_params', process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    let stateData: { organization_id: string; user_id?: string; type?: OAuthType };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      console.log('📄 Decoded state data:', stateData);
    } catch {
      console.error('❌ Failed to parse state data');
      return NextResponse.redirect(
        new URL('/settings?google=error&message=invalid_state', process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    console.log('👤 Auth user:', { id: authUser?.id, email: authUser?.email });

    if (!authUser) {
      console.error('❌ No authenticated user');
      return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL));
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, organization_id, email')
      .eq('auth_id', authUser.id)
      .single();

    console.log('👥 Ultron user found:', {
      id: user?.id,
      organization_id: user?.organization_id,
      email: user?.email,
      stateOrgId: stateData.organization_id
    });

    if (!user || user.organization_id !== stateData.organization_id) {
      console.error('❌ User unauthorized or org mismatch');
      return NextResponse.redirect(
        new URL('/settings?google=error&message=unauthorized', process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    const tokens = await exchangeCodeForTokens(code);
    console.log('🔑 Tokens received:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      tokenLength: tokens.access_token?.length,
      refreshTokenLength: tokens.refresh_token?.length,
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'NONE'
    });

    // 🔴 FIX: Vérifier que le refresh_token est présent
    if (!tokens.refresh_token) {
      console.error('❌ ERREUR CRITIQUE: Pas de refresh_token reçu de Google!');
      console.error('❌ Ceci arrive quand prompt=consent n\'est pas défini dans generateAuthUrl');
      return NextResponse.redirect(
        new URL('/settings?google=error&message=no_refresh_token', process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    const type = stateData.type || 'organization';
    console.log(`🎯 OAuth type determined: "${type}"`);

    const adminClient = createAdminClient();

    if (type === 'gmail') {
      console.log('📧 Saving Gmail credentials to user:', user.id);

      const { data: updateResult, error: updateError } = await adminClient
        .from('users')
        .update({
          gmail_credentials: tokens,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select('id, email, gmail_credentials, updated_at');

      console.log('💾 Gmail update result:', {
        success: !updateError,
        error: updateError?.message,
        updatedUser: updateResult?.[0] ? {
          id: updateResult[0].id,
          email: updateResult[0].email,
          hasGmailCredentials: !!updateResult[0].gmail_credentials,
          updatedAt: updateResult[0].updated_at
        } : null
      });

      if (updateError) {
        console.error('Failed to save Gmail credentials:', updateError);
        return NextResponse.redirect(
          new URL('/settings/team?gmail=error&message=save_failed', process.env.NEXT_PUBLIC_APP_URL)
        );
      }

      console.log('✅ Gmail credentials saved successfully');
      return NextResponse.redirect(
        new URL('/settings/team?gmail=success', process.env.NEXT_PUBLIC_APP_URL)
      );
    } else {
      console.log('🏢 Saving organization credentials to org:', stateData.organization_id);

      // Store organization credentials (Sheets + Drive)
      const { data: updateResult, error: updateError } = await supabase
        .from('organizations')
        .update({
          google_credentials: tokens,
          updated_at: new Date().toISOString()
        })
        .eq('id', stateData.organization_id)
        .select('id, name, google_credentials, updated_at');

      console.log('💾 Organization update result:', {
        success: !updateError,
        error: updateError?.message,
        updatedOrg: updateResult?.[0] ? {
          id: updateResult[0].id,
          name: updateResult[0].name,
          hasGoogleCredentials: !!updateResult[0].google_credentials,
          updatedAt: updateResult[0].updated_at
        } : null
      });

      if (updateError) {
        console.error('Failed to save credentials:', updateError);
        return NextResponse.redirect(
          new URL('/settings?google=error&message=save_failed', process.env.NEXT_PUBLIC_APP_URL)
        );
      }

      console.log('✅ Organization credentials saved successfully');
      return NextResponse.redirect(
        new URL('/settings?google=success', process.env.NEXT_PUBLIC_APP_URL)
      );
    }
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect(
      new URL('/settings?google=error&message=exchange_failed', process.env.NEXT_PUBLIC_APP_URL)
    );
  }
}
