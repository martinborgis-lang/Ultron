'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle,
  RefreshCw,
  Settings,
  MessageSquare,
  Loader2,
  AlertTriangle,
  Wand2
} from 'lucide-react';

interface OrganizationPromptAnalysis {
  organization_id: string;
  organization_name: string;
  existing_prompts: number;
  total_prompts: number;
  missing_prompts: string[];
  needs_init: boolean;
  status: 'complete' | 'incomplete';
}

export default function AdminPromptsPage() {
  const [analysis, setAnalysis] = useState<{
    total_organizations: number;
    organizations_need_init: number;
    organizations_complete: number;
    analysis: OrganizationPromptAnalysis[];
    default_prompts_available: string[];
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [lastInitResult, setLastInitResult] = useState<any>(null);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/init-prompts');
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      }
    } catch (error) {
      console.error('Erreur lors de l\'analyse des prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeAllPrompts = async () => {
    try {
      setInitializing(true);
      const response = await fetch('/api/admin/init-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force_all: true })
      });

      if (response.ok) {
        const result = await response.json();
        setLastInitResult(result);
        // Refresh analysis
        await fetchAnalysis();
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
    } finally {
      setInitializing(false);
    }
  };

  const initializeOrganization = async (organizationId: string) => {
    try {
      setInitializing(true);
      const response = await fetch('/api/admin/init-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: organizationId })
      });

      if (response.ok) {
        const result = await response.json();
        setLastInitResult(result);
        await fetchAnalysis();
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
    } finally {
      setInitializing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">🤖 Prompts IA par Défaut</h1>
          <p className="text-muted-foreground">
            Assure que toutes les organisations ont leurs prompts IA configurés pour les workflows emails
          </p>
        </div>
        <Button onClick={fetchAnalysis} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Analyser
        </Button>
      </div>

      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
        <MessageSquare className="h-4 w-4" />
        <AlertTitle>📧 Prompts pour Workflows Emails</AlertTitle>
        <AlertDescription>
          4 prompts sont nécessaires : <strong>Qualification</strong>, <strong>Synthèse</strong>, <strong>Rappel 24h</strong>, et <strong>Plaquette</strong>.
          Sans ces prompts, les workflows d'emails automatiques ne fonctionneront pas correctement.
        </AlertDescription>
      </Alert>

      {lastInitResult && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>✅ Initialisation terminée</AlertTitle>
          <AlertDescription>
            <div className="space-y-1">
              <div>{lastInitResult.message}</div>
              <div className="text-sm">
                • <strong>{lastInitResult.organizations_updated}</strong> organisations mises à jour
                • <strong>{lastInitResult.total_prompts_added}</strong> prompts ajoutés
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Analyse des Prompts IA
            </CardTitle>
            {analysis && (
              <p className="text-sm text-muted-foreground">
                {analysis.total_organizations} organisations •
                <span className="text-green-600 font-medium"> {analysis.organizations_complete} complètes</span> •
                <span className="text-orange-600 font-medium"> {analysis.organizations_need_init} à configurer</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchAnalysis} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            {analysis && analysis.organizations_need_init > 0 && (
              <Button
                onClick={initializeAllPrompts}
                disabled={initializing}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {initializing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                🤖 INITIALISER TOUT
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading && !analysis ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : analysis ? (
            <div className="space-y-4">
              {analysis.analysis.map((org) => (
                <div key={org.organization_id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{org.organization_name}</h3>
                      {org.status === 'complete' ? (
                        <Badge variant="default" className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <CheckCircle className="h-3 w-3" />
                          ✅ Complet (4/4)
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          ⚠️ {org.existing_prompts}/4 prompts
                        </Badge>
                      )}
                    </div>
                    {org.needs_init && (
                      <Button
                        onClick={() => initializeOrganization(org.organization_id)}
                        disabled={initializing}
                        size="sm"
                        variant="outline"
                        className="gap-1"
                      >
                        {initializing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                        Initialiser
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Prompts configurés ({org.existing_prompts}/4):</strong>
                      {org.existing_prompts === 4 ? " Tous configurés ✅" : ` ${4 - org.existing_prompts} manquants`}
                    </div>

                    {org.missing_prompts.length > 0 && (
                      <div className="text-orange-600">
                        <strong>🚫 Manquants:</strong> {org.missing_prompts.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {analysis.default_prompts_available.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">
                    🤖 Prompts par défaut disponibles :
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.default_prompts_available.map((prompt) => (
                      <Badge key={prompt} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {prompt.replace('prompt_', '')}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                    Ces prompts utilisent l'IA Claude pour générer automatiquement les emails de workflow.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Cliquez sur "Analyser" pour vérifier les prompts des organisations
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}