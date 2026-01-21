'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Activity, Phone, Mail, Calendar, Clock } from 'lucide-react';
import type { ActivityHeatmapData } from '@/types/crm';

interface ActivityHeatmapProps {
  period: string;
}

export function ActivityHeatmap({ period }: ActivityHeatmapProps) {
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<ActivityHeatmapData[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/charts?type=activity&period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setActivityData(data.activity_data || []);
      }
    } catch (error) {
      console.error('Error fetching activity data:', error);
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

  // Calculer le score max pour la normalisation
  const maxScore = Math.max(
    ...activityData.flatMap(advisor =>
      advisor.daily_activity.map(day => day.total_score)
    ),
    1
  );

  // Obtenir les derniers 14 jours pour l'affichage
  const daysToShow = period === '7d' ? 7 : 14;
  const recentDays = activityData.length > 0
    ? activityData[0].daily_activity.slice(-daysToShow)
    : [];

  // Calculer les totaux par conseiller
  const advisorTotals = activityData.map(advisor => {
    const totalCalls = advisor.daily_activity.reduce((sum, day) => sum + day.calls, 0);
    const totalEmails = advisor.daily_activity.reduce((sum, day) => sum + day.emails, 0);
    const totalMeetings = advisor.daily_activity.reduce((sum, day) => sum + day.meetings, 0);
    const totalScore = advisor.daily_activity.reduce((sum, day) => sum + day.total_score, 0);
    const activeDays = advisor.daily_activity.filter(day => day.total_score > 0).length;

    return {
      ...advisor,
      totalCalls,
      totalEmails,
      totalMeetings,
      totalScore,
      activeDays,
      avgDailyScore: advisor.daily_activity.length > 0 ? totalScore / advisor.daily_activity.length : 0
    };
  });

  // Trier par score total
  const sortedAdvisors = [...advisorTotals].sort((a, b) => b.totalScore - a.totalScore);

  const getIntensityColor = (score: number) => {
    const intensity = score / maxScore;
    if (intensity === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (intensity <= 0.2) return 'bg-green-100 dark:bg-green-900/30';
    if (intensity <= 0.4) return 'bg-green-200 dark:bg-green-900/50';
    if (intensity <= 0.6) return 'bg-green-300 dark:bg-green-800/70';
    if (intensity <= 0.8) return 'bg-green-400 dark:bg-green-700';
    return 'bg-green-500 dark:bg-green-600';
  };

  const getActivityLevel = (score: number) => {
    if (score === 0) return 'Aucune';
    if (score <= 3) return 'Faible';
    if (score <= 8) return 'Modérée';
    if (score <= 15) return 'Élevée';
    return 'Intense';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Heatmap d'Activité
        </CardTitle>
        <CardDescription>
          Visualisation de l'intensité d'activité quotidienne de chaque conseiller
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Légende */}
        <div className="mb-6 p-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">Niveau d'activité</h4>
            <div className="text-xs text-muted-foreground">
              Score = Appels×2 + Emails×1 + Meetings×3
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">Faible</span>
            <div className="flex gap-1">
              {[
                'bg-gray-100 dark:bg-gray-800',
                'bg-green-100 dark:bg-green-900/30',
                'bg-green-200 dark:bg-green-900/50',
                'bg-green-300 dark:bg-green-800/70',
                'bg-green-400 dark:bg-green-700',
                'bg-green-500 dark:bg-green-600'
              ].map((color, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded ${color} border border-gray-300 dark:border-gray-600`}
                />
              ))}
            </div>
            <span className="text-xs">Intense</span>
          </div>
        </div>

        {/* Heatmap */}
        <div className="space-y-4">
          {/* Headers des jours */}
          <div className="flex items-center">
            <div className="w-40 text-sm font-medium">Conseiller</div>
            <div className="flex gap-1 flex-1">
              {recentDays.map((day, index) => (
                <div key={index} className="flex-1 text-center">
                  <div className="text-xs text-muted-foreground">
                    {new Date(day.date).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit'
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(day.date).toLocaleDateString('fr-FR', {
                      weekday: 'short'
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="w-20 text-sm font-medium text-right">Total</div>
          </div>

          {/* Lignes des conseillers */}
          {sortedAdvisors.map((advisor) => (
            <div key={advisor.advisor_id} className="flex items-center">
              <div className="w-40">
                <div className="text-sm font-medium truncate">
                  {advisor.advisor_name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {advisor.activeDays}j actifs
                </div>
              </div>

              {/* Cases d'activité */}
              <div className="flex gap-1 flex-1">
                {advisor.daily_activity.slice(-daysToShow).map((day, index) => (
                  <div
                    key={index}
                    className={`flex-1 h-12 rounded border border-gray-300 dark:border-gray-600 ${getIntensityColor(day.total_score)}
                      cursor-pointer transition-all hover:scale-110 hover:z-10 relative group`}
                    title={`${new Date(day.date).toLocaleDateString('fr-FR')}\n${day.calls} appels, ${day.emails} emails, ${day.meetings} meetings\nScore: ${day.total_score}`}
                  >
                    {/* Tooltip au hover */}
                    <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black dark:bg-gray-900 text-white text-xs rounded whitespace-nowrap z-20 border border-gray-600">
                      <div>{new Date(day.date).toLocaleDateString('fr-FR')}</div>
                      <div>{day.calls} appels • {day.emails} emails • {day.meetings} RDV</div>
                      <div>Score: {day.total_score}</div>
                    </div>

                    {/* Indicateur de score élevé */}
                    {day.total_score > maxScore * 0.8 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white text-xs font-bold">🔥</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="w-20 text-right">
                <div className="text-sm font-medium">{advisor.totalScore}</div>
                <Badge variant="secondary" className="text-xs">
                  {getActivityLevel(advisor.avgDailyScore)}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Stats globales */}
        <div className="mt-8 pt-6 border-t border-border">
          <h4 className="font-medium mb-4">Statistiques d'Activité</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg text-center border border-blue-200 dark:border-blue-800">
              <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {sortedAdvisors.reduce((sum, a) => sum + a.totalCalls, 0)}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Appels Total</div>
            </div>

            <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-lg text-center border border-green-200 dark:border-green-800">
              <Mail className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-green-900 dark:text-green-100">
                {sortedAdvisors.reduce((sum, a) => sum + a.totalEmails, 0)}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">Emails Total</div>
            </div>

            <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg text-center border border-purple-200 dark:border-purple-800">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                {sortedAdvisors.reduce((sum, a) => sum + a.totalMeetings, 0)}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Meetings Total</div>
            </div>

            <div className="p-4 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-lg text-center border border-yellow-200 dark:border-yellow-800">
              <Activity className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                {(sortedAdvisors.reduce((sum, a) => sum + a.avgDailyScore, 0) / sortedAdvisors.length).toFixed(1)}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">Score Moyen/Jour</div>
            </div>
          </div>
        </div>

        {/* Top performers et insights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {/* Conseiller le plus actif */}
          {sortedAdvisors.length > 0 && (
            <div className="p-3 bg-green-50/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
              <div className="font-medium text-green-800 dark:text-green-300">🏆 Plus Actif</div>
              <div className="text-green-700 dark:text-green-400">
                {sortedAdvisors[0].advisor_name} avec un score de {sortedAdvisors[0].totalScore}
              </div>
            </div>
          )}

          {/* Constance d'activité */}
          {sortedAdvisors.length > 0 && (
            <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
              <div className="font-medium text-blue-800 dark:text-blue-300">📅 Plus Constant</div>
              <div className="text-blue-700 dark:text-blue-400">
                {sortedAdvisors
                  .sort((a, b) => b.activeDays - a.activeDays)[0]
                  ?.advisor_name} avec {sortedAdvisors
                  .sort((a, b) => b.activeDays - a.activeDays)[0]
                  ?.activeDays} jours actifs
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}