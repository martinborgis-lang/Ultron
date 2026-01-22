import { createAdminClient } from '@/lib/supabase-admin';
import type { AdminDashboardStats, AdvisorStats, AdminFilters } from '@/types/crm';
import type { SupabaseClient } from '@supabase/supabase-js';

interface ProspectData {
  id: string;
  stage_slug: string;
  deal_value: number | null;
  close_probability: number;
  qualification: string;
  created_at: string;
  won_date: string | null;
  lost_date: string | null;
  stage: {
    name: string;
    is_won: boolean;
    is_lost: boolean;
  } | null;
}

interface ActivityData {
  type: string;
  created_at: string;
  duration_minutes: number | null;
  outcome: string | null;
  prospect_id: string;
  metadata?: Record<string, unknown>;
}

interface MeetingData {
  status: string;
  start_date: string;
  completed_at: string | null;
  type: string;
}

interface DealData {
  id: string;
  client_amount: number;
  company_revenue: number;
  created_at: string;
  closed_at: string | null;
}

interface UserData {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  is_active: boolean;
}

interface PeriodDates {
  start: Date;
  end: Date;
}

export class AdminStatsService {
  private adminClient: SupabaseClient;
  private organizationId: string;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
    this.adminClient = createAdminClient();
  }

  async getFullStats(filters?: AdminFilters): Promise<{
    dashboard_stats: AdminDashboardStats;
    advisor_stats: AdvisorStats[];
  }> {
    const period = filters?.period || '30d';
    const { current, previous } = this.getPreviousPeriod(
      period,
      filters?.start_date,
      filters?.end_date
    );

    const advisors = await this.getAdvisors(filters?.advisor_ids);
    const advisorStats = await this.calculateAdvisorStats(
      advisors,
      current,
      filters?.compare_with_previous ? previous : undefined
    );

    const dashboardStats = await this.calculateDashboardStats(
      advisors,
      advisorStats,
      current,
      filters?.compare_with_previous ? previous : undefined
    );

    return {
      dashboard_stats: dashboardStats,
      advisor_stats: advisorStats
    };
  }

  private async getAdvisors(advisorIds?: string[]): Promise<UserData[]> {
    let query = this.adminClient
      .from('users')
      .select('id, full_name, email, avatar_url, is_active')
      .eq('organization_id', this.organizationId);

    if (advisorIds?.length) {
      query = query.in('id', advisorIds);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch advisors: ${error.message}`);
    return data || [];
  }

  private async calculateAdvisorStats(
    advisors: UserData[],
    period: PeriodDates,
    previousPeriod?: PeriodDates
  ): Promise<AdvisorStats[]> {
    const promises = advisors.map(advisor =>
      this.calculateSingleAdvisorStats(advisor, period, previousPeriod)
    );

    return Promise.all(promises);
  }

  private async calculateSingleAdvisorStats(
    advisor: UserData,
    period: PeriodDates,
    previousPeriod?: PeriodDates
  ): Promise<AdvisorStats> {
    const [prospects, activities, meetings, deals] = await Promise.all([
      this.getAdvisorProspects(advisor.id, period),
      this.getAdvisorActivities(advisor.id, period),
      this.getAdvisorMeetings(advisor.id, period),
      this.getAdvisorDeals(advisor.id, period) // ✅ Ajouter récupération deals
    ]);

    const metrics = this.calculateMetrics(prospects, activities, meetings, deals);

    let growthMetrics = { rdv_growth: 0, conversion_growth: 0, revenue_growth: 0 };
    if (previousPeriod) {
      growthMetrics = await this.calculateGrowthMetrics(
        advisor.id,
        metrics,
        previousPeriod
      );
    }

    return {
      id: advisor.id,
      full_name: advisor.full_name || advisor.email,
      email: advisor.email,
      avatar_url: advisor.avatar_url || undefined,
      ...metrics,
      ...growthMetrics
    };
  }

  private async getAdvisorProspects(
    advisorId: string,
    period: PeriodDates
  ): Promise<ProspectData[]> {
    const { data, error } = await this.adminClient
      .from('crm_prospects')
      .select(`
        id, stage_slug, deal_value, close_probability,
        qualification, created_at, won_date, lost_date,
        stage:pipeline_stages(name, is_won, is_lost)
      `)
      .eq('organization_id', this.organizationId)
      .eq('assigned_to', advisorId)
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString());

    if (error) throw new Error(`Failed to fetch advisor prospects: ${error.message}`);

    // Transformer les données pour matcher l'interface
    const transformedData = (data || []).map((item: unknown) => {
      const typedItem = item as Record<string, unknown>;
      return {
        ...typedItem,
        stage: Array.isArray(typedItem.stage) ? typedItem.stage[0] || null : typedItem.stage
      } as ProspectData;
    });

    return transformedData;
  }

  private async getAdvisorActivities(
    advisorId: string,
    period: PeriodDates
  ): Promise<ActivityData[]> {
    const { data, error } = await this.adminClient
      .from('crm_activities')
      .select('type, created_at, duration_minutes, outcome, prospect_id, metadata')
      .eq('organization_id', this.organizationId)
      .eq('user_id', advisorId)
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString());

    if (error) throw new Error(`Failed to fetch advisor activities: ${error.message}`);
    return data || [];
  }

  private async getAdvisorMeetings(
    advisorId: string,
    period: PeriodDates
  ): Promise<MeetingData[]> {
    const { data, error } = await this.adminClient
      .from('crm_events')
      .select('status, start_date, completed_at, type')
      .eq('organization_id', this.organizationId)
      .eq('assigned_to', advisorId)
      .eq('type', 'meeting')
      .gte('start_date', period.start.toISOString())
      .lte('start_date', period.end.toISOString());

    if (error) throw new Error(`Failed to fetch advisor meetings: ${error.message}`);
    return data || [];
  }

  private async getAdvisorDeals(advisorId: string, period: PeriodDates): Promise<DealData[]> {
    const { data, error } = await this.adminClient
      .from('deal_products')
      .select('id, client_amount, company_revenue, created_at, closed_at')
      .eq('organization_id', this.organizationId)
      .eq('advisor_id', advisorId)
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString());

    if (error) throw new Error(`Failed to fetch advisor deals: ${error.message}`);
    return data || [];
  }

  private calculateMetrics(
    prospects: ProspectData[],
    activities: ActivityData[],
    meetings: MeetingData[],
    deals: DealData[]
  ): Omit<AdvisorStats, 'id' | 'full_name' | 'email' | 'avatar_url' | 'rdv_growth' | 'conversion_growth' | 'revenue_growth'> {
    const totalProspects = prospects.length;
    const prospectsInNegotiation = prospects.filter(p =>
      ['negociation', 'proposition'].includes(p.stage_slug)
    ).length;

    // ✅ CORRECTION : Compter les deals réels plutôt que les prospects avec stage is_won
    const wonDeals = deals.length;
    const lostDeals = prospects.filter(p => p.stage?.is_lost).length;

    const wonProspects = prospects.filter(p => p.stage?.is_won);
    // ✅ CORRECTION : Utiliser company_revenue (CA entreprise) plutôt que client_amount (montant client)
    const totalDealValue = deals.reduce((sum, deal) => sum + (deal.company_revenue || 0), 0);

    const activeProspects = prospects.filter(p => !p.stage?.is_won && !p.stage?.is_lost);
    const weightedForecast = activeProspects.reduce((sum, p) =>
      sum + (p.deal_value || 0) * (p.close_probability || 0) / 100, 0
    );

    const rdvScheduled = meetings.length;
    const rdvCompleted = meetings.filter(m => m.status === 'completed').length;
    const rdvNoShow = meetings.filter(m =>
      m.status === 'cancelled' ||
      (new Date(m.start_date) < new Date() && m.status === 'pending')
    ).length;

    const callsActivity = activities.filter(a => a.type === 'call').length;
    const emailsActivity = activities.filter(a => a.type === 'email').length;
    const meetingsActivity = activities.filter(a => a.type === 'meeting').length;

    // Calculs des taux de conversion
    const conversionRdvToDeals = rdvScheduled > 0 ? (wonDeals / rdvScheduled) * 100 : 0;
    const conversionCallsToRdv = callsActivity > 0 ? (rdvScheduled / callsActivity) * 100 : 0;
    const conversionFirstRdv = totalProspects > 0 ? (rdvScheduled / totalProspects) * 100 : 0;
    const conversionProposal = rdvCompleted > 0 ? (prospectsInNegotiation / rdvCompleted) * 100 : 0;
    const conversionClosing = prospectsInNegotiation > 0 ? (wonDeals / prospectsInNegotiation) * 100 : 0;

    // Jours actifs
    const activeDates = new Set(activities.map(a => a.created_at.split('T')[0]));
    const activeDays = activeDates.size;

    return {
      rdv_scheduled_count: rdvScheduled,
      rdv_completed_count: rdvCompleted,
      rdv_no_show_count: rdvNoShow,
      prospects_in_negotiation: prospectsInNegotiation,
      total_deal_value: totalDealValue,
      weighted_forecast: weightedForecast,
      conversion_rate_first_rdv: conversionFirstRdv,
      conversion_rate_proposal: conversionProposal,
      conversion_rate_closing: conversionClosing,
      conversion_rate_overall: conversionRdvToDeals,
      conversion_calls_to_rdv: conversionCallsToRdv,
      conversion_calls_to_deals: callsActivity > 0 ? (wonDeals / callsActivity) * 100 : 0,
      calls_made_total: callsActivity,
      calls_made: callsActivity,
      emails_sent: emailsActivity,
      meetings_held: meetingsActivity,
      tasks_completed: 0,
      average_response_time: 0, // Simplifiée pour l'instant
      active_days: activeDays,
      created_prospects: totalProspects,
      qualified_prospects: prospects.filter(p => p.qualification !== 'non_qualifie').length,
      won_deals: wonDeals,
      lost_deals: lostDeals
    };
  }

  private async calculateGrowthMetrics(
    advisorId: string,
    currentMetrics: { rdv_scheduled_count: number; total_deal_value: number },
    previousPeriod: PeriodDates
  ): Promise<{ rdv_growth: number; conversion_growth: number; revenue_growth: number }> {
    // Calculs simplifiés pour les métriques de croissance
    const [prevMeetings, prevDeals] = await Promise.all([
      this.getAdvisorMeetings(advisorId, previousPeriod),
      this.getAdvisorDeals(advisorId, previousPeriod) // ✅ Utiliser les deals réels
    ]);

    const prevRdvCount = prevMeetings.length;
    const prevRevenue = prevDeals.reduce((sum, deal) => sum + (deal.company_revenue || 0), 0);

    const rdvGrowth = prevRdvCount > 0
      ? ((currentMetrics.rdv_scheduled_count - prevRdvCount) / prevRdvCount) * 100
      : 0;
    const revenueGrowth = prevRevenue > 0
      ? ((currentMetrics.total_deal_value - prevRevenue) / prevRevenue) * 100
      : 0;

    return {
      rdv_growth: rdvGrowth,
      conversion_growth: 0, // Simplifié
      revenue_growth: revenueGrowth
    };
  }

  private async calculateDashboardStats(
    advisors: UserData[],
    advisorStats: AdvisorStats[],
    current: PeriodDates,
    previous?: PeriodDates
  ): Promise<AdminDashboardStats> {
    const totalAdvisors = advisors.length;
    const activeAdvisors = advisors.filter(a => a.is_active).length;
    const totalProspects = advisorStats.reduce((sum, a) => sum + a.created_prospects, 0);
    const totalRevenue = advisorStats.reduce((sum, a) => sum + a.total_deal_value, 0);

    const averageConversionRate = totalAdvisors > 0
      ? advisorStats.reduce((sum, a) => sum + a.conversion_rate_overall, 0) / totalAdvisors
      : 0;

    const alerts = this.generateAlerts(advisorStats);

    return {
      total_advisors: totalAdvisors,
      active_advisors: activeAdvisors,
      total_prospects: totalProspects,
      total_revenue: totalRevenue,
      average_conversion_rate: averageConversionRate,
      total_rdv_scheduled: advisorStats.reduce((sum, a) => sum + a.rdv_scheduled_count, 0),
      total_rdv_completed: advisorStats.reduce((sum, a) => sum + a.rdv_completed_count, 0),
      total_deals_won: advisorStats.reduce((sum, a) => sum + a.won_deals, 0),
      total_deals_lost: advisorStats.reduce((sum, a) => sum + a.lost_deals, 0),
      prospects_by_advisor: advisorStats.map(a => ({
        advisor_id: a.id,
        advisor_name: a.full_name,
        count: a.created_prospects,
        percentage: totalProspects > 0 ? (a.created_prospects / totalProspects) * 100 : 0
      })),
      revenue_by_advisor: advisorStats.map(a => ({
        advisor_id: a.id,
        advisor_name: a.full_name,
        revenue: a.total_deal_value,
        percentage: totalRevenue > 0 ? (a.total_deal_value / totalRevenue) * 100 : 0
      })),
      period_comparison: {
        rdv_growth: totalAdvisors > 0
          ? advisorStats.reduce((sum, a) => sum + a.rdv_growth, 0) / totalAdvisors
          : 0,
        conversion_growth: 0,
        revenue_growth: totalAdvisors > 0
          ? advisorStats.reduce((sum, a) => sum + a.revenue_growth, 0) / totalAdvisors
          : 0,
        prospects_growth: 0
      },
      top_performers: this.getTopPerformers(advisorStats),
      alerts: alerts.slice(0, 10)
    };
  }

  private generateAlerts(advisorStats: AdvisorStats[]): AdminDashboardStats['alerts'] {
    const alerts: AdminDashboardStats['alerts'] = [];

    advisorStats.forEach(advisor => {
      // Conversion faible
      if (advisor.conversion_rate_overall < 10 && advisor.created_prospects > 5) {
        alerts.push({
          type: 'low_conversion',
          advisor_id: advisor.id,
          advisor_name: advisor.full_name,
          message: `${advisor.full_name} a un taux de conversion de ${advisor.conversion_rate_overall.toFixed(1)}%`,
          severity: advisor.conversion_rate_overall < 5 ? 'high' : 'medium'
        });
      }

      // Conseiller inactif
      if (advisor.active_days < 5) {
        alerts.push({
          type: 'inactive_advisor',
          advisor_id: advisor.id,
          advisor_name: advisor.full_name,
          message: `${advisor.full_name} n'a été actif que ${advisor.active_days} jours`,
          severity: advisor.active_days < 2 ? 'high' : 'medium'
        });
      }

      // RDV ratés
      const noShowRate = advisor.rdv_scheduled_count > 0
        ? (advisor.rdv_no_show_count / advisor.rdv_scheduled_count) * 100
        : 0;
      if (noShowRate > 30 && advisor.rdv_scheduled_count > 3) {
        alerts.push({
          type: 'missed_rdv',
          advisor_id: advisor.id,
          advisor_name: advisor.full_name,
          message: `${advisor.full_name} a ${noShowRate.toFixed(1)}% de RDV ratés`,
          severity: noShowRate > 50 ? 'high' : 'medium'
        });
      }
    });

    return alerts;
  }

  private getTopPerformers(advisorStats: AdvisorStats[]): AdminDashboardStats['top_performers'] {
    if (advisorStats.length === 0) {
      const emptyAdvisor = {
        id: '',
        full_name: 'Aucun',
        email: '',
        avatar_url: undefined,
        rdv_scheduled_count: 0,
        rdv_completed_count: 0,
        rdv_no_show_count: 0,
        prospects_in_negotiation: 0,
        total_deal_value: 0,
        weighted_forecast: 0,
        conversion_rate_first_rdv: 0,
        conversion_rate_proposal: 0,
        conversion_rate_closing: 0,
        conversion_rate_overall: 0,
        conversion_calls_to_rdv: 0,
        conversion_calls_to_deals: 0,
        calls_made_total: 0,
        calls_made: 0,
        emails_sent: 0,
        meetings_held: 0,
        tasks_completed: 0,
        average_response_time: 0,
        active_days: 0,
        created_prospects: 0,
        qualified_prospects: 0,
        won_deals: 0,
        lost_deals: 0,
        rdv_growth: 0,
        conversion_growth: 0,
        revenue_growth: 0
      };

      return {
        by_rdv: emptyAdvisor,
        by_conversion: emptyAdvisor,
        by_revenue: emptyAdvisor
      };
    }

    return {
      by_rdv: advisorStats.reduce((prev, current) =>
        current.rdv_scheduled_count > prev.rdv_scheduled_count ? current : prev
      ),
      by_conversion: advisorStats.reduce((prev, current) =>
        current.conversion_rate_overall > prev.conversion_rate_overall ? current : prev
      ),
      by_revenue: advisorStats.reduce((prev, current) =>
        current.total_deal_value > prev.total_deal_value ? current : prev
      )
    };
  }

  private getPreviousPeriod(
    period: string,
    startDate?: string,
    endDate?: string
  ): { current: PeriodDates; previous: PeriodDates } {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (period === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      const daysMap = { '7d': 7, '30d': 30, '90d': 90, '6m': 180, '1y': 365 } as const;
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
}