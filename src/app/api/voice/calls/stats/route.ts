import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { user, organization } = await getCurrentUserAndOrganization();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '30'; // Derniers 30 jours par défaut

    const supabase = await createClient();

    // Date de début selon la période
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period));

    // Statistiques générales
    const { data: callsData, error: callsError } = await supabase
      .from('voice_calls')
      .select('id, duration_seconds, status, outcome, ai_outcome')
      .eq('organization_id', organization.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (callsError) {
      console.error('Erreur récupération données calls:', callsError);
      return NextResponse.json({ error: 'Erreur récupération des données' }, { status: 500 });
    }

    const totalCalls = callsData?.length || 0;
    const completedCalls = callsData?.filter(call => call.status === 'completed') || [];
    const totalDuration = completedCalls.reduce((sum, call) => sum + (call.duration_seconds || 0), 0);
    const avgDuration = completedCalls.length > 0 ? Math.round(totalDuration / completedCalls.length) : 0;

    // Calcul du taux de conversion
    const successfulOutcomes = ['rdv_pris', 'callback_demande', 'information_demandee'];
    const successfulCalls = callsData?.filter(call =>
      successfulOutcomes.includes(call.ai_outcome || call.outcome || '')
    ) || [];
    const conversionRate = totalCalls > 0 ? (successfulCalls.length / totalCalls) * 100 : 0;

    // Statistiques par outcome
    const outcomeStats: { [key: string]: number } = {};
    callsData?.forEach(call => {
      const outcome = call.ai_outcome || call.outcome || 'unknown';
      outcomeStats[outcome] = (outcomeStats[outcome] || 0) + 1;
    });

    // Statistiques par statut
    const statusStats: { [key: string]: number } = {};
    callsData?.forEach(call => {
      statusStats[call.status] = (statusStats[call.status] || 0) + 1;
    });

    // Statistiques par jour (pour graphiques)
    const dailyStats: { [key: string]: { calls: number; duration: number; successful: number } } = {};

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dailyStats[dateKey] = { calls: 0, duration: 0, successful: 0 };
    }

    callsData?.forEach(call => {
      const dateKey = new Date(call.created_at || '').toISOString().split('T')[0];
      if (dailyStats[dateKey]) {
        dailyStats[dateKey].calls += 1;
        dailyStats[dateKey].duration += call.duration_seconds || 0;
        if (successfulOutcomes.includes(call.ai_outcome || call.outcome || '')) {
          dailyStats[dateKey].successful += 1;
        }
      }
    });

    // Top performers (si plusieurs utilisateurs)
    const { data: userStats, error: userError } = await supabase
      .from('voice_calls')
      .select(`
        user_id,
        users:user_id (full_name, email),
        duration_seconds,
        outcome,
        ai_outcome
      `)
      .eq('organization_id', organization.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const performanceByUser: { [key: string]: any } = {};

    userStats?.forEach(call => {
      const userId = call.user_id;
      const userName = (call as any).users?.full_name || (call as any).users?.email || 'Inconnu';

      if (!performanceByUser[userId]) {
        performanceByUser[userId] = {
          user_id: userId,
          user_name: userName,
          total_calls: 0,
          total_duration: 0,
          successful_calls: 0,
          conversion_rate: 0
        };
      }

      performanceByUser[userId].total_calls += 1;
      performanceByUser[userId].total_duration += call.duration_seconds || 0;

      if (successfulOutcomes.includes(call.ai_outcome || call.outcome || '')) {
        performanceByUser[userId].successful_calls += 1;
      }
    });

    // Calcul du taux de conversion par utilisateur
    Object.values(performanceByUser).forEach((userPerf: any) => {
      userPerf.conversion_rate = userPerf.total_calls > 0
        ? Math.round((userPerf.successful_calls / userPerf.total_calls) * 100)
        : 0;
    });

    const topPerformers = Object.values(performanceByUser)
      .sort((a: any, b: any) => b.conversion_rate - a.conversion_rate)
      .slice(0, 5);

    return NextResponse.json({
      // Métriques principales
      total_calls: totalCalls,
      successful_calls: successfulCalls.length,
      total_duration: totalDuration,
      avg_duration: avgDuration,
      conversion_rate: Math.round(conversionRate),

      // Répartitions
      outcome_stats: outcomeStats,
      status_stats: statusStats,

      // Données temporelles
      daily_stats: Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        ...stats
      })),

      // Performance utilisateurs
      top_performers: topPerformers,

      // Métadonnées
      period: parseInt(period),
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    });

  } catch (error) {
    console.error('Erreur API stats:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}