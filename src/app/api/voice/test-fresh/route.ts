// ========================================
// API TEST FRESH - NOUVEAU ENDPOINT SANS CACHE
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

    console.log('🆕 Test FRESH exécution appel V2:', call_id);

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

    // Test création assistant VAPI
    try {
      const vapiService = VapiService.createFromConfig(voiceConfig);

      console.log('🤖 Tentative création assistant VAPI...');
      const assistant = await vapiService.createAssistant(voiceConfig, { name: 'Test Fresh Ultron' });

      console.log('✅ Assistant VAPI créé:', {
        id: assistant.id,
        name: assistant.name
      });

      // Test création appel VAPI avec NOUVEAU FORMAT
      console.log('📱 Tentative création appel VAPI FRESH...');

      const callRequest = {
        phoneNumber: prospect.phone, // ✅ FORMAT SIMPLIFIÉ DIRECT
        assistantId: assistant.id,
        metadata: {
          prospect_id: prospect.id,
          prospect_name: `${prospect.first_name} ${prospect.last_name}`.trim(),
          call_id: call.id,
          organization_id: call.organization_id,
          test_fresh: true,
          timestamp: new Date().toISOString()
        }
      };

      console.log('📋 Payload FRESH:', JSON.stringify(callRequest, null, 2));

      const vapiCall = await vapiService.createCall(callRequest);

      console.log('✅ Appel VAPI FRESH créé:', {
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
            test_fresh: true,
            executed_at: new Date().toISOString()
          }
        })
        .eq('id', call_id);

      return NextResponse.json({
        success: true,
        message: 'Appel VAPI FRESH créé avec succès',
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
      console.error('❌ Erreur VAPI FRESH:', vapiError);

      return NextResponse.json({
        error: 'Erreur VAPI FRESH',
        details: vapiError instanceof Error ? vapiError.message : 'Erreur inconnue',
        call_id,
        call_status: 'failed',
        test: 'fresh'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Erreur test fresh:', error);
    return NextResponse.json({
      error: 'Erreur serveur fresh',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}