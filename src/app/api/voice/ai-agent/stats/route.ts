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
      .select('status, duration_seconds, qualification_result, created_at')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (callError) {
      console.error('Erreur récupération stats appels:', callError);
      return NextResponse.json({
        totalCalls: 0,
        successfulCalls: 0,
        averageDuration: 0,
        qualificationRate: 0,
        recentCalls: []
      });
    }

    const totalCalls = callStats?.length || 0;
    const successfulCalls = callStats?.filter(call => call.status === 'completed').length || 0;
    const avgDuration = callStats?.length
      ? Math.round(callStats.reduce((sum, call) => sum + (call.duration_seconds || 0), 0) / callStats.length)
      : 0;
    const qualifiedCalls = callStats?.filter(call => call.qualification_result === 'qualified').length || 0;
    const qualificationRate = totalCalls > 0 ? Math.round((qualifiedCalls / totalCalls) * 100) : 0;

    return NextResponse.json({
      data: {
        totalCalls,
        successfulCalls,
        averageDuration: avgDuration,
        qualificationRate,
        successRate: totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0,
        recentCalls: callStats?.slice(0, 10) || []
      }
    });

  } catch (error) {
    console.error('Erreur API stats AI agent:', error);
    return NextResponse.json({
      error: 'Erreur serveur',
      data: {
        totalCalls: 0,
        successfulCalls: 0,
        averageDuration: 0,
        qualificationRate: 0,
        recentCalls: []
      }
    }, { status: 500 });
  }
}