import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST /api/test-invitation - Test d'envoi d'invitation Supabase
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    // Create admin client like in the team API
    const adminAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Test invitation with current config
    console.log('[Test Invitation] Sending to:', email);
    console.log('[Test Invitation] Redirect URL:', `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`);

    const { data: inviteData, error: inviteError } = await adminAuth.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: {
        full_name: 'Test Invitation',
        role: 'conseiller',
        test: true
      },
    });

    if (inviteError) {
      console.error('[Test Invitation] Error:', inviteError);
      return NextResponse.json({
        success: false,
        error: inviteError.message,
        details: inviteError
      }, { status: 400 });
    }

    console.log('[Test Invitation] Success:', inviteData);

    return NextResponse.json({
      success: true,
      message: `Invitation de test envoyée à ${email}`,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      userData: inviteData.user ? {
        id: inviteData.user.id,
        email: inviteData.user.email,
        invited_at: inviteData.user.invited_at
      } : null
    });

  } catch (error: any) {
    console.error('[Test Invitation] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erreur lors du test d\'invitation'
    }, { status: 500 });
  }
}