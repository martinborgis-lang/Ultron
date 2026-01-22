'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  Database,
  Package,
  Users,
  Loader2
} from 'lucide-react';

interface OrganizationStageAnalysis {
  organization_id: string;
  organization_name: string;
  total_stages: number;
  expected_stages: number;
  missing_stages: string[];
  extra_stages: string[];
  needs_sync: boolean;
  stage_list: Array<{ slug: string; name: string; position: number }>;
}

interface OrganizationProductAnalysis {
  organization_id: string;
  organization_name: string;
  total_products: number;
  expected_products: number;
  missing_products: string[];
  extra_products: string[];
  needs_sync: boolean;
  product_list: Array<{ name: string; type: string; commission_rate: number; is_active: boolean }>;
}

export default function AdminSyncPage() {
  const [stagesAnalysis, setStagesAnalysis] = useState<{
    total_organizations: number;
    organizations_need_sync: number;
    analysis: OrganizationStageAnalysis[];
    default_stages: Array<{ name: string; slug: string; position: number }>;
  } | null>(null);

  const [productsAnalysis, setProductsAnalysis] = useState<{
    total_organizations: number;
    organizations_need_sync: number;
    analysis: OrganizationProductAnalysis[];
    default_products: Array<{ name: string; type: string; commission_rate: number }>;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);

  const fetchStagesAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/sync-stages');
      if (response.ok) {
        const data = await response.json();
        setStagesAnalysis(data);
      }
    } catch (error) {
      console.error('Erreur lors de l\'analyse des stages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/sync-products');
      if (response.ok) {
        const data = await response.json();
        setProductsAnalysis(data);
      }
    } catch (error) {
      console.error('Erreur lors de l\'analyse des produits:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncStages = async (organizationId?: string) => {
    try {
      setSyncing(true);
      const response = await fetch('/api/admin/sync-stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sync_all: !organizationId,
          organization_id: organizationId
        })
      });

      if (response.ok) {
        const result = await response.json();
        setLastSyncResult(result);
        // Refresh analysis
        await fetchStagesAnalysis();
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
    } finally {
      setSyncing(false);
    }
  };

  const syncProducts = async (organizationId?: string) => {
    try {
      setSyncing(true);
      const response = await fetch('/api/admin/sync-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sync_all: !organizationId,
          organization_id: organizationId
        })
      });

      if (response.ok) {
        const result = await response.json();
        setLastSyncResult(result);
        // Refresh analysis
        await fetchProductsAnalysis();
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
    } finally {
      setSyncing(false);
    }
  };

  const runFullAnalysis = async () => {
    await Promise.all([fetchStagesAnalysis(), fetchProductsAnalysis()]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Synchronisation Multi-Tenant</h1>
          <p className="text-muted-foreground">
            Diagnostiquer et corriger les différences de configuration entre organisations
          </p>
        </div>
        <Button onClick={runFullAnalysis} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Analyser toutes les organisations
        </Button>
      </div>

      {lastSyncResult && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Synchronisation terminée</AlertTitle>
          <AlertDescription>
            {lastSyncResult.organizations_synced} organisation(s) synchronisée(s).
            {lastSyncResult.results.map((r: any, i: number) => (
              <div key={i} className="mt-1">
                <strong>{r.organization_name}:</strong> {r.stages_created || r.products_created || 0} élément(s) créé(s)
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="stages" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stages" className="gap-2">
            <Database className="h-4 w-4" />
            Stages Pipeline
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            Produits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stages" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Analyse des Stages Pipeline
                </CardTitle>
                {stagesAnalysis && (
                  <p className="text-sm text-muted-foreground">
                    {stagesAnalysis.total_organizations} organisations • {stagesAnalysis.organizations_need_sync} nécessitent une synchronisation
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={fetchStagesAnalysis} variant="outline" size="sm" disabled={loading}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button onClick={() => syncStages()} disabled={syncing} size="sm">
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
                  Sync Toutes
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading && !stagesAnalysis ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : stagesAnalysis ? (
                <div className="space-y-4">
                  {stagesAnalysis.analysis.map((org) => (
                    <div key={org.organization_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{org.organization_name}</h3>
                          {org.needs_sync ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Sync requis
                            </Badge>
                          ) : (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              À jour
                            </Badge>
                          )}
                        </div>
                        {org.needs_sync && (
                          <Button
                            onClick={() => syncStages(org.organization_id)}
                            disabled={syncing}
                            size="sm"
                            variant="outline"
                          >
                            Synchroniser
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Stages actuels:</strong> {org.total_stages}/{org.expected_stages}</p>
                          {org.missing_stages.length > 0 && (
                            <p className="text-red-600">Manquants: {org.missing_stages.join(', ')}</p>
                          )}
                        </div>
                        <div>
                          {org.stage_list.length > 0 && (
                            <p><strong>Liste:</strong> {org.stage_list.map(s => s.name).join(', ')}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {stagesAnalysis.default_stages.length > 0 && (
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Stages par défaut attendus :</h4>
                      <div className="flex flex-wrap gap-2">
                        {stagesAnalysis.default_stages.map((stage, i) => (
                          <Badge key={stage.slug} variant="secondary">
                            {i + 1}. {stage.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Cliquez sur "Analyser" pour diagnostiquer les stages
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Analyse des Produits
                </CardTitle>
                {productsAnalysis && (
                  <p className="text-sm text-muted-foreground">
                    {productsAnalysis.total_organizations} organisations • {productsAnalysis.organizations_need_sync} nécessitent une synchronisation
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={fetchProductsAnalysis} variant="outline" size="sm" disabled={loading}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button onClick={() => syncProducts()} disabled={syncing} size="sm">
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
                  Sync Toutes
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading && !productsAnalysis ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : productsAnalysis ? (
                <div className="space-y-4">
                  {productsAnalysis.analysis.map((org) => (
                    <div key={org.organization_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{org.organization_name}</h3>
                          {org.needs_sync ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Sync requis
                            </Badge>
                          ) : (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              À jour
                            </Badge>
                          )}
                        </div>
                        {org.needs_sync && (
                          <Button
                            onClick={() => syncProducts(org.organization_id)}
                            disabled={syncing}
                            size="sm"
                            variant="outline"
                          >
                            Synchroniser
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Produits actuels:</strong> {org.total_products}/{org.expected_products}</p>
                          {org.missing_products.length > 0 && (
                            <p className="text-red-600">Manquants: {org.missing_products.join(', ')}</p>
                          )}
                        </div>
                        <div>
                          {org.product_list.length > 0 && (
                            <p><strong>Liste:</strong> {org.product_list.map(p => `${p.name} (${p.commission_rate}%)`).join(', ')}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {productsAnalysis.default_products.length > 0 && (
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Produits par défaut attendus :</h4>
                      <div className="flex flex-wrap gap-2">
                        {productsAnalysis.default_products.map((product) => (
                          <Badge key={product.name} variant="secondary">
                            {product.name} ({product.commission_rate}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Cliquez sur "Analyser" pour diagnostiquer les produits
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}