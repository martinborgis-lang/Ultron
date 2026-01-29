// ========================================
// API TEST FORMAT - NOUVEAU ENDPOINT POUR TESTER VAPI
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

const supabase = createAdminClient();

export async function POST(request: NextRequest) {
  try {
    const { call_id, format_type } = await request.json();

    if (!call_id) {
      return NextResponse.json({ error: 'call_id requis' }, { status: 400 });
    }

    console.log('🎯 Test nouveau format VAPI pour appel:', call_id, 'format:', format_type);

    // Récupérer les détails de l'appel
    const { data: call, error: callError } = await supabase
      .from('phone_calls')
      .select('*')
      .eq('id', call_id)
      .single();

    if (callError || !call) {
      return NextResponse.json({
        error: 'Appel introuvable',
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
      return NextResponse.json({
        error: 'Prospect introuvable',
        details: prospectError?.message
      }, { status: 404 });
    }

    // Récupérer la config voice
    const { data: voiceConfig, error: configError } = await supabase
      .from('voice_config')
      .select('*')
      .eq('organization_id', call.organization_id)
      .eq('is_enabled', true)
      .single();

    if (configError || !voiceConfig) {
      return NextResponse.json({
        error: 'Configuration voice introuvable',
        details: configError?.message
      }, { status: 400 });
    }

    // Test différents formats selon type demandé
    let phoneNumber;

    switch (format_type) {
      case 'object_number':
        phoneNumber = { number: prospect.phone };
        break;
      case 'twilio':
        phoneNumber = {
          twilioPhoneNumber: prospect.phone,
          twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || 'test_sid'
        };
        break;
      case 'string':
      default:
        phoneNumber = prospect.phone;
        break;
    }

    console.log('📞 Test format VAPI:', format_type, 'phoneNumber:', phoneNumber);

    const vapiPayload = {
      phoneNumber,
      assistant: {
        name: "Assistant Test Format",
        voice: {
          provider: "openai",
          voiceId: "nova"
        },
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: "Tu es un assistant commercial test pour vérifier le format."
            }
          ]
        },
        language: "fr"
      },
      metadata: {
        test_format: true,
        format_type,
        prospect_id: prospect.id,
        call_id: call_id
      }
    };

    console.log('📋 Payload VAPI test format:', JSON.stringify(vapiPayload, null, 2));

    // Appel direct à VAPI
    const vapiResponse = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(vapiPayload)
    });

    const vapiResult = await vapiResponse.text();

    console.log('📢 Réponse VAPI test format:', {
      status: vapiResponse.status,
      statusText: vapiResponse.statusText,
      body: vapiResult
    });

    if (!vapiResponse.ok) {
      return NextResponse.json({
        error: 'Erreur VAPI test format',
        status: vapiResponse.status,
        details: vapiResult,
        format_tested: format_type,
        payload_sent: vapiPayload
      }, { status: 500 });
    }

    const vapiData = JSON.parse(vapiResult);

    // Succès !
    return NextResponse.json({
      success: true,
      message: 'Test format VAPI réussi',
      format_tested: format_type,
      vapi_response: vapiData,
      payload_sent: vapiPayload
    });

  } catch (error) {
    console.error('❌ Erreur test format:', error);
    return NextResponse.json({
      error: 'Erreur serveur test format',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}