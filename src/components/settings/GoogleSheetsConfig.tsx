'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Check, Loader2, ExternalLink } from 'lucide-react';

export function GoogleSheetsConfig() {
  const [sheetId, setSheetId] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock result - in real app, this would test the connection
    setTestResult(sheetId.length > 10 ? 'success' : 'error');
    setTesting(false);
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
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sheetId">ID de la Google Sheet</Label>
          <Input
            id="sheetId"
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
            value={sheetId}
            onChange={(e) => setSheetId(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            L'ID se trouve dans l'URL de votre Google Sheet, entre /d/ et /edit
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleTest} disabled={!sheetId || testing}>
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test en cours...
              </>
            ) : (
              'Tester la connexion'
            )}
          </Button>

          {testResult === 'success' && (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-4 w-4" />
              <span className="text-sm">Connexion reussie</span>
            </div>
          )}

          {testResult === 'error' && (
            <div className="text-sm text-red-600">
              Erreur de connexion. Verifiez l'ID et les permissions.
            </div>
          )}
        </div>

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
