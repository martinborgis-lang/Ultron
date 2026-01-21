'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users, TrendingUp, Euro, Calendar, Target, Phone, Trophy, Activity
} from 'lucide-react';
import type { AdminDashboardStats } from '@/types/crm';

interface AdminStatsCardsProps {
  stats: AdminDashboardStats;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  variant = 'default'
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}) {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  const cardVariant = variant === 'success' ? 'border-green-200 bg-green-50' :
                     variant === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                     variant === 'destructive' ? 'border-red-200 bg-red-50' : '';

  return (
    <Card className={cardVariant}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trendValue !== undefined && (
          <div className={`text-xs ${trendColor} mt-1 flex items-center gap-1`}>
            <TrendingUp className={`h-3 w-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
            {trendValue > 0 ? '+' : ''}{trendValue.toFixed(1)}% vs période précédente
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  // Calculer les tendances
  const rdvTrend = stats.period_comparison.rdv_growth > 0 ? 'up' :
                   stats.period_comparison.rdv_growth < 0 ? 'down' : 'neutral';
  const conversionTrend = stats.period_comparison.conversion_growth > 0 ? 'up' :
                         stats.period_comparison.conversion_growth < 0 ? 'down' : 'neutral';
  const revenueTrend = stats.period_comparison.revenue_growth > 0 ? 'up' :
                      stats.period_comparison.revenue_growth < 0 ? 'down' : 'neutral';
  const prospectsTrend = stats.period_comparison.prospects_growth > 0 ? 'up' :
                        stats.period_comparison.prospects_growth < 0 ? 'down' : 'neutral';

  // Déterminer les variantes des cartes
  const conversionVariant = stats.average_conversion_rate > 15 ? 'success' :
                           stats.average_conversion_rate < 8 ? 'warning' : 'default';
  const activityVariant = stats.active_advisors === stats.total_advisors ? 'success' :
                         stats.active_advisors < stats.total_advisors * 0.7 ? 'destructive' : 'warning';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Conseillers */}
      <StatCard
        title="Conseillers"
        value={`${stats.active_advisors}/${stats.total_advisors}`}
        description={`${stats.active_advisors} actifs sur ${stats.total_advisors} total`}
        icon={Users}
        variant={activityVariant}
      />

      {/* RDV Total */}
      <StatCard
        title="RDV Programmés"
        value={stats.total_rdv_scheduled}
        description={`${stats.total_rdv_completed} réalisés (${
          stats.total_rdv_scheduled > 0
            ? ((stats.total_rdv_completed / stats.total_rdv_scheduled) * 100).toFixed(0)
            : 0
        }%)`}
        icon={Calendar}
        trend={rdvTrend}
        trendValue={stats.period_comparison.rdv_growth}
      />

      {/* Taux de conversion moyen */}
      <StatCard
        title="Taux Conversion Moyen"
        value={`${stats.average_conversion_rate.toFixed(1)}%`}
        description="Du contact au deal signé"
        icon={Target}
        trend={conversionTrend}
        trendValue={stats.period_comparison.conversion_growth}
        variant={conversionVariant}
      />

      {/* Chiffre d'affaires */}
      <StatCard
        title="Chiffre d'Affaires"
        value={new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0
        }).format(stats.total_revenue)}
        description={`${stats.total_deals_won} deals signés`}
        icon={Euro}
        trend={revenueTrend}
        trendValue={stats.period_comparison.revenue_growth}
        variant={stats.total_revenue > 100000 ? 'success' : 'default'}
      />

      {/* Stats secondaires */}
      <StatCard
        title="Nouveaux Prospects"
        value={stats.total_prospects}
        description="Total sur la période"
        icon={Users}
        trend={prospectsTrend}
        trendValue={stats.period_comparison.prospects_growth}
      />

      <StatCard
        title="Deals Gagnés"
        value={stats.total_deals_won}
        description={`${stats.total_deals_lost} deals perdus`}
        icon={Trophy}
        variant={stats.total_deals_won > stats.total_deals_lost ? 'success' : 'warning'}
      />

      <StatCard
        title="Top Performer (RDV)"
        value={stats.top_performers.by_rdv.rdv_scheduled_count}
        description={stats.top_performers.by_rdv.full_name}
        icon={Calendar}
        variant="success"
      />

      <StatCard
        title="Top Performer (CA)"
        value={new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0
        }).format(stats.top_performers.by_revenue.total_deal_value)}
        description={stats.top_performers.by_revenue.full_name}
        icon={Euro}
        variant="success"
      />
    </div>
  );
}