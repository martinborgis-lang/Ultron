'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  Database,
  Loader2,
  Trash2,
  AlertCircle
} from 'lucide-react';

interface OrganizationAnalysis {
  organization_id: string;
  organization_name: string;
  current_stages_count: number;
  expected_stages_count: number;
  extra_stages: string[];
  missing_stages: string[];
  needs_cleaning: boolean;
  status: 'correct' | 'needs_fix';
  stage_list: Array<{ slug: string; name: string; position: number }>;
}

export default function AdminSyncPage() {
  const [analysis, setAnalysis] = useState<{
    total_organizations: number;
    organizations_need_cleaning: number;
    organizations_correct: number;
    expected_stages: Array<{ name: string; slug: string; position: number }>;
    analysis: OrganizationAnalysis[];
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [lastCleanResult, setLastCleanResult] = useState<any>(null);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/force-stages');
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      }
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
    } finally {
      setLoading(false);
    }
  };

  const forceCleanAllStages = async () => {
    try {
      setCleaning(true);
      const response = await fetch('/api/admin/force-stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force_all: true })
      });

      if (response.ok) {
        const result = await response.json();
        setLastCleanResult(result);
        // Refresh analysis
        await fetchAnalysis();
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
    } finally {
      setCleaning(false);
    }
  };

  const forceCleanOrganization = async (organizationId: string) => {
    try {
      setCleaning(true);
      const response = await fetch('/api/admin/force-stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: organizationId })
      });

      if (response.ok) {
        const result = await response.json();
        setLastCleanResult(result);
        await fetchAnalysis();
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">🧹 Nettoyage Stages Pipeline</h1>
          <p className="text-muted-foreground">
            Force exactement 6 stages identiques sur toutes les organisations
          </p>
        </div>
        <Button onClick={fetchAnalysis} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Analyser
        </Button>
      </div>

      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>⚠️ NETTOYAGE FORCÉ</AlertTitle>
        <AlertDescription>
          Cette opération va <strong>supprimer définitivement</strong> les stages en trop et migrer tous les prospects
          vers les 6 stages corrects. <strong>Action irréversible !</strong>
        </AlertDescription>
      </Alert>

      {lastCleanResult && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>🧹 Nettoyage terminé</AlertTitle>
          <AlertDescription>
            <div className="space-y-1">
              <div>{lastCleanResult.message}</div>
              <div className="text-sm">
                • <strong>{lastCleanResult.total_stages_deleted}</strong> stages supprimés
                • <strong>{lastCleanResult.total_prospects_migrated}</strong> prospects migrés
                • <strong>{lastCleanResult.organizations_fixed}</strong> organisations nettoyées
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Analyse des Stages Pipeline
            </CardTitle>
            {analysis && (
              <p className="text-sm text-muted-foreground">
                {analysis.total_organizations} organisations •
                <span className="text-green-600 font-medium"> {analysis.organizations_correct} correctes</span> •
                <span className="text-red-600 font-medium"> {analysis.organizations_need_cleaning} à nettoyer</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchAnalysis} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            {analysis && analysis.organizations_need_cleaning > 0 && (
              <Button
                onClick={forceCleanAllStages}
                disabled={cleaning}
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                {cleaning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                🧹 NETTOYER TOUT
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
                      {org.status === 'correct' ? (
                        <Badge variant="default" className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <CheckCircle className="h-3 w-3" />
                          ✅ Correct (6 stages)
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          ❌ {org.current_stages_count} stages (attendu: 6)
                        </Badge>
                      )}
                    </div>
                    {org.needs_cleaning && (
                      <Button
                        onClick={() => forceCleanOrganization(org.organization_id)}
                        disabled={cleaning}
                        size="sm"
                        variant="destructive"
                        className="gap-1"
                      >
                        {cleaning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        Nettoyer
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Stages actuels ({org.current_stages_count}):</strong> {org.stage_list.map(s => s.name).join(', ')}
                    </div>

                    {org.extra_stages.length > 0 && (
                      <div className="text-red-600">
                        <strong>🗑️ À supprimer:</strong> {org.extra_stages.join(', ')}
                      </div>
                    )}

                    {org.missing_stages.length > 0 && (
                      <div className="text-orange-600">
                        <strong>➕ À créer:</strong> {org.missing_stages.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {analysis.expected_stages.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-medium mb-2 text-green-800 dark:text-green-200">
                    ✅ Configuration finale attendue (6 stages) :
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.expected_stages.map((stage, i) => (
                      <Badge key={stage.slug} className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {i + 1}. {stage.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Cliquez sur "Analyser" pour diagnostiquer les stages pipeline
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}