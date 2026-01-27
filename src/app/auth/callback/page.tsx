'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleCallback = async () => {
      // Get the hash fragment (everything after #)
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);

      // Also check query params (for some auth flows)
      const queryParams = new URLSearchParams(window.location.search);

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type') || queryParams.get('type');
      const tokenHash = queryParams.get('token_hash');
      const code = queryParams.get('code');

      logger.debug('[Auth Callback] Params:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        type,
        hasTokenHash: !!tokenHash,
        hasCode: !!code,
      });

      try {
        // Case 1: Access token in fragment (invitation flow)
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('[Auth Callback] setSession error:', error);
            setError(error.message);
            return;
          }

          // Check if this is an invite or signup - redirect appropriately
          if (type === 'invite' || type === 'recovery') {
            logger.debug('[Auth Callback] Invite/recovery flow, redirecting to set-password');
            router.push('/auth/set-password');
            return;
          }

          if (type === 'signup') {
            logger.debug('[Auth Callback] Signup flow, redirecting to complete-registration');
            router.push('/complete-registration');
            return;
          }

          // Otherwise go to dashboard
          logger.debug('[Auth Callback] Normal auth, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }

        // Case 2: Token hash in query params (email verification)
        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'invite' | 'signup' | 'email' | 'recovery',
          });

          if (error) {
            console.error('[Auth Callback] verifyOtp error:', error);
            setError(error.message);
            return;
          }

          if (type === 'invite' || type === 'recovery') {
            router.push('/auth/set-password');
            return;
          }

          if (type === 'signup') {
            router.push('/complete-registration');
            return;
          }

          router.push('/dashboard');
          return;
        }

        // Case 3: Code in query params (OAuth)
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('[Auth Callback] exchangeCode error:', error);
            setError(error.message);
            return;
          }

          router.push('/dashboard');
          return;
        }

        // No valid params found
        logger.debug('[Auth Callback] No valid params found');
        setError('Lien invalide ou expire');

      } catch (err) {
        console.error('[Auth Callback] Unexpected error:', err);
        setError('Une erreur est survenue');
      }
    };

    handleCallback();
  }, [router, supabase.auth]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <a
                href="/login"
                className="text-indigo-600 hover:text-indigo-700 text-sm underline"
              >
                Retour a la connexion
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-muted-foreground">Verification en cours...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
