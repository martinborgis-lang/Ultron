'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Euro,
  Users,
  ShoppingCart,
  BarChart3,
  Calendar,
  RefreshCw,
  Percent,
  Target
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface RevenueData {
  totalDeals: number;
  totalEnterpriseCA: number;
  totalAdvisorCommissions: number;
  averageCommissionRate: number;
  byProduct: Array<{
    name: string;
    category: string;
    dealCount: number;
    enterpriseCA: number;
    advisorCommissions: number;
  }>;
  byAdvisor: Array<{
    name: string;
    email: string;
    dealCount: number;
    enterpriseCA: number;
    commissions: number;
  }>;
  byType: {
    fixed: { dealCount: number; enterpriseCA: number; commissions: number };
    commission: { dealCount: number; enterpriseCA: number; commissions: number };
  };
  deals: Array<{
    id: string;
    client_amount: number;
    company_revenue: number;
    advisor_commission_amount: number;
    closed_at: string;
    product: { name: string; type: string; category: string };
    advisor: { full_name: string };
  }>;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function RevenueBreakdownDashboard() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/revenue-breakdown?period=${period}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Erreur récupération données revenus:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-24" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Aucune donnée disponible</p>
        </CardContent>
      </Card>
    );
  }

  // Préparation des données pour les graphiques
  const productChartData = data.byProduct.map(item => ({
    name: item.name.length > 15 ? item.name.substring(0, 12) + '...' : item.name,
    fullName: item.name,
    "CA Entreprise": item.enterpriseCA,
    "Commissions": item.advisorCommissions,
    deals: item.dealCount
  }));

  const advisorChartData = data.byAdvisor.map(item => ({
    name: item.name.split(' ').map(n => n[0]).join(''),
    fullName: item.name,
    "CA Généré": item.enterpriseCA,
    "Commissions": item.commissions,
    deals: item.dealCount
  }));

  const typeDistribution = [
    {
      name: 'Produits Fixes',
      value: data.byType.fixed.enterpriseCA,
      count: data.byType.fixed.dealCount,
      color: '#22c55e'
    },
    {
      name: 'Produits Commission',
      value: data.byType.commission.enterpriseCA,
      count: data.byType.commission.dealCount,
      color: '#3b82f6'
    }
  ].filter(item => item.value > 0);

  const commissionRatio = data.totalEnterpriseCA > 0
    ? (data.totalAdvisorCommissions / data.totalEnterpriseCA) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header avec filtre période */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analyse CA & Commissions</h2>
          <p className="text-muted-foreground">Répartition détaillée des revenus par produit et conseiller</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="6m">6 mois</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Entreprise Total</CardTitle>
            <Euro className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.totalEnterpriseCA)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.totalDeals} deal{data.totalDeals > 1 ? 's' : ''} fermé{data.totalDeals > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions Conseillers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(data.totalAdvisorCommissions)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPercent(commissionRatio)} du CA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux Commission Moyen</CardTitle>
            <Percent className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatPercent(data.averageCommissionRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              Sur la période
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bénéfice Net Entreprise</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(data.totalEnterpriseCA - data.totalAdvisorCommissions)}
            </div>
            <p className="text-xs text-muted-foreground">
              CA - Commissions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Par Produit</TabsTrigger>
          <TabsTrigger value="advisors">Par Conseiller</TabsTrigger>
          <TabsTrigger value="types">Types de Produits</TabsTrigger>
          <TabsTrigger value="details">Détails des Deals</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenus par Produit</CardTitle>
              <CardDescription>CA entreprise vs commissions par produit vendu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip
                      formatter={(value, name) => [formatCurrency(Number(value)), name]}
                      labelFormatter={(label) => {
                        const item = productChartData.find(d => d.name === label);
                        return item?.fullName || label;
                      }}
                    />
                    <Bar dataKey="CA Entreprise" fill="#22c55e" />
                    <Bar dataKey="Commissions" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.byProduct.map((product, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base">{product.name}</CardTitle>
                  <Badge variant="outline">{product.category}</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Deals fermés:</span>
                    <span className="font-medium">{product.dealCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>CA Entreprise:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(product.enterpriseCA)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Commissions:</span>
                    <span className="font-medium text-blue-600">
                      {formatCurrency(product.advisorCommissions)}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Ratio commission</span>
                      <span>
                        {product.enterpriseCA > 0
                          ? formatPercent((product.advisorCommissions / product.enterpriseCA) * 100)
                          : '0%'
                        }
                      </span>
                    </div>
                    <Progress
                      value={product.enterpriseCA > 0 ? (product.advisorCommissions / product.enterpriseCA) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="advisors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance par Conseiller</CardTitle>
              <CardDescription>CA généré et commissions perçues par conseiller</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={advisorChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip
                      formatter={(value, name) => [formatCurrency(Number(value)), name]}
                      labelFormatter={(label) => {
                        const item = advisorChartData.find(d => d.name === label);
                        return item?.fullName || label;
                      }}
                    />
                    <Bar dataKey="CA Généré" fill="#22c55e" />
                    <Bar dataKey="Commissions" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.byAdvisor.map((advisor, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base">{advisor.name}</CardTitle>
                  <CardDescription className="text-sm">{advisor.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Deals fermés:</span>
                    <span className="font-medium">{advisor.dealCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>CA généré:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(advisor.enterpriseCA)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Commissions:</span>
                    <span className="font-medium text-blue-600">
                      {formatCurrency(advisor.commissions)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>CA moyen/deal:</span>
                    <span className="font-medium">
                      {advisor.dealCount > 0
                        ? formatCurrency(advisor.enterpriseCA / advisor.dealCount)
                        : formatCurrency(0)
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Type de Produit</CardTitle>
                <CardDescription>Distribution du CA par catégorie</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {typeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comparaison Types de Produits</CardTitle>
                <CardDescription>Métriques détaillées par catégorie</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Produits Fixes</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Deals</div>
                      <div className="font-medium">{data.byType.fixed.dealCount}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">CA</div>
                      <div className="font-medium text-green-600">
                        {formatCurrency(data.byType.fixed.enterpriseCA)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Commissions</div>
                      <div className="font-medium text-blue-600">
                        {formatCurrency(data.byType.fixed.commissions)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Produits Commission</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Deals</div>
                      <div className="font-medium">{data.byType.commission.dealCount}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">CA</div>
                      <div className="font-medium text-green-600">
                        {formatCurrency(data.byType.commission.enterpriseCA)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Commissions</div>
                      <div className="font-medium text-blue-600">
                        {formatCurrency(data.byType.commission.commissions)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">CA moyen/deal (Fixes)</div>
                      <div className="font-medium">
                        {data.byType.fixed.dealCount > 0
                          ? formatCurrency(data.byType.fixed.enterpriseCA / data.byType.fixed.dealCount)
                          : formatCurrency(0)
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">CA moyen/deal (Commission)</div>
                      <div className="font-medium">
                        {data.byType.commission.dealCount > 0
                          ? formatCurrency(data.byType.commission.enterpriseCA / data.byType.commission.dealCount)
                          : formatCurrency(0)
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Deals</CardTitle>
              <CardDescription>Détail de tous les deals fermés sur la période</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.deals.map((deal, index) => (
                  <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{deal.product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {deal.advisor.full_name} • {new Date(deal.closed_at).toLocaleDateString('fr-FR')}
                      </div>
                      <Badge variant="outline" className="mt-1">
                        {deal.product.category}
                      </Badge>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Client: </span>
                        <span className="font-medium">{formatCurrency(deal.client_amount)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">CA: </span>
                        <span className="font-medium text-green-600">{formatCurrency(deal.company_revenue)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Commission: </span>
                        <span className="font-medium text-blue-600">{formatCurrency(deal.advisor_commission_amount)}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {data.deals.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun deal fermé sur cette période
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}