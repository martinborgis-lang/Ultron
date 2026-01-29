import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';

export async function GET(request: NextRequest) {
  try {
    const result = await getCurrentUserAndOrganization();
    if (!result) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const { user, organization } = result;

    const supabase = await createClient();

    // Statistiques des appels
    const { data: callStats, error: callError } = await supabase
      .from('phone_calls')
      .select('status, duration_seconds, qualification_result, created_at, outcome, cost_cents')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (callError) {
      console.error('Erreur récupération stats appels:', callError);
      return NextResponse.json({
        data: {
          today: {
            calls_made: 0,
            appointments_booked: 0,
            qualification_rate: 0,
            answer_rate: 0,
            cost_total: 0
          },
          this_week: {
            calls_made: 0,
            appointments_booked: 0,
            qualified_prospects: 0,
            average_call_duration: 0,
            conversion_rate: 0
          },
          this_month: {
            calls_made: 0,
            appointments_booked: 0,
            total_cost: 0,
            roi_percentage: 0
          }
        }
      });
    }

    const totalCalls = callStats?.length || 0;
    const successfulCalls = callStats?.filter(call => call.status === 'completed').length || 0;
    const avgDuration = callStats?.length
      ? Math.round(callStats.reduce((sum, call) => sum + (call.duration_seconds || 0), 0) / callStats.length)
      : 0;
    const qualifiedCalls = callStats?.filter(call => call.qualification_result === 'qualified').length || 0;
    const qualificationRate = totalCalls > 0 ? Math.round((qualifiedCalls / totalCalls) * 100) : 0;

    // Calculer les stats par période
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    const monthStart = new Date(now);
    monthStart.setMonth(monthStart.getMonth() - 1);

    // Filtrer par période
    const todayCalls = callStats?.filter(call => new Date(call.created_at) >= todayStart) || [];
    const weekCalls = callStats?.filter(call => new Date(call.created_at) >= weekStart) || [];
    const monthCalls = callStats || [];

    // Stats aujourd'hui
    const todayStats = {
      calls_made: todayCalls.length,
      appointments_booked: todayCalls.filter(call => call.outcome === 'appointment_booked').length,
      qualification_rate: todayCalls.length > 0 ? Math.round((todayCalls.filter(call => call.qualification_result === 'qualified').length / todayCalls.length) * 100) : 0,
      answer_rate: todayCalls.length > 0 ? Math.round((todayCalls.filter(call => call.status === 'completed').length / todayCalls.length) * 100) : 0,
      cost_total: todayCalls.reduce((sum, call) => sum + (call.cost_cents || 0), 0)
    };

    // Stats semaine
    const weekStats = {
      calls_made: weekCalls.length,
      appointments_booked: weekCalls.filter(call => call.outcome === 'appointment_booked').length,
      qualified_prospects: weekCalls.filter(call => call.qualification_result === 'qualified').length,
      average_call_duration: weekCalls.length > 0 ? Math.round(weekCalls.reduce((sum, call) => sum + (call.duration_seconds || 0), 0) / weekCalls.length / 60) : 0,
      conversion_rate: weekCalls.length > 0 ? Math.round((weekCalls.filter(call => call.outcome === 'appointment_booked').length / weekCalls.length) * 100) : 0
    };

    // Stats mois
    const monthStats = {
      calls_made: monthCalls.length,
      appointments_booked: monthCalls.filter(call => call.outcome === 'appointment_booked').length,
      total_cost: monthCalls.reduce((sum, call) => sum + (call.cost_cents || 0), 0),
      roi_percentage: 120, // ROI fixe pour demo
      top_performing_script: 'Qualification Standard'
    };

    return NextResponse.json({
      data: {
        today: todayStats,
        this_week: weekStats,
        this_month: monthStats
      }
    });

  } catch (error) {
    console.error('Erreur API stats AI agent:', error);
    return NextResponse.json({
      error: 'Erreur serveur',
      data: {
        today: {
          calls_made: 0,
          appointments_booked: 0,
          qualification_rate: 0,
          answer_rate: 0,
          cost_total: 0
        },
        this_week: {
          calls_made: 0,
          appointments_booked: 0,
          qualified_prospects: 0,
          average_call_duration: 0,
          conversion_rate: 0
        },
        this_month: {
          calls_made: 0,
          appointments_booked: 0,
          total_cost: 0,
          roi_percentage: 0
        }
      }
    }, { status: 500 });
  }
}