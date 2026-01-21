'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RefreshCw, Users, TrendingUp, Euro, Calendar, AlertTriangle,
  Target, Trophy, Activity, BarChart3, PieChart, Clock,
  Phone, Mail, UserCheck, TrendingDown
} from 'lucide-react';
import type { AdminDashboardStats, AdvisorStats } from '@/types/crm';

import { AdminStatsCards } from './AdminStatsCards';
import { AdvisorPerformanceTable } from './AdvisorPerformanceTable';
import { ConversionFunnelChart } from './ConversionFunnelChart';
import { RevenueChart } from './RevenueChart';
import { ActivityHeatmap } from './ActivityHeatmap';
import { TopPerformers } from './TopPerformers';
import { AlertsPanel } from './AlertsPanel';

interface PeriodFilter {
  value: '7d' | '30d' | '90d' | '6m' | '1y' | 'custom';
  label: string;
}

const periodOptions: PeriodFilter[] = [
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
  { value: '90d', label: '3 derniers mois' },
  { value: '6m', label: '6 derniers mois' },
  { value: '1y', label: '1 dernière année' }
];

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[400px] w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
      <Skeleton className="h-[500px] w-full rounded-xl" />
    </div>
  );
}

function AccessDenied() {
  return (
    <Card className="max-w-md mx-auto mt-20">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 rounded-full bg-red-50 mb-4">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Accès refusé</h3>
        <p className="text-muted-foreground">
          Seuls les administrateurs peuvent accéder à cette page.
        </p>
      </CardContent>
    </Card>
  );
}

export function AdminDashboardContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats | null>(null);
  const [advisorStats, setAdvisorStats] = useState<AdvisorStats[]>([]);

  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '6m' | '1y'>('30d');
  const [compareWithPrevious, setCompareWithPrevious] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        period: selectedPeriod,
        compare_with_previous: compareWithPrevious.toString()
      });

      const response = await fetch(`/api/admin/stats?${params}`);

      if (!response.ok) {
        if (response.status === 403) {
          setAccessDenied(true);
          return;
        }
        throw new Error('Erreur lors du chargement des données');
      }

      const data = await response.json();
      setDashboardStats(data.dashboard_stats);
      setAdvisorStats(data.advisor_stats);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPeriod, compareWithPrevious]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (accessDenied) {
    return <AccessDenied />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="ml-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!dashboardStats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header avec filtres */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrateur</h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble des performances de votre cabinet
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-[200px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCompareWithPrevious(!compareWithPrevious)}
            className={compareWithPrevious ? 'bg-primary/5' : ''}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            {compareWithPrevious ? 'Comparaison ON' : 'Comparaison OFF'}
          </Button>

          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats cards principales */}
      <AdminStatsCards stats={dashboardStats} />

      {/* Alertes importantes */}
      {dashboardStats.alerts.length > 0 && (
        <AlertsPanel alerts={dashboardStats.alerts} />
      )}

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="conversion" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Conversion
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activité
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <Euro className="h-4 w-4" />
            Revenus
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top performers */}
            <TopPerformers topPerformers={dashboardStats.top_performers} />

            {/* Distribution prospects/revenus */}
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Répartition Prospects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dashboardStats.prospects_by_advisor.slice(0, 5).map((advisor) => (
                      <div key={advisor.advisor_id} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{advisor.advisor_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {advisor.count} ({advisor.percentage.toFixed(1)}%)
                          </span>
                          <div
                            className="h-2 bg-blue-500 dark:bg-blue-400 rounded-full"
                            style={{ width: `${Math.max(advisor.percentage * 2, 8)}px` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Euro className="h-5 w-5" />
                    Répartition CA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dashboardStats.revenue_by_advisor.slice(0, 5).map((advisor) => (
                      <div key={advisor.advisor_id} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{advisor.advisor_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'EUR',
                              minimumFractionDigits: 0
                            }).format(advisor.revenue)}
                          </span>
                          <div
                            className="h-2 bg-green-500 dark:bg-green-400 rounded-full"
                            style={{ width: `${Math.max(advisor.percentage * 2, 8)}px` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <AdvisorPerformanceTable advisors={advisorStats} period={selectedPeriod} />
        </TabsContent>

        <TabsContent value="conversion" className="space-y-6">
          <ConversionFunnelChart period={selectedPeriod} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <ActivityHeatmap period={selectedPeriod} />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <RevenueChart period={selectedPeriod} />
        </TabsContent>
      </Tabs>

      {/* Insights et recommandations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Insights & Recommandations
          </CardTitle>
          <CardDescription>
            Analyses automatiques basées sur les données de performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Insight taux de conversion */}
            <div className="p-4 border border-border rounded-lg bg-card">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">Taux de conversion moyen</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    {dashboardStats.average_conversion_rate.toFixed(1)}% -
                    {dashboardStats.average_conversion_rate > 15 ? ' Excellent' :
                     dashboardStats.average_conversion_rate > 10 ? ' Bon' : ' À améliorer'}
                  </p>
                  <Badge variant={dashboardStats.average_conversion_rate > 15 ? 'default' : 'secondary'} className="text-xs">
                    {dashboardStats.average_conversion_rate > 15 ? 'Performant' : 'Amélioration possible'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Insight activité */}
            <div className="p-4 border border-border rounded-lg bg-card">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                  <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">Niveau d'activité</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    {dashboardStats.active_advisors}/{dashboardStats.total_advisors} conseillers actifs
                  </p>
                  <Badge
                    variant={dashboardStats.active_advisors === dashboardStats.total_advisors ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {dashboardStats.active_advisors === dashboardStats.total_advisors ? 'Tous actifs' : 'Inactivité détectée'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Insight RDV */}
            <div className="p-4 border border-border rounded-lg bg-card">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
                  <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">Performance RDV</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    {dashboardStats.total_rdv_completed}/{dashboardStats.total_rdv_scheduled} RDV réalisés
                  </p>
                  <Badge
                    variant={
                      dashboardStats.total_rdv_scheduled > 0 &&
                      (dashboardStats.total_rdv_completed / dashboardStats.total_rdv_scheduled) > 0.8
                        ? 'default' : 'secondary'
                    }
                    className="text-xs"
                  >
                    {dashboardStats.total_rdv_scheduled > 0 ?
                      `${((dashboardStats.total_rdv_completed / dashboardStats.total_rdv_scheduled) * 100).toFixed(0)}% réalisés` :
                      'Aucun RDV'
                    }
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}