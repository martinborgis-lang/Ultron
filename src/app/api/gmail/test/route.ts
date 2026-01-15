import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getGmailUserEmail } from '@/lib/gmail';
import { GoogleCredentials } from '@/lib/google';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    const { data: user } = await adminClient
      .from('users')
      .select('id, email, gmail_credentials, organization_id')
      .eq('auth_id', authUser.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const result: {
      userId: string;
      userEmail: string;
      hasGmailCredentials: boolean;
      gmailConnectedEmail: string | null;
      gmailStatus: 'connected' | 'error' | 'not_connected';
      gmailError?: string;
      organizationGoogleConnected: boolean;
      fallbackGmailEmail?: string;
      fallbackError?: string;
      canSendEmails: boolean;
    } = {
      userId: user.id,
      userEmail: user.email,
      hasGmailCredentials: !!user.gmail_credentials,
      gmailConnectedEmail: null,
      gmailStatus: 'not_connected',
      organizationGoogleConnected: false,
      canSendEmails: false,
    };

    // Test user Gmail credentials
    if (user.gmail_credentials) {
      try {
        const gmailEmail = await getGmailUserEmail(user.gmail_credentials as GoogleCredentials);
        result.gmailConnectedEmail = gmailEmail;
        result.gmailStatus = 'connected';
        result.canSendEmails = true;
      } catch (err: unknown) {
        result.gmailStatus = 'error';
        result.gmailError = err instanceof Error ? err.message : 'Erreur inconnue';
      }
    }

    // Check organization credentials
    if (user.organization_id) {
      const { data: org } = await adminClient
        .from('organizations')
        .select('google_credentials')
        .eq('id', user.organization_id)
        .single();

      result.organizationGoogleConnected = !!org?.google_credentials;

      // Test if we can send via org as fallback
      if (org?.google_credentials && !user.gmail_credentials) {
        try {
          const orgGmailEmail = await getGmailUserEmail(org.google_credentials as GoogleCredentials);
          result.fallbackGmailEmail = orgGmailEmail;
          result.canSendEmails = true;
        } catch (err: unknown) {
          result.canSendEmails = false;
          result.fallbackError = err instanceof Error ? err.message : 'Erreur inconnue';
        }
      }
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Gmail test error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
