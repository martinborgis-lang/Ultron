// ========================================
// API TEST APPEL VAPI - DIAGNOSTIC
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import VapiService from '@/lib/services/vapi-service';

export async function POST(request: NextRequest) {
  try {
    const result = await getCurrentUserAndOrganization();
    if (!result) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const { user, organization } = result;

    const supabase = await createClient();

    // Récupérer la configuration voice
    const { data: voiceConfig, error: configError } = await supabase
      .from('voice_config')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('is_enabled', true)
      .single();

    if (configError || !voiceConfig) {
      return NextResponse.json({
        error: 'Configuration voice non trouvée',
        details: configError?.message
      }, { status: 400 });
    }

    console.log('🧪 Configuration voice trouvée:', {
      id: voiceConfig.id,
      agent_name: voiceConfig.agent_name,
      vapi_assistant_id: voiceConfig.vapi_assistant_id,
      working_hours: `${voiceConfig.working_hours_start}-${voiceConfig.working_hours_end}`,
      delay_minutes: voiceConfig.call_delay_minutes
    });

    // Test création assistant VAPI
    const vapiService = VapiService.createFromConfig(voiceConfig);

    try {
      const assistant = await vapiService.createAssistant(voiceConfig, { name: organization.name });
      console.log('✅ Assistant VAPI créé:', {
        id: assistant.id,
        name: assistant.name,
        language: assistant.language
      });

      return NextResponse.json({
        success: true,
        message: 'Test réussi - Assistant VAPI créé',
        assistant: {
          id: assistant.id,
          name: assistant.name,
          language: assistant.language
        },
        voiceConfig: {
          agent_name: voiceConfig.agent_name,
          working_hours: `${voiceConfig.working_hours_start}-${voiceConfig.working_hours_end}`,
          delay_minutes: voiceConfig.call_delay_minutes
        }
      });

    } catch (vapiError) {
      console.error('❌ Erreur test VAPI:', vapiError);
      return NextResponse.json({
        error: 'Erreur test VAPI',
        details: vapiError instanceof Error ? vapiError.message : 'Erreur inconnue',
        voiceConfig: {
          agent_name: voiceConfig.agent_name,
          working_hours: `${voiceConfig.working_hours_start}-${voiceConfig.working_hours_end}`,
          delay_minutes: voiceConfig.call_delay_minutes
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Erreur test général:', error);
    return NextResponse.json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const result = await getCurrentUserAndOrganization();
    if (!result) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const { user, organization } = result;

    const supabase = await createClient();

    // Récupérer les 5 derniers appels
    const { data: recentCalls, error: callsError } = await supabase
      .from('phone_calls')
      .select('id, prospect_id, to_number, status, scheduled_at, started_at, ended_at, vapi_call_id, error_message, created_at')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (callsError) {
      return NextResponse.json({
        error: 'Erreur récupération appels',
        details: callsError.message
      }, { status: 500 });
    }

    // Récupérer la configuration voice
    const { data: voiceConfig } = await supabase
      .from('voice_config')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('is_enabled', true)
      .single();

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name
      },
      voiceConfig: voiceConfig ? {
        id: voiceConfig.id,
        agent_name: voiceConfig.agent_name,
        is_enabled: voiceConfig.is_enabled,
        working_hours: `${voiceConfig.working_hours_start}-${voiceConfig.working_hours_end}`,
        working_days: voiceConfig.working_days,
        call_delay_minutes: voiceConfig.call_delay_minutes,
        max_call_duration_seconds: voiceConfig.max_call_duration_seconds
      } : null,
      recentCalls: recentCalls?.map(call => ({
        id: call.id,
        to_number: call.to_number,
        status: call.status,
        scheduled_at: call.scheduled_at,
        started_at: call.started_at,
        ended_at: call.ended_at,
        vapi_call_id: call.vapi_call_id,
        error_message: call.error_message,
        created_at: call.created_at
      })) || []
    });

  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
    return NextResponse.json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}