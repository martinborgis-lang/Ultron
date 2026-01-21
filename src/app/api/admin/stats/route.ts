import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { createAdminClient } from '@/lib/supabase-admin';
import type { AdminDashboardStats, AdvisorStats, AdminFilters } from '@/types/crm';

export const dynamic = 'force-dynamic';

// Fonction pour calculer la croissance des prospects
async function calculateProspectsGrowth(
  adminClient: any,
  organizationId: string,
  current: { start: Date; end: Date },
  previous?: { start: Date; end: Date }
): Promise<number> {
  if (!previous) return 0;

  // Prospects période actuelle
  const { data: currentProspects } = await adminClient
    .from('crm_prospects')
    .select('id')
    .eq('organization_id', organizationId)
    .gte('created_at', current.start.toISOString())
    .lte('created_at', current.end.toISOString()) as any;

  // Prospects période précédente
  const { data: previousProspects } = await adminClient
    .from('crm_prospects')
    .select('id')
    .eq('organization_id', organizationId)
    .gte('created_at', previous.start.toISOString())
    .lte('created_at', previous.end.toISOString()) as any;

  const currentCount = currentProspects?.length || 0;
  const previousCount = previousProspects?.length || 0;

  return previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0;
}

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

  // CA réalisé = seulement les deals gagnés avec une valeur
  const wonProspects = prospects?.filter((p: any) => p.stage?.is_won) || [];
  const totalDealValue = wonProspects.reduce((sum: number, p: any) => sum + (p.deal_value || 0), 0);

  // Prévisionnel = prospects en cours avec probabilité
  const activeProspects = prospects?.filter((p: any) => !p.stage?.is_won && !p.stage?.is_lost) || [];
  const weightedForecast = activeProspects.reduce((sum: number, p: any) =>
    sum + (p.deal_value || 0) * (p.close_probability || 0) / 100, 0
  ) || 0;

  const rdvScheduled = meetings?.length || 0;
  const rdvCompleted = meetings?.filter((m: any) => m.status === 'completed').length || 0;
  const rdvNoShow = meetings?.filter((m: any) => m.status === 'cancelled' ||
    (m.start_date && new Date(m.start_date) < new Date() && m.status === 'pending')).length || 0;

  const callsActivity = activities?.filter((a: any) => a.type === 'call').length || 0;
  const emailsActivity = activities?.filter((a: any) => a.type === 'email').length || 0;
  const meetingsActivity = activities?.filter((a: any) => a.type === 'meeting').length || 0;

  // Calculs des appels (transitions de stage)
  const { data: stageTransitions } = await adminClient
    .from('crm_activities')
    .select('id, type, metadata')
    .eq('organization_id', organizationId)
    .eq('user_id', advisorId)
    .eq('type', 'stage_change')
    .gte('created_at', startStr)
    .lte('created_at', endStr) as any;

  // Compter les appels = transitions depuis "nouveau" vers "contacté", "rdv_pris", "refus"
  const callsMade = (stageTransitions?.filter((t: any) => {
    const meta = t.metadata || {};
    return meta.from_stage === 'nouveau' &&
           ['contacte', 'rdv_pris', 'refus'].includes(meta.to_stage);
  }).length || 0) + callsActivity; // + activités de type "call" directes

  // Nouveaux taux de conversion selon la demande
  const conversionRdvToDeals = rdvScheduled > 0 ? (wonDeals / rdvScheduled) * 100 : 0; // RDV → Deals (principal)
  const conversionCallsToRdv = callsMade > 0 ? (rdvScheduled / callsMade) * 100 : 0; // Appels → RDV (informatif)
  const conversionCallsToDeals = callsMade > 0 ? (wonDeals / callsMade) * 100 : 0; // Appels → Deals (informatif)

  // Autres conversions utiles
  const conversionFirstRdv = totalProspects > 0 ? (rdvScheduled / totalProspects) * 100 : 0;
  const conversionProposal = rdvCompleted > 0 ? (prospectsInNegotiation / rdvCompleted) * 100 : 0;
  const conversionClosing = prospectsInNegotiation > 0 ? (wonDeals / prospectsInNegotiation) * 100 : 0;

  // Jours actifs (jours où il y a eu au least une activité)
  const activeDates = new Set(activities?.map((a: any) => a.created_at.split('T')[0]) || []);
  const activeDays = activeDates.size;

  // Temps de réponse moyen calculé depuis les activités email
  const emailActivities = activities?.filter((a: any) => a.type === 'email') || [];
  let averageResponseTime = 0;

  if (emailActivities.length > 0) {
    // Calculer le temps moyen entre création prospect et premier email
    const responseTimes = await Promise.all(emailActivities.map(async (activity: any) => {
      const { data: prospect } = await adminClient
        .from('crm_prospects')
        .select('created_at')
        .eq('id', activity.prospect_id)
        .single();

      if (prospect) {
        const prospectDate = new Date(prospect.created_at);
        const emailDate = new Date(activity.created_at);
        return (emailDate.getTime() - prospectDate.getTime()) / (1000 * 60 * 60); // en heures
      }
      return 0;
    }));

    const validTimes = responseTimes.filter(t => t > 0 && t < 168); // Moins de 7 jours
    averageResponseTime = validTimes.length > 0
      ? validTimes.reduce((sum, t) => sum + t, 0) / validTimes.length
      : 0;
  }

  // Stats de la période précédente pour calcul de croissance (réel)
  let rdvGrowth = 0;
  let conversionGrowth = 0;
  let revenueGrowth = 0;

  if (previousPeriod) {
    // Calculs réels pour la période précédente
    const prevStartStr = previousPeriod.start.toISOString();
    const prevEndStr = previousPeriod.end.toISOString();

    // RDV période précédente
    const { data: prevMeetings } = await adminClient
      .from('crm_events')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('assigned_to', advisorId)
      .eq('type', 'meeting')
      .gte('start_date', prevStartStr)
      .lte('start_date', prevEndStr) as any;

    // Revenue période précédente (seulement deals gagnés)
    const { data: prevProspects } = await adminClient
      .from('crm_prospects')
      .select(`
        deal_value, stage_slug, won_date,
        stage:pipeline_stages(is_won)
      `)
      .eq('organization_id', organizationId)
      .eq('assigned_to', advisorId)
      .gte('won_date', prevStartStr)
      .lte('won_date', prevEndStr) as any;

    const prevRdvCount = prevMeetings?.length || 0;
    const prevRevenue = (prevProspects?.filter((p: any) => p.stage?.is_won) || [])
      .reduce((sum: number, p: any) => sum + (p.deal_value || 0), 0);
    const prevWonDeals = prevProspects?.filter((p: any) =>
      p.stage_slug === 'gagne' || p.stage_slug === 'signe'
    ).length || 0;
    const prevConversion = prevRdvCount > 0 ? (prevWonDeals / prevRdvCount) * 100 : 0;

    // Calculs de croissance
    rdvGrowth = prevRdvCount > 0 ? ((rdvScheduled - prevRdvCount) / prevRdvCount) * 100 : 0;
    conversionGrowth = prevConversion > 0 ? ((conversionRdvToDeals - prevConversion) / prevConversion) * 100 : 0;
    revenueGrowth = prevRevenue > 0 ? ((totalDealValue - prevRevenue) / prevRevenue) * 100 : 0;
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
    conversion_rate_overall: conversionRdvToDeals, // Nouveau : RDV → Deals

    // Nouvelles métriques informatives
    conversion_calls_to_rdv: conversionCallsToRdv, // Appels → RDV (informatif)
    conversion_calls_to_deals: conversionCallsToDeals, // Appels → Deals (informatif)
    calls_made_total: callsMade, // Total appels effectués

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
        prospects_growth: await calculateProspectsGrowth(adminClient, context.organization.id, current, compareWithPrevious ? previous : undefined)
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