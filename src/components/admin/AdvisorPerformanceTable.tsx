'use client';

import { useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown,
  Calendar, Target, Euro, Phone, Mail, Activity, MoreVertical
} from 'lucide-react';
import type { AdvisorStats } from '@/types/crm';

interface AdvisorPerformanceTableProps {
  advisors: AdvisorStats[];
  period: string;
}

type SortField = keyof AdvisorStats;
type SortDirection = 'asc' | 'desc';

export function AdvisorPerformanceTable({ advisors, period }: AdvisorPerformanceTableProps) {
  const [sortField, setSortField] = useState<SortField>('conversion_rate_overall');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedAdvisors = [...advisors].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-50" />
        )}
      </span>
    </Button>
  );

  const getPerformanceBadge = (value: number, thresholds: { high: number; medium: number }) => {
    if (value >= thresholds.high) return <Badge className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white">Excellent</Badge>;
    if (value >= thresholds.medium) return <Badge variant="outline" className="border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400">Bon</Badge>;
    return <Badge variant="outline" className="border-red-500 text-red-600 dark:border-red-400 dark:text-red-400">À améliorer</Badge>;
  };

  const getTrendIcon = (value: number) => {
    if (value > 5) return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
    if (value < -5) return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
    return <div className="h-4 w-4" />; // Espace vide pour alignement
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Performance des Conseillers
        </CardTitle>
        <CardDescription>
          Tableau détaillé des performances sur {period === '7d' ? 'les 7 derniers jours' :
          period === '30d' ? 'les 30 derniers jours' :
          period === '90d' ? 'les 3 derniers mois' :
          period === '6m' ? 'les 6 derniers mois' : 'l\'année dernière'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Conseiller</TableHead>
                <TableHead>
                  <SortButton field="rdv_scheduled_count">RDV</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="conversion_rate_overall">Conversion</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="total_deal_value">CA</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="prospects_in_negotiation">En Négo</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="calls_made">Appels</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="emails_sent">Emails</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="active_days">Activité</SortButton>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAdvisors.map((advisor) => (
                <TableRow key={advisor.id}>
                  {/* Conseiller */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={advisor.avatar_url} />
                        <AvatarFallback>
                          {advisor.full_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{advisor.full_name}</div>
                        <div className="text-xs text-muted-foreground">{advisor.email}</div>
                      </div>
                    </div>
                  </TableCell>

                  {/* RDV */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{advisor.rdv_scheduled_count}</span>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        {getTrendIcon(advisor.rdv_growth)}
                        {advisor.rdv_growth > 0 ? '+' : ''}{advisor.rdv_growth.toFixed(0)}%
                      </div>
                    </div>
                  </TableCell>

                  {/* Conversion */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{advisor.conversion_rate_overall.toFixed(1)}%</span>
                      {getPerformanceBadge(advisor.conversion_rate_overall, { high: 15, medium: 10 })}
                    </div>
                  </TableCell>

                  {/* CA */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                          minimumFractionDigits: 0
                        }).format(advisor.total_deal_value)}
                      </span>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        {getTrendIcon(advisor.revenue_growth)}
                        {advisor.revenue_growth > 0 ? '+' : ''}{advisor.revenue_growth.toFixed(0)}%
                      </div>
                    </div>
                  </TableCell>

                  {/* En négociation */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{advisor.prospects_in_negotiation}</span>
                      {advisor.prospects_in_negotiation > 5 && (
                        <Badge className="text-xs bg-orange-500 hover:bg-orange-600 dark:bg-orange-400 dark:hover:bg-orange-500 text-white">Hot</Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Appels */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>{advisor.calls_made}</span>
                    </div>
                  </TableCell>

                  {/* Emails */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span>{advisor.emails_sent}</span>
                    </div>
                  </TableCell>

                  {/* Activité */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{advisor.active_days}j</span>
                      {getPerformanceBadge(advisor.active_days, {
                        high: period === '7d' ? 6 : period === '30d' ? 20 : 60,
                        medium: period === '7d' ? 4 : period === '30d' ? 15 : 40
                      })}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Calendar className="h-4 w-4 mr-2" />
                          Voir le planning
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Target className="h-4 w-4 mr-2" />
                          Détails performance
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Activity className="h-4 w-4 mr-2" />
                          Historique activité
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {sortedAdvisors.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Aucune donnée de conseiller disponible pour cette période.
          </div>
        )}
      </CardContent>
    </Card>
  );
}