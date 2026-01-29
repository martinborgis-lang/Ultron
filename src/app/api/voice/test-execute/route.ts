// ========================================
// API TEST EXÉCUTION APPEL - DIAGNOSTIC
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import VapiService from '@/lib/services/vapi-service';

const supabase = createAdminClient();

export async function POST(request: NextRequest) {
  try {
    const { call_id } = await request.json();

    if (!call_id) {
      return NextResponse.json({ error: 'call_id requis' }, { status: 400 });
    }

    console.log('🧪 Test exécution appel:', call_id);

    // Récupérer les détails de l'appel
    const { data: call, error: callError } = await supabase
      .from('phone_calls')
      .select('*')
      .eq('id', call_id)
      .single();

    if (callError || !call) {
      console.error('❌ Appel introuvable:', callError);
      return NextResponse.json({
        error: 'Appel introuvable',
        call_id,
        details: callError?.message
      }, { status: 404 });
    }

    console.log('📞 Appel trouvé:', {
      id: call.id,
      status: call.status,
      to_number: call.to_number,
      scheduled_at: call.scheduled_at,
      organization_id: call.organization_id
    });

    // Récupérer le prospect
    const { data: prospect, error: prospectError } = await supabase
      .from('crm_prospects')
      .select('*')
      .eq('id', call.prospect_id)
      .single();

    if (prospectError || !prospect) {
      console.error('❌ Prospect introuvable:', prospectError);
      return NextResponse.json({
        error: 'Prospect introuvable',
        prospect_id: call.prospect_id,
        details: prospectError?.message
      }, { status: 404 });
    }

    console.log('👤 Prospect trouvé:', {
      id: prospect.id,
      name: `${prospect.first_name} ${prospect.last_name}`,
      phone: prospect.phone
    });

    // Récupérer la configuration voice
    const { data: voiceConfig, error: configError } = await supabase
      .from('voice_config')
      .select('*')
      .eq('organization_id', call.organization_id)
      .eq('is_enabled', true)
      .single();

    if (configError || !voiceConfig) {
      console.error('❌ Configuration voice introuvable:', configError);
      return NextResponse.json({
        error: 'Configuration voice introuvable',
        organization_id: call.organization_id,
        details: configError?.message
      }, { status: 400 });
    }

    console.log('⚙️ Configuration voice trouvée:', {
      id: voiceConfig.id,
      agent_name: voiceConfig.agent_name,
      is_enabled: voiceConfig.is_enabled
    });

    // Test création assistant VAPI
    try {
      const vapiService = VapiService.createFromConfig(voiceConfig);

      console.log('🤖 Tentative création assistant VAPI...');
      const assistant = await vapiService.createAssistant(voiceConfig, { name: 'Test Ultron' });

      console.log('✅ Assistant VAPI créé:', {
        id: assistant.id,
        name: assistant.name
      });

      // Test création appel VAPI
      console.log('📱 Tentative création appel VAPI...');
      const vapiCall = await vapiService.createCall({
        phoneNumber: {
          twilioPhoneNumber: prospect.phone // ✅ Nouveau format VAPI
        },
        assistantId: assistant.id,
        metadata: {
          prospect_id: prospect.id,
          prospect_name: `${prospect.first_name} ${prospect.last_name}`.trim(),
          call_id: call.id,
          organization_id: call.organization_id,
          test_mode: true
        }
      });

      console.log('✅ Appel VAPI créé:', {
        id: vapiCall.id,
        status: vapiCall.status
      });

      // Mettre à jour l'appel en base
      await supabase
        .from('phone_calls')
        .update({
          vapi_call_id: vapiCall.id,
          vapi_assistant_id: assistant.id,
          status: 'ringing',
          started_at: new Date().toISOString(),
          metadata: {
            test_execution: true,
            executed_at: new Date().toISOString()
          }
        })
        .eq('id', call_id);

      return NextResponse.json({
        success: true,
        message: 'Appel VAPI créé avec succès',
        call: {
          id: call.id,
          status: 'ringing',
          vapi_call_id: vapiCall.id
        },
        assistant: {
          id: assistant.id,
          name: assistant.name
        },
        prospect: {
          id: prospect.id,
          name: `${prospect.first_name} ${prospect.last_name}`,
          phone: prospect.phone
        }
      });

    } catch (vapiError) {
      console.error('❌ Erreur VAPI:', vapiError);

      // Marquer l'appel comme échoué
      await supabase
        .from('phone_calls')
        .update({
          status: 'failed',
          error_message: vapiError instanceof Error ? vapiError.message : 'Erreur VAPI'
        })
        .eq('id', call_id);

      return NextResponse.json({
        error: 'Erreur VAPI',
        details: vapiError instanceof Error ? vapiError.message : 'Erreur inconnue',
        call_id,
        call_status: 'failed'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Erreur test exécution:', error);
    return NextResponse.json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}