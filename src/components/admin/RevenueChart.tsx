'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Euro, TrendingUp, BarChart3 } from 'lucide-react';

interface RevenueChartProps {
  period: string;
}

interface RevenueData {
  advisor_id: string;
  advisor_name: string;
  data: {
    date: string;
    revenue: number;
    deals_closed: number;
    cumulative_revenue: number;
  }[];
}

export function RevenueChart({ period }: RevenueChartProps) {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/charts?type=performance&period=${period}`);
      if (response.ok) {
        const data = await response.json();
        // Transform performance data to revenue data
        const transformedData = data.performance_charts?.map((chart: any) => ({
          advisor_id: chart.advisor_id,
          advisor_name: chart.advisor_name,
          data: chart.data.map((point: any, index: number) => ({
            date: point.date,
            revenue: point.revenue,
            deals_closed: point.deals_closed,
            cumulative_revenue: chart.data
              .slice(0, index + 1)
              .reduce((sum: number, p: any) => sum + p.revenue, 0)
          }))
        })) || [];
        setRevenueData(transformedData);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Calculer les totaux
  const totalRevenue = revenueData.reduce((sum, advisor) =>
    sum + advisor.data.reduce((advisorSum, point) => advisorSum + point.revenue, 0), 0
  );

  const totalDeals = revenueData.reduce((sum, advisor) =>
    sum + advisor.data.reduce((advisorSum, point) => advisorSum + point.deals_closed, 0), 0
  );

  const averageDealValue = totalDeals > 0 ? totalRevenue / totalDeals : 0;

  // Trier les conseillers par CA total
  const sortedAdvisors = [...revenueData].sort((a, b) => {
    const aTotal = a.data.reduce((sum, point) => sum + point.revenue, 0);
    const bTotal = b.data.reduce((sum, point) => sum + point.revenue, 0);
    return bTotal - aTotal;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Euro className="h-5 w-5" />
          Analyse des Revenus
        </CardTitle>
        <CardDescription>
          Performance commerciale et évolution du chiffre d'affaires par conseiller
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Métriques globales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Euro className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">CA Total</span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0
              }).format(totalRevenue)}
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Deals Signés</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{totalDeals}</div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Ticket Moyen</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0
              }).format(averageDealValue)}
            </div>
          </div>
        </div>

        {/* Performance par conseiller */}
        <div className="space-y-6">
          <h4 className="font-medium">Performance par Conseiller</h4>

          {sortedAdvisors.map((advisor, index) => {
            const totalAdvisorRevenue = advisor.data.reduce((sum, point) => sum + point.revenue, 0);
            const totalAdvisorDeals = advisor.data.reduce((sum, point) => sum + point.deals_closed, 0);
            const advisorAvgDeal = totalAdvisorDeals > 0 ? totalAdvisorRevenue / totalAdvisorDeals : 0;
            const marketShare = totalRevenue > 0 ? (totalAdvisorRevenue / totalRevenue) * 100 : 0;

            // Tendance (simulée - comparer début et fin de période)
            const firstWeekRevenue = advisor.data.slice(0, 7).reduce((sum, point) => sum + point.revenue, 0);
            const lastWeekRevenue = advisor.data.slice(-7).reduce((sum, point) => sum + point.revenue, 0);
            const trend = firstWeekRevenue > 0 ? ((lastWeekRevenue - firstWeekRevenue) / firstWeekRevenue) * 100 : 0;

            return (
              <div key={advisor.advisor_id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-yellow-400' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-400' : 'bg-blue-400'
                    }`} />
                    <div>
                      <div className="font-medium">{advisor.advisor_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {marketShare.toFixed(1)}% du CA total
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                        minimumFractionDigits: 0
                      }).format(totalAdvisorRevenue)}
                    </div>
                    <div className={`text-sm flex items-center gap-1 ${
                      trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      <TrendingUp className={`h-3 w-3 ${trend < 0 ? 'rotate-180' : ''}`} />
                      {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Métriques détaillées */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium">{totalAdvisorDeals}</div>
                    <div className="text-muted-foreground">Deals</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                        minimumFractionDigits: 0
                      }).format(advisorAvgDeal)}
                    </div>
                    <div className="text-muted-foreground">Ticket Moyen</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">
                      {advisor.data.filter(d => d.deals_closed > 0).length}j
                    </div>
                    <div className="text-muted-foreground">Jours Productifs</div>
                  </div>
                </div>

                {/* Graphique simple en barres pour les 7 derniers jours */}
                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs text-muted-foreground mb-2">7 derniers jours</div>
                  <div className="flex items-end gap-1 h-16">
                    {advisor.data.slice(-7).map((point, dayIndex) => {
                      const maxRevenue = Math.max(...advisor.data.slice(-7).map(p => p.revenue));
                      const height = maxRevenue > 0 ? (point.revenue / maxRevenue) * 100 : 0;

                      return (
                        <div key={dayIndex} className="flex-1 flex flex-col items-center">
                          <div
                            className={`w-full rounded-t transition-all ${
                              point.revenue > 0 ? 'bg-green-500' : 'bg-gray-200'
                            }`}
                            style={{ height: `${Math.max(height, 2)}%` }}
                            title={`${new Date(point.date).toLocaleDateString('fr-FR')}: ${
                              new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'EUR',
                                minimumFractionDigits: 0
                              }).format(point.revenue)
                            }`}
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(point.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Insights */}
        <div className="mt-8 pt-6 border-t">
          <h4 className="font-medium mb-4">Insights Revenus</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Top performer */}
            {sortedAdvisors.length > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <div className="font-medium text-green-800">🏆 Top Performer</div>
                <div className="text-green-700">
                  {sortedAdvisors[0].advisor_name} génère{' '}
                  {((sortedAdvisors[0].data.reduce((s, p) => s + p.revenue, 0) / totalRevenue) * 100).toFixed(0)}%
                  {' '}du CA total
                </div>
              </div>
            )}

            {/* Concentration du CA */}
            {sortedAdvisors.length > 2 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="font-medium text-blue-800">📊 Concentration</div>
                <div className="text-blue-700">
                  Les 3 premiers conseillers génèrent{' '}
                  {(
                    (sortedAdvisors.slice(0, 3).reduce((sum, advisor) =>
                      sum + advisor.data.reduce((s, p) => s + p.revenue, 0), 0
                    ) / totalRevenue) * 100
                  ).toFixed(0)}% du CA
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}