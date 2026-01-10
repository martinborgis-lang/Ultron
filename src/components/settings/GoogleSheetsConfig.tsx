'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  FileSpreadsheet,
  Check,
  Loader2,
  ExternalLink,
  Link as LinkIcon,
  Unlink,
  AlertCircle,
} from 'lucide-react';

interface GoogleSheetsConfigProps {
  isGoogleConnected: boolean;
  initialSheetId: string | null;
}

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

interface TestResult {
  rows?: number;
  error?: string;
}

export function GoogleSheetsConfig({ isGoogleConnected, initialSheetId }: GoogleSheetsConfigProps) {
  const searchParams = useSearchParams();
  const [sheetId, setSheetId] = useState(initialSheetId || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    const googleParam = searchParams.get('google');
    if (googleParam === 'success') {
      setGoogleStatus('success');
      setTimeout(() => setGoogleStatus(null), 5000);
    } else if (googleParam === 'error') {
      setGoogleStatus('error');
    }
  }, [searchParams]);

  const handleConnectGoogle = () => {
    window.location.href = '/api/google/auth';
  };

  const handleDisconnectGoogle = async () => {
    if (!confirm('Etes-vous sur de vouloir deconnecter Google ?')) return;

    setDisconnecting(true);
    try {
      const response = await fetch('/api/organization/sheet', {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.reload();
      } else {
        alert('Erreur lors de la deconnexion');
      }
    } catch {
      alert('Erreur lors de la deconnexion');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSaveSheetId = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/organization/sheet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheet_id: sheetId }),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Erreur lors de l\'enregistrement');
      }
    } catch {
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestStatus('loading');
    setTestResult(null);

    try {
      const response = await fetch('/api/sheets/test');
      const data = await response.json();

      if (response.ok && data.success) {
        setTestStatus('success');
        setTestResult({ rows: data.rows });
      } else {
        setTestStatus('error');
        setTestResult({ error: data.error || 'Erreur de connexion' });
      }
    } catch {
      setTestStatus('error');
      setTestResult({ error: 'Erreur de connexion au serveur' });
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-50">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Google Sheets</CardTitle>
            <CardDescription>
              Connectez votre Google Sheet pour importer vos prospects
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Google OAuth Status Messages */}
        {googleStatus === 'success' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700">
            <Check className="h-4 w-4" />
            <span className="text-sm">Compte Google connecte avec succes !</span>
          </div>
        )}
        {googleStatus === 'error' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Erreur lors de la connexion Google. Veuillez reessayer.</span>
          </div>
        )}

        {/* Section 1: Google Connection */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Connexion Google</h3>

          {isGoogleConnected ? (
            <div className="flex items-center justify-between p-4 rounded-lg border bg-green-50 border-green-200">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <Check className="mr-1 h-3 w-3" />
                  Connecte
                </Badge>
                <span className="text-sm text-green-700">
                  Votre compte Google est connecte
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnectGoogle}
                disabled={disconnecting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {disconnecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Unlink className="mr-2 h-4 w-4" />
                )}
                Deconnecter
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-lg border bg-zinc-50">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-zinc-200 text-zinc-600">
                  Non connecte
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Connectez votre compte Google pour acceder a vos Sheets
                </span>
              </div>
              <Button onClick={handleConnectGoogle} className="bg-indigo-600 hover:bg-indigo-700">
                <LinkIcon className="mr-2 h-4 w-4" />
                Connecter Google
              </Button>
            </div>
          )}
        </div>

        {/* Section 2: Google Sheet Configuration (only if connected) */}
        {isGoogleConnected && (
          <>
            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Configuration Google Sheet</h3>

              <div className="space-y-2">
                <Label htmlFor="sheetId">ID de la Google Sheet</Label>
                <div className="flex gap-2">
                  <Input
                    id="sheetId"
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    value={sheetId}
                    onChange={(e) => setSheetId(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSaveSheetId}
                    disabled={saving}
                    variant="outline"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : saveSuccess ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      'Enregistrer'
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  L'ID se trouve dans l'URL : docs.google.com/spreadsheets/d/<strong>[ID]</strong>/edit
                </p>
              </div>

              {/* Test Connection */}
              <div className="space-y-3">
                <Button
                  onClick={handleTestConnection}
                  disabled={!sheetId || testStatus === 'loading'}
                  variant="outline"
                >
                  {testStatus === 'loading' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Test en cours...
                    </>
                  ) : (
                    'Tester la connexion'
                  )}
                </Button>

                {testStatus === 'success' && testResult && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">
                      Connexion reussie ! {testResult.rows} prospect{testResult.rows !== 1 ? 's' : ''} trouve{testResult.rows !== 1 ? 's' : ''}.
                    </span>
                  </div>
                )}

                {testStatus === 'error' && testResult && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-700">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{testResult.error}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Help Link */}
        <div className="pt-2 border-t">
          <a
            href="https://docs.google.com/spreadsheets"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:underline inline-flex items-center gap-1"
          >
            Ouvrir Google Sheets
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
