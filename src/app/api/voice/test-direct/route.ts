// ========================================
// API TEST DIRECT - APPEL DIRECT À VAPI
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

const supabase = createAdminClient();

export async function POST(request: NextRequest) {
  try {
    const { call_id } = await request.json();

    if (!call_id) {
      return NextResponse.json({ error: 'call_id requis' }, { status: 400 });
    }

    console.log('🎯 Test DIRECT VAPI pour appel:', call_id);

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

    // Appel DIRECT à VAPI sans passer par notre service
    console.log('📞 Appel DIRECT à VAPI...');

    const vapiPayload = {
      // Format objet requis par VAPI
      phoneNumber: { number: prospect.phone }, // ✅ VAPI exige un objet
      assistant: {
        name: "Assistant Test Direct",
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
              content: "Tu es un assistant commercial test."
            }
          ]
        },
        language: "fr"
      },
      metadata: {
        test_direct: true,
        prospect_id: prospect.id,
        call_id: call_id
      }
    };

    console.log('📋 Payload VAPI direct:', JSON.stringify(vapiPayload, null, 2));

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

    console.log('📢 Réponse VAPI directe:', {
      status: vapiResponse.status,
      statusText: vapiResponse.statusText,
      body: vapiResult
    });

    if (!vapiResponse.ok) {
      return NextResponse.json({
        error: 'Erreur VAPI directe',
        status: vapiResponse.status,
        details: vapiResult,
        payload_sent: vapiPayload
      }, { status: 500 });
    }

    const vapiData = JSON.parse(vapiResult);

    // Succès !
    return NextResponse.json({
      success: true,
      message: 'Appel VAPI direct réussi',
      vapi_response: vapiData,
      payload_sent: vapiPayload
    });

  } catch (error) {
    console.error('❌ Erreur test direct:', error);
    return NextResponse.json({
      error: 'Erreur serveur direct',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}