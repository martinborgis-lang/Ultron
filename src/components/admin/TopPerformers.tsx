'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calendar, Target, Euro } from 'lucide-react';
import type { AdminDashboardStats } from '@/types/crm';

interface TopPerformersProps {
  topPerformers: AdminDashboardStats['top_performers'];
}

export function TopPerformers({ topPerformers }: TopPerformersProps) {
  const performers = [
    {
      title: 'Top RDV',
      icon: Calendar,
      color: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800',
      bgColor: 'bg-blue-50/50 dark:bg-blue-900/20',
      advisor: topPerformers.by_rdv,
      metric: topPerformers.by_rdv.rdv_scheduled_count,
      metricLabel: 'RDV programmés',
      badge: 'RDV Master'
    },
    {
      title: 'Top Conversion',
      icon: Target,
      color: 'text-green-600 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800',
      bgColor: 'bg-green-50/50 dark:bg-green-900/20',
      advisor: topPerformers.by_conversion,
      metric: topPerformers.by_conversion.conversion_rate_overall.toFixed(1) + '%',
      metricLabel: 'Taux de conversion',
      badge: 'Closer'
    },
    {
      title: 'Top CA',
      icon: Euro,
      color: 'text-yellow-600 dark:text-yellow-400',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      bgColor: 'bg-yellow-50/50 dark:bg-yellow-900/20',
      advisor: topPerformers.by_revenue,
      metric: new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0
      }).format(topPerformers.by_revenue.total_deal_value),
      metricLabel: 'Chiffre d\'affaires',
      badge: 'Money Maker'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
          Top Performers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {performers.map((performer, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${performer.borderColor} ${performer.bgColor} bg-card`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-card dark:bg-background shadow-sm border border-border`}>
                  <performer.icon className={`h-5 w-5 ${performer.color}`} />
                </div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={performer.advisor.avatar_url} />
                    <AvatarFallback className="text-sm font-medium">
                      {performer.advisor.full_name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">
                      {performer.advisor.full_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {performer.advisor.email}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">
                    {performer.badge}
                  </Badge>
                </div>
                <div className="text-lg font-bold">{performer.metric}</div>
                <div className="text-xs text-muted-foreground">
                  {performer.metricLabel}
                </div>
              </div>
            </div>

            {/* Métriques additionnelles */}
            <div className="mt-3 pt-3 border-t border-border">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm font-medium">
                    {performer.advisor.created_prospects}
                  </div>
                  <div className="text-xs text-muted-foreground">Prospects</div>
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {performer.advisor.won_deals}
                  </div>
                  <div className="text-xs text-muted-foreground">Deals</div>
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {performer.advisor.active_days}j
                  </div>
                  <div className="text-xs text-muted-foreground">Activité</div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Comparaisons intéressantes */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium text-sm mb-3">Comparaisons</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Écart RDV (Top vs Moyenne)</span>
              <span className="font-medium">
                +{(topPerformers.by_rdv.rdv_scheduled_count -
                  (topPerformers.by_rdv.rdv_scheduled_count +
                   topPerformers.by_conversion.rdv_scheduled_count +
                   topPerformers.by_revenue.rdv_scheduled_count) / 3).toFixed(0)} RDV
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Écart Conversion</span>
              <span className="font-medium">
                +{(topPerformers.by_conversion.conversion_rate_overall -
                  (topPerformers.by_rdv.conversion_rate_overall +
                   topPerformers.by_conversion.conversion_rate_overall +
                   topPerformers.by_revenue.conversion_rate_overall) / 3).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Écart CA</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                +{new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 0
                }).format(topPerformers.by_revenue.total_deal_value -
                  (topPerformers.by_rdv.total_deal_value +
                   topPerformers.by_conversion.total_deal_value +
                   topPerformers.by_revenue.total_deal_value) / 3)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}