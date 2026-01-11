'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Check, Loader2, ExternalLink } from 'lucide-react';

interface PlaquetteConfigProps {
  initialPlaquetteId: string | null;
}

export function PlaquetteConfig({ initialPlaquetteId }: PlaquetteConfigProps) {
  const [plaquetteId, setPlaquetteId] = useState(initialPlaquetteId || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/organization/plaquette', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plaquette_id: plaquetteId }),
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

  const isConfigured = !!plaquetteId;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950">
            <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <CardTitle className="text-lg">Plaquette PDF</CardTitle>
            <CardDescription>
              Configurez votre plaquette commerciale pour l'envoi automatique
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="plaquetteId">ID Google Drive</Label>
          <div className="flex gap-2">
            <Input
              id="plaquetteId"
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              value={plaquetteId}
              onChange={(e) => setPlaquetteId(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="outline"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saveSuccess ? (
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                'Enregistrer'
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            L&apos;ID se trouve dans l&apos;URL de votre fichier : drive.google.com/file/d/<strong>[ID]</strong>/view
          </p>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 pt-2">
          {isConfigured ? (
            <>
              <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                <Check className="mr-1 h-3 w-3" />
                Configure
              </Badge>
              <a
                href={`https://drive.google.com/file/d/${plaquetteId}/view`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
              >
                Voir le fichier
                <ExternalLink className="h-3 w-3" />
              </a>
            </>
          ) : (
            <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
              Non configure
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground pt-2 border-t">
          Assurez-vous que le fichier est partage en mode &quot;Toute personne disposant du lien&quot; pour permettre le telechargement.
        </p>
      </CardContent>
    </Card>
  );
}
