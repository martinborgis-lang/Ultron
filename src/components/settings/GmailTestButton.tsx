'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

interface GmailTestResult {
  userId?: string;
  userEmail?: string;
  hasGmailCredentials?: boolean;
  gmailConnectedEmail?: string | null;
  gmailStatus?: 'connected' | 'error' | 'not_connected';
  gmailError?: string;
  organizationGoogleConnected?: boolean;
  fallbackGmailEmail?: string;
  fallbackError?: string;
  canSendEmails?: boolean;
  error?: string;
}

export function GmailTestButton() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<GmailTestResult | null>(null);

  const testGmail = async () => {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch('/api/gmail/test');
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: 'Erreur de test' });
    }
    setTesting(false);
  };

  return (
    <div className="space-y-4">
      <Button onClick={testGmail} disabled={testing} variant="outline">
        {testing ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Mail className="w-4 h-4 mr-2" />
        )}
        Tester connexion Gmail
      </Button>

      {result && (
        <div className="p-4 rounded-lg bg-muted text-sm space-y-2">
          {result.error ? (
            <div className="flex items-center gap-2 text-red-500">
              <XCircle className="w-4 h-4" />
              <span>{result.error}</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                {result.canSendEmails ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-foreground">
                  {result.canSendEmails
                    ? `Peut envoyer des emails via: ${result.gmailConnectedEmail || result.fallbackGmailEmail}`
                    : "Impossible d'envoyer des emails"}
                </span>
              </div>

              <div className="text-muted-foreground space-y-1">
                <p>
                  Gmail personnel:{' '}
                  {result.gmailStatus === 'connected'
                    ? `✅ ${result.gmailConnectedEmail}`
                    : result.gmailStatus === 'error'
                    ? `❌ Erreur: ${result.gmailError}`
                    : '❌ Non connecté'}
                </p>
                <p>
                  Google organisation:{' '}
                  {result.organizationGoogleConnected ? '✅ Connecté' : '❌ Non connecté'}
                </p>
                {result.fallbackGmailEmail && (
                  <p>Email organisation (fallback): {result.fallbackGmailEmail}</p>
                )}
              </div>

              {result.gmailError && (
                <p className="text-red-500">Erreur Gmail: {result.gmailError}</p>
              )}
              {result.fallbackError && (
                <p className="text-red-500">Erreur fallback: {result.fallbackError}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
