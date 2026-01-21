'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingDown } from 'lucide-react';
import type { ConversionFunnelData } from '@/types/crm';

interface ConversionFunnelChartProps {
  period: string;
}

export function ConversionFunnelChart({ period }: ConversionFunnelChartProps) {
  const [loading, setLoading] = useState(true);
  const [funnelData, setFunnelData] = useState<ConversionFunnelData[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/charts?type=funnel&period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setFunnelData(data.funnel_data || []);
      }
    } catch (error) {
      console.error('Error fetching funnel data:', error);
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

  // Calculer les moyennes globales
  const globalFunnel = {
    contact: 0,
    first_rdv: 0,
    proposal: 0,
    negotiation: 0,
    closed_won: 0
  };

  funnelData.forEach(advisor => {
    advisor.stages.forEach(stage => {
      globalFunnel[stage.stage] += stage.count;
    });
  });

  const globalStages = [
    {
      stage: 'contact',
      stage_name: 'Contact initial',
      count: globalFunnel.contact,
      conversion_rate: 100
    },
    {
      stage: 'first_rdv',
      stage_name: 'Premier RDV',
      count: globalFunnel.first_rdv,
      conversion_rate: globalFunnel.contact > 0 ? (globalFunnel.first_rdv / globalFunnel.contact) * 100 : 0
    },
    {
      stage: 'proposal',
      stage_name: 'Proposition',
      count: globalFunnel.proposal,
      conversion_rate: globalFunnel.first_rdv > 0 ? (globalFunnel.proposal / globalFunnel.first_rdv) * 100 : 0
    },
    {
      stage: 'negotiation',
      stage_name: 'Négociation',
      count: globalFunnel.negotiation,
      conversion_rate: globalFunnel.proposal > 0 ? (globalFunnel.negotiation / globalFunnel.proposal) * 100 : 0
    },
    {
      stage: 'closed_won',
      stage_name: 'Deal signé',
      count: globalFunnel.closed_won,
      conversion_rate: globalFunnel.negotiation > 0 ? (globalFunnel.closed_won / globalFunnel.negotiation) * 100 : 0
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Entonnoir de Conversion Global
        </CardTitle>
        <CardDescription>
          Analyse des taux de conversion à chaque étape du processus commercial
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Entonnoir global */}
        <div className="space-y-4">
          {globalStages.map((stage, index) => {
            const width = Math.max((stage.count / globalStages[0].count) * 100, 10);
            const isBottleneck = index > 0 && stage.conversion_rate < 50;

            return (
              <div key={stage.stage} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium w-32">{stage.stage_name}</div>
                    {isBottleneck && (
                      <Badge variant="destructive" className="text-xs">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        Goulot
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium">{stage.count}</span>
                    {index > 0 && (
                      <span className={`font-medium ${
                        stage.conversion_rate > 65 ? 'text-green-600 dark:text-green-400' :
                        stage.conversion_rate > 50 ? 'text-lime-600 dark:text-lime-400' :
                        stage.conversion_rate > 35 ? 'text-orange-600 dark:text-orange-400' :
                        stage.conversion_rate > 20 ? 'text-red-500 dark:text-red-400' : 'text-red-700 dark:text-red-600'
                      }`}>
                        {stage.conversion_rate.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Barre de l'entonnoir */}
                <div className="relative">
                  <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-border">
                    <div
                      className={`h-full transition-all duration-500 ${
                        index === 0 ? 'bg-green-500 dark:bg-green-400' : // Premier stage toujours vert
                        stage.conversion_rate > 80 ? 'bg-green-500 dark:bg-green-400' :  // Excellent: vert foncé
                        stage.conversion_rate > 65 ? 'bg-green-400 dark:bg-green-500' :  // Très bon: vert
                        stage.conversion_rate > 50 ? 'bg-lime-400 dark:bg-lime-500' :    // Bon: vert clair
                        stage.conversion_rate > 35 ? 'bg-orange-400 dark:bg-orange-500' : // Moyen: orange
                        stage.conversion_rate > 20 ? 'bg-red-400 dark:bg-red-500' :      // Faible: rouge clair
                        'bg-red-600 dark:bg-red-700'                                      // Très faible: rouge foncé
                      }`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  {/* Flèche de perte */}
                  {index > 0 && (
                    <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
                      <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded border border-red-200 dark:border-red-800">
                        -{(100 - stage.conversion_rate).toFixed(0)}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Détail par conseiller (Top 3) */}
        <div className="mt-8 pt-6 border-t">
          <h4 className="font-medium mb-4">Performance par Conseiller (Top 3)</h4>
          <div className="space-y-6">
            {funnelData
              .sort((a, b) => {
                const aConversion = a.stages.find(s => s.stage === 'closed_won')?.conversion_rate || 0;
                const bConversion = b.stages.find(s => s.stage === 'closed_won')?.conversion_rate || 0;
                return bConversion - aConversion;
              })
              .slice(0, 3)
              .map((advisor, advisorIndex) => (
                <div key={advisor.advisor_id} className="p-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium">{advisor.advisor_name}</h5>
                    <Badge variant={advisorIndex === 0 ? 'default' : 'secondary'}>
                      {advisorIndex === 0 ? '🥇 Top' : advisorIndex === 1 ? '🥈' : '🥉'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-5 gap-2 text-xs">
                    {advisor.stages.map((stage, stageIndex) => (
                      <div key={stage.stage} className="text-center">
                        <div className="font-medium mb-1">{stage.count}</div>
                        <div className="text-muted-foreground">{stage.stage_name}</div>
                        {stageIndex > 0 && (
                          <div className={`mt-1 font-medium ${
                            stage.conversion_rate > 65 ? 'text-green-600 dark:text-green-400' :
                            stage.conversion_rate > 50 ? 'text-lime-600 dark:text-lime-400' :
                            stage.conversion_rate > 35 ? 'text-orange-600 dark:text-orange-400' :
                            stage.conversion_rate > 20 ? 'text-red-500 dark:text-red-400' : 'text-red-700 dark:text-red-600'
                          }`}>
                            {stage.conversion_rate.toFixed(0)}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Insights et recommandations */}
        <div className="mt-8 pt-6 border-t border-border">
          <h4 className="font-medium mb-4">Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {globalStages.slice(1).map((stage, index) => {
              if (stage.conversion_rate < 40) {
                return (
                  <div key={stage.stage} className="p-3 bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                    <div className="font-medium text-red-800 dark:text-red-300">⚠️ Attention: {stage.stage_name}</div>
                    <div className="text-red-700 dark:text-red-400">
                      Seulement {stage.conversion_rate.toFixed(1)}% de conversion.
                      Considérez une formation ou un audit du processus.
                    </div>
                  </div>
                );
              }
              return null;
            })}

            {globalStages.every(stage => stage.conversion_rate > 70 || stage.stage === 'contact') && (
              <div className="p-3 bg-green-50/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                <div className="font-medium text-green-800 dark:text-green-300">✅ Excellent processus</div>
                <div className="text-green-700 dark:text-green-400">
                  Toutes les étapes de conversion sont au-dessus de 70%.
                  Continuez sur cette lancée !
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}