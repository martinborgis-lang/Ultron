// ========================================
// API DEBUG APPEL VAPI - ENDPOINT PUBLIC
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

const supabase = createAdminClient();

// Endpoint public pour le debug (sans authentification)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const callId = url.searchParams.get('call_id');

    if (callId) {
      // Debug d'un appel spécifique
      const { data: call, error: callError } = await supabase
        .from('phone_calls')
        .select(`
          id,
          organization_id,
          prospect_id,
          to_number,
          status,
          scheduled_at,
          started_at,
          ended_at,
          vapi_call_id,
          vapi_assistant_id,
          error_message,
          metadata,
          created_at
        `)
        .eq('id', callId)
        .single();

      if (callError || !call) {
        return NextResponse.json({
          error: 'Appel introuvable',
          call_id: callId,
          details: callError?.message
        }, { status: 404 });
      }

      // Récupérer le prospect associé
      const { data: prospect } = await supabase
        .from('crm_prospects')
        .select('id, first_name, last_name, phone, email')
        .eq('id', call.prospect_id)
        .single();

      // Récupérer la config voice
      const { data: voiceConfig } = await supabase
        .from('voice_config')
        .select('id, agent_name, is_enabled, working_hours_start, working_hours_end, working_days, call_delay_minutes')
        .eq('organization_id', call.organization_id)
        .eq('is_enabled', true)
        .single();

      return NextResponse.json({
        success: true,
        call: {
          id: call.id,
          status: call.status,
          to_number: call.to_number,
          scheduled_at: call.scheduled_at,
          started_at: call.started_at,
          ended_at: call.ended_at,
          vapi_call_id: call.vapi_call_id,
          vapi_assistant_id: call.vapi_assistant_id,
          error_message: call.error_message,
          metadata: call.metadata,
          created_at: call.created_at,
          // Calculer le temps écoulé
          time_since_scheduled: call.scheduled_at ?
            Math.floor((new Date().getTime() - new Date(call.scheduled_at).getTime()) / 1000) : null
        },
        prospect: prospect ? {
          id: prospect.id,
          name: `${prospect.first_name} ${prospect.last_name}`.trim(),
          phone: prospect.phone,
          email: prospect.email
        } : null,
        voiceConfig: voiceConfig ? {
          id: voiceConfig.id,
          agent_name: voiceConfig.agent_name,
          is_enabled: voiceConfig.is_enabled,
          working_hours: `${voiceConfig.working_hours_start}-${voiceConfig.working_hours_end}`,
          working_days: voiceConfig.working_days,
          call_delay_minutes: voiceConfig.call_delay_minutes
        } : null,
        diagnosis: {
          should_have_executed: call.scheduled_at ? new Date() > new Date(call.scheduled_at) : false,
          time_overdue_seconds: call.scheduled_at ?
            Math.max(0, Math.floor((new Date().getTime() - new Date(call.scheduled_at).getTime()) / 1000)) : 0,
          likely_issue: call.status === 'queued' && call.scheduled_at && new Date() > new Date(call.scheduled_at) ?
            'QStash n\'a pas exécuté le webhook ou l\'endpoint execute-call a échoué' :
            'Appel pas encore programmé pour exécution'
        }
      });
    }

    // Debug général - derniers appels de toutes les organisations
    const { data: recentCalls, error: callsError } = await supabase
      .from('phone_calls')
      .select(`
        id,
        organization_id,
        to_number,
        status,
        scheduled_at,
        started_at,
        vapi_call_id,
        error_message,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (callsError) {
      return NextResponse.json({
        error: 'Erreur récupération appels',
        details: callsError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      recent_calls: recentCalls?.map(call => ({
        id: call.id,
        organization_id: call.organization_id,
        to_number: call.to_number,
        status: call.status,
        scheduled_at: call.scheduled_at,
        started_at: call.started_at,
        vapi_call_id: call.vapi_call_id,
        error_message: call.error_message,
        created_at: call.created_at,
        should_have_executed: call.scheduled_at ? new Date() > new Date(call.scheduled_at) : false,
        time_overdue_seconds: call.scheduled_at ?
          Math.max(0, Math.floor((new Date().getTime() - new Date(call.scheduled_at).getTime()) / 1000)) : 0
      })) || []
    });

  } catch (error) {
    console.error('❌ Erreur debug:', error);
    return NextResponse.json({
      error: 'Erreur serveur debug',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

// Endpoint pour exécuter manuellement un appel (sans auth pour debug)
export async function POST(request: NextRequest) {
  try {
    const { call_id, force_execute } = await request.json();

    if (!call_id) {
      return NextResponse.json({ error: 'call_id requis' }, { status: 400 });
    }

    console.log('🔧 Debug: Tentative exécution manuelle appel:', call_id);

    // Simuler l'appel au endpoint execute-call
    const executeUrl = `${process.env.NEXTAUTH_URL || 'https://ultron-murex.vercel.app'}/api/voice/ai-agent/execute-call`;

    const payload = {
      call_id,
      prospect_id: null, // Sera récupéré par l'endpoint
      organization_id: null // Sera récupéré par l'endpoint
    };

    try {
      const response = await fetch(executeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.text();

      return NextResponse.json({
        success: true,
        message: 'Tentative exécution manuelle effectuée',
        execute_response: {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        }
      });

    } catch (executeError) {
      return NextResponse.json({
        error: 'Erreur lors de l\'exécution manuelle',
        details: executeError instanceof Error ? executeError.message : 'Erreur inconnue',
        execute_url: executeUrl,
        payload
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Erreur exécution debug:', error);
    return NextResponse.json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}