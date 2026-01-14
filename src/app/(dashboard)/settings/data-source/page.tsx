'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Database, FileSpreadsheet, Check, Loader2 } from 'lucide-react';

export default function DataSourceSettings() {
  const [mode, setMode] = useState<'sheet' | 'crm'>('crm');
  const [sheetId, setSheetId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalMode, setOriginalMode] = useState<'sheet' | 'crm'>('crm');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchCurrentSettings();
  }, []);

  const fetchCurrentSettings = async () => {
    try {
      const res = await fetch('/api/settings/data-source');
      if (res.ok) {
        const data = await res.json();
        setMode(data.data_mode || 'crm');
        setOriginalMode(data.data_mode || 'crm');
        setSheetId(data.google_sheet_id || '');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings/data-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_mode: mode,
          google_sheet_id: mode === 'sheet' ? sheetId : null,
        }),
      });

      if (res.ok) {
        setOriginalMode(mode);
        setMessage({ type: 'success', text: 'Parametres enregistres avec succes !' });
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Erreur lors de la sauvegarde' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Source de donnees</h1>
      <p className="text-muted-foreground mb-6">
        Choisissez comment vos donnees prospects et taches sont stockees et gerees.
      </p>

      <div className="space-y-4">
        {/* Option CRM */}
        <div
          onClick={() => setMode('crm')}
          className={cn(
            'border rounded-xl p-5 cursor-pointer transition-all',
            mode === 'crm'
              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
              : 'border-border hover:border-muted-foreground/50'
          )}
        >
          <div className="flex items-start gap-4">
            <div className={cn('p-2 rounded-lg', mode === 'crm' ? 'bg-primary/10' : 'bg-muted')}>
              <Database
                className={cn('w-6 h-6', mode === 'crm' ? 'text-primary' : 'text-muted-foreground')}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Mode CRM</h3>
                {mode === 'crm' && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    Actif
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Vos prospects et taches sont stockes directement dans Ultron. Performance optimale
                et fonctionnalites avancees.
              </p>
              <ul className="mt-3 space-y-1.5 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  Performance optimale
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  Pipeline et taches integres
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  Workflows automatises
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Option Google Sheet */}
        <div
          onClick={() => setMode('sheet')}
          className={cn(
            'border rounded-xl p-5 cursor-pointer transition-all',
            mode === 'sheet'
              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
              : 'border-border hover:border-muted-foreground/50'
          )}
        >
          <div className="flex items-start gap-4">
            <div className={cn('p-2 rounded-lg', mode === 'sheet' ? 'bg-primary/10' : 'bg-muted')}>
              <FileSpreadsheet
                className={cn(
                  'w-6 h-6',
                  mode === 'sheet' ? 'text-primary' : 'text-muted-foreground'
                )}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Mode Google Sheet</h3>
                {mode === 'sheet' && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    Actif
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Vos prospects restent dans Google Sheet. Ideal si vous avez deja une Sheet avec des
                workflows N8N configures.
              </p>
              <ul className="mt-3 space-y-1.5 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  Compatible workflows N8N existants
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  Collaboration Google Sheet native
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  Taches via Google Calendar
                </li>
              </ul>
            </div>
          </div>

          {/* Champ Sheet ID si mode sheet selectionne */}
          {mode === 'sheet' && (
            <div className="mt-4 ml-14">
              <label className="block text-sm font-medium mb-1.5">ID de votre Google Sheet</label>
              <input
                type="text"
                value={sheetId}
                onChange={(e) => setSheetId(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="w-full px-3 py-2 border rounded-lg bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                L'ID se trouve dans l'URL de votre Sheet : docs.google.com/spreadsheets/d/
                <strong>[ID]</strong>/edit
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Warning si changement de mode */}
      {mode !== originalMode && (
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Attention :</strong> Changer de mode ne migre pas automatiquement vos donnees.
            {mode === 'crm'
              ? " Utilisez l'import CSV pour transferer vos prospects depuis Google Sheet."
              : ' Vos prospects CRM resteront en base mais ne seront plus affiches.'}
          </p>
        </div>
      )}

      {/* Message de feedback */}
      {message && (
        <div
          className={cn(
            'mt-4 p-3 rounded-lg text-sm',
            message.type === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300'
              : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
          )}
        >
          {message.text}
        </div>
      )}

      {/* Bouton Save */}
      <div className="mt-6">
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer les modifications'
          )}
        </Button>
      </div>
    </div>
  );
}
