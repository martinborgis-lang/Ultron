import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';

// Rediriger vers l'endpoint principal /api/voice/config
export async function GET(request: NextRequest) {
  try {
    const result = await getCurrentUserAndOrganization();
    if (!result) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const { user, organization } = result;

    const supabase = await createClient();

    // Récupérer ou créer la configuration voice
    let { data: config, error } = await supabase
      .from('voice_config')
      .select('*')
      .eq('organization_id', organization.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Configuration n'existe pas, en créer une par défaut
      const defaultConfig = {
        organization_id: organization.id,
        is_enabled: false,
        twilio_configured: !!process.env.TWILIO_ACCOUNT_SID,
        ai_agent_enabled: false,
        ai_agent_name: 'Assistant Ultron',
        ai_agent_voice: 'jennifer',
        ai_agent_language: 'fr-FR',
        ai_agent_prompt: 'Vous êtes {{agent_name}} du {{cabinet_name}}. Votre mission est de qualifier les prospects intéressés par nos services de gestion de patrimoine et de prendre des rendez-vous.',
        click_to_call_enabled: true,
        auto_recording: true,
        auto_transcription: true
      };

      const { data: newConfig, error: insertError } = await supabase
        .from('voice_config')
        .insert(defaultConfig)
        .select()
        .single();

      if (insertError) {
        console.error('Erreur création config voice:', insertError);
        return NextResponse.json({ error: 'Erreur création configuration' }, { status: 500 });
      }

      config = newConfig;
    } else if (error) {
      console.error('Erreur récupération config voice:', error);
      return NextResponse.json({ error: 'Erreur récupération configuration' }, { status: 500 });
    }

    return NextResponse.json({
      config,
      organization: {
        id: organization.id,
        name: organization.name
      },
      twilio_available: !!process.env.TWILIO_ACCOUNT_SID,
      deepgram_available: !!process.env.DEEPGRAM_API_KEY,
      vapi_configured: !!config?.vapi_api_key
    });

  } catch (error) {
    console.error('Erreur API voice ai-agent config:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await getCurrentUserAndOrganization();
    if (!result) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const { user, organization } = result;

    const body = await request.json();
    const supabase = await createClient();

    console.log('🔧 Mise à jour config AI Agent:', body);

    // Mettre à jour la configuration voice avec auto-détection organization_id
    const updateData: any = {
      organization_id: organization.id,
      updated_at: new Date().toISOString()
    };

    // Configuration générale (selon la vraie structure de la table)
    if (body.is_enabled !== undefined) updateData.is_enabled = body.is_enabled;
    if (body.click_to_call_enabled !== undefined) updateData.click_to_call_enabled = body.click_to_call_enabled;
    if (body.auto_recording !== undefined) updateData.auto_recording = body.auto_recording;
    if (body.auto_transcription !== undefined) updateData.auto_transcription = body.auto_transcription;

    // Configuration agent IA (mapper correctement selon la vraie structure DB)
    if (body.ai_agent_enabled !== undefined) updateData.ai_agent_enabled = body.ai_agent_enabled;

    // Mapping correct: les colonnes en DB sont préfixées "ai_"
    if (body.ai_agent_name) updateData.ai_agent_name = body.ai_agent_name.trim();
    if (body.ai_agent_voice) updateData.ai_agent_voice = body.ai_agent_voice;
    if (body.ai_agent_language) updateData.ai_agent_language = body.ai_agent_language;
    if (body.ai_agent_prompt) updateData.ai_agent_prompt = body.ai_agent_prompt.trim();

    // Mapping legacy: pour compatibilité avec les anciens champs frontend
    if (body.agent_name) updateData.ai_agent_name = body.agent_name.trim();
    if (body.agent_voice) updateData.ai_agent_voice = body.agent_voice;
    if (body.agent_language) updateData.ai_agent_language = body.agent_language;
    if (body.system_prompt) updateData.ai_agent_prompt = body.system_prompt.trim();

    // Configuration VAPI
    if (body.vapi_api_key !== undefined) updateData.vapi_api_key = body.vapi_api_key ? body.vapi_api_key.trim() : null;
    if (body.vapi_phone_number) updateData.vapi_phone_number = body.vapi_phone_number.trim();
    if (body.vapi_assistant_id) updateData.vapi_assistant_id = body.vapi_assistant_id.trim();

    // Autres champs VAPI (si ces colonnes existent réellement)
    if (body.working_hours_start) updateData.working_hours_start = body.working_hours_start;
    if (body.working_hours_end) updateData.working_hours_end = body.working_hours_end;
    if (body.working_days) updateData.working_days = body.working_days;
    if (body.timezone) updateData.timezone = body.timezone;
    if (body.qualification_questions) updateData.qualification_questions = body.qualification_questions;
    if (body.max_call_duration_seconds) updateData.max_call_duration_seconds = body.max_call_duration_seconds;
    if (body.retry_on_no_answer !== undefined) updateData.retry_on_no_answer = body.retry_on_no_answer;
    if (body.max_retry_attempts) updateData.max_retry_attempts = body.max_retry_attempts;
    if (body.delay_between_retries_minutes) updateData.delay_between_retries_minutes = body.delay_between_retries_minutes;
    if (body.webhook_url) updateData.webhook_url = body.webhook_url.trim();
    if (body.webhook_secret) updateData.webhook_secret = body.webhook_secret.trim();

    // Note: twilio_configured n'existe pas dans voice_config (table voice seulement)

    console.log('📝 Données à sauvegarder:', Object.keys(updateData));

    // Upsert de la configuration
    const { data: config, error } = await supabase
      .from('voice_config')
      .upsert(updateData, {
        onConflict: 'organization_id'
      })
      .select()
      .single();

    if (error) {
      console.error('[Voice AI Agent Config] Upsert error:', error);
      return NextResponse.json({
        error: 'Erreur lors de la sauvegarde de la configuration',
        details: error.message
      }, { status: 500 });
    }

    console.log('✅ Configuration AI Agent sauvegardée:', config.id);

    return NextResponse.json({
      config,
      message: 'Configuration sauvegardée avec succès'
    });

  } catch (error) {
    console.error('Erreur API voice ai-agent config update:', error);
    return NextResponse.json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}