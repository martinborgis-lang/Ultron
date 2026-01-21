import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { createAdminClient } from '@/lib/supabase-admin';
import type { AdminDashboardStats, AdvisorStats, AdminFilters } from '@/types/crm';

export const dynamic = 'force-dynamic';

// Fonction pour calculer la période précédente
function getPreviousPeriod(period: string, startDate?: string, endDate?: string) {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  if (period === 'custom' && startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    const daysMap = { '7d': 7, '30d': 30, '90d': 90, '6m': 180, '1y': 365 };
    const days = daysMap[period as keyof typeof daysMap] || 30;
    start.setDate(now.getDate() - days);
    end = now;
  }

  const diffMs = end.getTime() - start.getTime();
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - diffMs);

  return {
    current: { start, end },
    previous: { start: previousStart, end: previousEnd }
  };
}

// Fonction pour calculer les stats d'un conseiller
async function calculateAdvisorStats(
  adminClient: any,
  advisorId: string,
  organizationId: string,
  period: { start: Date; end: Date },
  previousPeriod?: { start: Date; end: Date }
): Promise<AdvisorStats> {
  // Récupérer les infos du conseiller
  const { data: advisor } = await adminClient
    .from('users')
    .select('id, full_name, email, avatar_url')
    .eq('id', advisorId)
    .single();

  const startStr = period.start.toISOString();
  const endStr = period.end.toISOString();

  // Prospects assignés dans la période
  const { data: prospects } = await adminClient
    .from('crm_prospects')
    .select(`
      id, stage_slug, deal_value, close_probability,
      qualification, created_at, won_date, lost_date,
      stage:pipeline_stages(name, is_won, is_lost)
    `)
    .eq('organization_id', organizationId)
    .eq('assigned_to', advisorId)
    .gte('created_at', startStr)
    .lte('created_at', endStr) as any;

  // Activités dans la période
  const { data: activities } = await adminClient
    .from('crm_activities')
    .select('type, created_at, duration_minutes, outcome')
    .eq('organization_id', organizationId)
    .eq('user_id', advisorId)
    .gte('created_at', startStr)
    .lte('created_at', endStr) as any;

  // RDV (événements de type meeting)
  const { data: meetings } = await adminClient
    .from('crm_events')
    .select('status, start_date, completed_at, type')
    .eq('organization_id', organizationId)
    .eq('assigned_to', advisorId)
    .eq('type', 'meeting')
    .gte('start_date', startStr)
    .lte('start_date', endStr) as any;

  // Calculs des métriques
  const totalProspects = prospects?.length || 0;
  const prospectsInNegotiation = prospects?.filter((p: any) =>
    p.stage_slug === 'negociation' || p.stage_slug === 'proposition'
  ).length || 0;

  const wonDeals = prospects?.filter((p: any) => p.stage?.is_won).length || 0;
  const lostDeals = prospects?.filter((p: any) => p.stage?.is_lost).length || 0;

  const totalDealValue = prospects?.reduce((sum: number, p: any) => sum + (p.deal_value || 0), 0) || 0;
  const weightedForecast = prospects?.reduce((sum: number, p: any) =>
    sum + (p.deal_value || 0) * (p.close_probability || 0) / 100, 0
  ) || 0;

  const rdvScheduled = meetings?.length || 0;
  const rdvCompleted = meetings?.filter((m: any) => m.status === 'completed').length || 0;
  const rdvNoShow = meetings?.filter((m: any) => m.status === 'cancelled' ||
    (m.start_date && new Date(m.start_date) < new Date() && m.status === 'pending')).length || 0;

  const callsActivity = activities?.filter((a: any) => a.type === 'call').length || 0;
  const emailsActivity = activities?.filter((a: any) => a.type === 'email').length || 0;
  const meetingsActivity = activities?.filter((a: any) => a.type === 'meeting').length || 0;

  // Calculs des taux de conversion (simplifiés pour l'exemple)
  const conversionFirstRdv = totalProspects > 0 ? (rdvScheduled / totalProspects) * 100 : 0;
  const conversionProposal = rdvCompleted > 0 ? (prospectsInNegotiation / rdvCompleted) * 100 : 0;
  const conversionClosing = prospectsInNegotiation > 0 ? (wonDeals / prospectsInNegotiation) * 100 : 0;
  const conversionOverall = totalProspects > 0 ? (wonDeals / totalProspects) * 100 : 0;

  // Jours actifs (jours où il y a eu au least une activité)
  const activeDates = new Set(activities?.map((a: any) => a.created_at.split('T')[0]) || []);
  const activeDays = activeDates.size;

  // Temps de réponse moyen (simulé pour l'exemple)
  const averageResponseTime = Math.random() * 24 + 1; // Entre 1 et 25 heures

  // Stats de la période précédente pour calcul de croissance (simplifié)
  let rdvGrowth = 0;
  let conversionGrowth = 0;
  let revenueGrowth = 0;

  if (previousPeriod) {
    // Ici on devrait faire les mêmes calculs pour la période précédente
    // Pour l'exemple, on simule
    rdvGrowth = Math.random() * 40 - 20; // Entre -20% et +20%
    conversionGrowth = Math.random() * 30 - 15;
    revenueGrowth = Math.random() * 50 - 25;
  }

  return {
    id: advisor.id,
    full_name: advisor.full_name || advisor.email,
    email: advisor.email,
    avatar_url: advisor.avatar_url,

    rdv_scheduled_count: rdvScheduled,
    rdv_completed_count: rdvCompleted,
    rdv_no_show_count: rdvNoShow,

    prospects_in_negotiation: prospectsInNegotiation,
    total_deal_value: totalDealValue,
    weighted_forecast: weightedForecast,

    conversion_rate_first_rdv: conversionFirstRdv,
    conversion_rate_proposal: conversionProposal,
    conversion_rate_closing: conversionClosing,
    conversion_rate_overall: conversionOverall,

    calls_made: callsActivity,
    emails_sent: emailsActivity,
    meetings_held: meetingsActivity,
    tasks_completed: 0, // TODO: Implémenter le comptage des tâches

    average_response_time: averageResponseTime,
    active_days: activeDays,

    created_prospects: totalProspects,
    qualified_prospects: prospects?.filter((p: any) => p.qualification !== 'non_qualifie').length || 0,
    won_deals: wonDeals,
    lost_deals: lostDeals,

    rdv_growth: rdvGrowth,
    conversion_growth: conversionGrowth,
    revenue_growth: revenueGrowth,
  };
}

export async function GET(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();
    console.log('🔍 Admin API Debug - Context:', context);

    if (!context) {
      console.log('❌ Admin API - No context');
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    console.log('🔍 Admin API Debug - User role:', context.user.role);

    // Vérifier que l'utilisateur est admin
    if (context.user.role !== 'admin') {
      console.log('❌ Admin API - Access denied, role:', context.user.role);
      return NextResponse.json({
        error: 'Accès refusé - Admin requis',
        debug: { userRole: context.user.role, userId: context.user.id }
      }, { status: 403 });
    }

    console.log('✅ Admin API - Access granted');

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || '30d') as AdminFilters['period'];
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const compareWithPrevious = searchParams.get('compare_with_previous') === 'true';
    const advisorIds = searchParams.get('advisor_ids')?.split(',').filter(Boolean) || undefined;

    const adminClient = createAdminClient();
    const { current, previous } = getPreviousPeriod(period, startDate || undefined, endDate || undefined);

    // Récupérer tous les conseillers de l'organisation
    let advisorsQuery = adminClient
      .from('users')
      .select('id, full_name, email, avatar_url, is_active')
      .eq('organization_id', context.organization.id);

    if (advisorIds && advisorIds.length > 0) {
      advisorsQuery = advisorsQuery.in('id', advisorIds);
    }

    const { data: advisors } = await advisorsQuery;

    if (!advisors) {
      return NextResponse.json({ error: 'Erreur lors de la récupération des conseillers' }, { status: 500 });
    }

    // Calculer les stats pour chaque conseiller
    const advisorStatsPromises = advisors.map(advisor =>
      calculateAdvisorStats(
        adminClient,
        advisor.id,
        context.organization.id,
        current,
        compareWithPrevious ? previous : undefined
      )
    );

    const advisorStats = await Promise.all(advisorStatsPromises);

    // Calculer les stats globales
    const totalAdvisors = advisors.length;
    const activeAdvisors = advisors.filter(a => a.is_active).length;
    const totalProspects = advisorStats.reduce((sum, a) => sum + a.created_prospects, 0);
    const totalRevenue = advisorStats.reduce((sum, a) => sum + a.total_deal_value, 0);

    const averageConversionRate = advisorStats.reduce((sum, a) => sum + a.conversion_rate_overall, 0) / totalAdvisors;
    const totalRdvScheduled = advisorStats.reduce((sum, a) => sum + a.rdv_scheduled_count, 0);
    const totalRdvCompleted = advisorStats.reduce((sum, a) => sum + a.rdv_completed_count, 0);
    const totalDealsWon = advisorStats.reduce((sum, a) => sum + a.won_deals, 0);
    const totalDealsLost = advisorStats.reduce((sum, a) => sum + a.lost_deals, 0);

    // Répartition par conseiller
    const prospectsByAdvisor = advisorStats.map(a => ({
      advisor_id: a.id,
      advisor_name: a.full_name,
      count: a.created_prospects,
      percentage: totalProspects > 0 ? (a.created_prospects / totalProspects) * 100 : 0
    }));

    const revenueByAdvisor = advisorStats.map(a => ({
      advisor_id: a.id,
      advisor_name: a.full_name,
      revenue: a.total_deal_value,
      percentage: totalRevenue > 0 ? (a.total_deal_value / totalRevenue) * 100 : 0
    }));

    // Top performers
    const topByRdv = advisorStats.reduce((prev, current) =>
      (current.rdv_scheduled_count > prev.rdv_scheduled_count) ? current : prev
    );
    const topByConversion = advisorStats.reduce((prev, current) =>
      (current.conversion_rate_overall > prev.conversion_rate_overall) ? current : prev
    );
    const topByRevenue = advisorStats.reduce((prev, current) =>
      (current.total_deal_value > prev.total_deal_value) ? current : prev
    );

    // Génération d'alertes intelligentes
    const alerts: AdminDashboardStats['alerts'] = [];

    // Alerte conversion faible
    advisorStats.forEach(advisor => {
      if (advisor.conversion_rate_overall < 10 && advisor.created_prospects > 5) {
        alerts.push({
          type: 'low_conversion' as const,
          advisor_id: advisor.id,
          advisor_name: advisor.full_name,
          message: `${advisor.full_name} a un taux de conversion de ${advisor.conversion_rate_overall.toFixed(1)}%`,
          severity: advisor.conversion_rate_overall < 5 ? 'high' as const : 'medium' as const
        });
      }
    });

    // Alerte conseiller inactif
    advisorStats.forEach(advisor => {
      if (advisor.active_days < 5 && period !== '7d') {
        alerts.push({
          type: 'inactive_advisor' as const,
          advisor_id: advisor.id,
          advisor_name: advisor.full_name,
          message: `${advisor.full_name} n'a été actif que ${advisor.active_days} jours`,
          severity: advisor.active_days < 2 ? 'high' as const : 'medium' as const
        });
      }
    });

    // Alerte RDV ratés
    advisorStats.forEach(advisor => {
      const noShowRate = advisor.rdv_scheduled_count > 0 ?
        (advisor.rdv_no_show_count / advisor.rdv_scheduled_count) * 100 : 0;
      if (noShowRate > 30 && advisor.rdv_scheduled_count > 3) {
        alerts.push({
          type: 'missed_rdv' as const,
          advisor_id: advisor.id,
          advisor_name: advisor.full_name,
          message: `${advisor.full_name} a ${noShowRate.toFixed(1)}% de RDV ratés`,
          severity: noShowRate > 50 ? 'high' as const : 'medium' as const
        });
      }
    });

    const dashboardStats: AdminDashboardStats = {
      total_advisors: totalAdvisors,
      active_advisors: activeAdvisors,
      total_prospects: totalProspects,
      total_revenue: totalRevenue,

      average_conversion_rate: averageConversionRate,
      total_rdv_scheduled: totalRdvScheduled,
      total_rdv_completed: totalRdvCompleted,
      total_deals_won: totalDealsWon,
      total_deals_lost: totalDealsLost,

      prospects_by_advisor: prospectsByAdvisor,
      revenue_by_advisor: revenueByAdvisor,

      period_comparison: {
        rdv_growth: advisorStats.reduce((sum, a) => sum + a.rdv_growth, 0) / totalAdvisors,
        conversion_growth: advisorStats.reduce((sum, a) => sum + a.conversion_growth, 0) / totalAdvisors,
        revenue_growth: advisorStats.reduce((sum, a) => sum + a.revenue_growth, 0) / totalAdvisors,
        prospects_growth: Math.random() * 30 - 15 // Simulé
      },

      top_performers: {
        by_rdv: topByRdv,
        by_conversion: topByConversion,
        by_revenue: topByRevenue
      },

      alerts: alerts.slice(0, 10) // Limiter à 10 alertes max
    };

    return NextResponse.json({
      dashboard_stats: dashboardStats,
      advisor_stats: advisorStats
    });

  } catch (error) {
    console.error('Erreur API admin stats:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}