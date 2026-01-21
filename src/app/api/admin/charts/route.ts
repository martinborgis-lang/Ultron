import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { createAdminClient } from '@/lib/supabase-admin';
import type { AdvisorPerformanceChart, ConversionFunnelData, ActivityHeatmapData } from '@/types/crm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (context.user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé - Admin requis' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const chartType = searchParams.get('type');
    const period = searchParams.get('period') || '30d';
    const advisorId = searchParams.get('advisor_id');

    const adminClient = createAdminClient();

    // Calculer les dates
    const now = new Date();
    const daysMap = { '7d': 7, '30d': 30, '90d': 90, '6m': 180, '1y': 365 };
    const days = daysMap[period as keyof typeof daysMap] || 30;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    if (chartType === 'performance') {
      // Graphique de performance des conseillers dans le temps
      let advisorsQuery = adminClient
        .from('users')
        .select('id, full_name, email')
        .eq('organization_id', context.organization.id)
        .eq('role', 'conseiller');

      if (advisorId) {
        advisorsQuery = advisorsQuery.eq('id', advisorId);
      }

      const { data: advisors } = await advisorsQuery;

      const performanceCharts: AdvisorPerformanceChart[] = [];

      for (const advisor of advisors || []) {
        // Calculer des données réelles journalières depuis la BDD
        const data = [];
        for (let i = 0; i < days; i++) {
          const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
          const dateStr = date.toISOString().split('T')[0];
          const nextDayStr = new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          // RDV programmés ce jour
          const { data: rdvData } = await adminClient
            .from('crm_events')
            .select('id')
            .eq('organization_id', context.organization.id)
            .eq('assigned_to', advisor.id)
            .eq('type', 'meeting')
            .gte('start_date', `${dateStr}T00:00:00`)
            .lt('start_date', `${nextDayStr}T00:00:00`) as any;

          // Prospects créés ce jour qui sont maintenant gagnés
          const { data: prospectsData } = await adminClient
            .from('crm_prospects')
            .select('deal_value, stage_slug, created_at')
            .eq('organization_id', context.organization.id)
            .eq('assigned_to', advisor.id)
            .gte('created_at', `${dateStr}T00:00:00`)
            .lt('created_at', `${nextDayStr}T00:00:00`) as any;

          // Prospects gagnés ce jour (won_date) avec leur valeur
          const { data: wonProspects } = await adminClient
            .from('crm_prospects')
            .select(`
              deal_value, won_date,
              stage:pipeline_stages(is_won)
            `)
            .eq('organization_id', context.organization.id)
            .eq('assigned_to', advisor.id)
            .gte('won_date', `${dateStr}T00:00:00`)
            .lt('won_date', `${nextDayStr}T00:00:00`) as any;

          const rdvCount = rdvData?.length || 0;
          const dealsClosedToday = wonProspects?.filter((p: any) => p.stage?.is_won).length || 0;
          const revenueToday = wonProspects
            ?.filter((p: any) => p.stage?.is_won)
            .reduce((sum: number, p: any) => sum + (p.deal_value || 0), 0) || 0;

          // Calculer le taux de conversion du jour (RDV → deals)
          const conversionRate = rdvCount > 0 ? (dealsClosedToday / rdvCount) * 100 : 0;

          data.push({
            date: dateStr,
            rdv_count: rdvCount,
            deals_closed: dealsClosedToday,
            conversion_rate: conversionRate,
            revenue: revenueToday
          });
        }

        performanceCharts.push({
          advisor_id: advisor.id,
          advisor_name: advisor.full_name || advisor.email,
          data
        });
      }

      return NextResponse.json({ performance_charts: performanceCharts });
    }

    if (chartType === 'funnel') {
      // Entonnoir de conversion par conseiller
      let advisorsQuery = adminClient
        .from('users')
        .select('id, full_name, email')
        .eq('organization_id', context.organization.id)
        .eq('role', 'conseiller');

      if (advisorId) {
        advisorsQuery = advisorsQuery.eq('id', advisorId);
      }

      const { data: advisors } = await advisorsQuery;

      const funnelData: ConversionFunnelData[] = [];

      for (const advisor of advisors || []) {
        // Récupérer les prospects du conseiller
        const { data: prospects } = await adminClient
          .from('crm_prospects')
          .select('stage_slug, qualification, created_at, won_date, lost_date')
          .eq('organization_id', context.organization.id)
          .eq('assigned_to', advisor.id)
          .gte('created_at', startDate.toISOString());

        const totalContacts = prospects?.length || 0;
        const firstRdv = prospects?.filter(p =>
          ['rdv_pris', 'rdv_effectue', 'negociation', 'gagne'].includes(p.stage_slug)
        ).length || 0;
        const proposals = prospects?.filter(p =>
          ['negociation', 'gagne'].includes(p.stage_slug)
        ).length || 0;
        const negotiations = prospects?.filter(p =>
          p.stage_slug === 'negociation'
        ).length || 0;
        const closedWon = prospects?.filter(p =>
          p.stage_slug === 'gagne'
        ).length || 0;

        const stages = [
          {
            stage: 'contact' as const,
            stage_name: 'Contact initial',
            count: totalContacts,
            conversion_rate: 100
          },
          {
            stage: 'first_rdv' as const,
            stage_name: 'Premier RDV',
            count: firstRdv,
            conversion_rate: totalContacts > 0 ? (firstRdv / totalContacts) * 100 : 0
          },
          {
            stage: 'proposal' as const,
            stage_name: 'Proposition',
            count: proposals,
            conversion_rate: firstRdv > 0 ? (proposals / firstRdv) * 100 : 0
          },
          {
            stage: 'negotiation' as const,
            stage_name: 'Négociation',
            count: negotiations + closedWon,
            conversion_rate: proposals > 0 ? ((negotiations + closedWon) / proposals) * 100 : 0
          },
          {
            stage: 'closed_won' as const,
            stage_name: 'Deal signé',
            count: closedWon,
            conversion_rate: (negotiations + closedWon) > 0 ? (closedWon / (negotiations + closedWon)) * 100 : 0
          }
        ];

        funnelData.push({
          advisor_id: advisor.id,
          advisor_name: advisor.full_name || advisor.email,
          stages
        });
      }

      return NextResponse.json({ funnel_data: funnelData });
    }

    if (chartType === 'activity') {
      // Heatmap d'activité
      let advisorsQuery = adminClient
        .from('users')
        .select('id, full_name, email')
        .eq('organization_id', context.organization.id)
        .eq('role', 'conseiller');

      if (advisorId) {
        advisorsQuery = advisorsQuery.eq('id', advisorId);
      }

      const { data: advisors } = await advisorsQuery;

      const activityData: ActivityHeatmapData[] = [];

      for (const advisor of advisors || []) {
        // Récupérer les activités du conseiller
        const { data: activities } = await adminClient
          .from('crm_activities')
          .select('type, created_at')
          .eq('organization_id', context.organization.id)
          .eq('user_id', advisor.id)
          .gte('created_at', startDate.toISOString());

        // Grouper par jour
        const dailyActivity = [];
        for (let i = 0; i < days; i++) {
          const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
          const dateStr = date.toISOString().split('T')[0];

          const dayActivities = activities?.filter(a =>
            a.created_at.split('T')[0] === dateStr
          ) || [];

          const calls = dayActivities.filter(a => a.type === 'call').length;
          const emails = dayActivities.filter(a => a.type === 'email').length;
          const meetings = dayActivities.filter(a => a.type === 'meeting').length;

          // Score d'activité : calls * 2 + emails * 1 + meetings * 3
          const totalScore = calls * 2 + emails * 1 + meetings * 3;

          dailyActivity.push({
            date: dateStr,
            calls,
            emails,
            meetings,
            total_score: totalScore
          });
        }

        activityData.push({
          advisor_id: advisor.id,
          advisor_name: advisor.full_name || advisor.email,
          daily_activity: dailyActivity
        });
      }

      return NextResponse.json({ activity_data: activityData });
    }

    return NextResponse.json({ error: 'Type de graphique non supporté' }, { status: 400 });

  } catch (error) {
    console.error('Erreur API admin charts:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}