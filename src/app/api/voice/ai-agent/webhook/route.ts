// ========================================
// WEBHOOK SIMPLIFIÉ - CRÉATION DIRECTE PROSPECT
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import VapiService from '@/lib/services/vapi-service';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';

const supabase = createAdminClient();

/**
 * POST /api/voice/ai-agent/webhook
 * Création directe prospect + programmation appel
 */
export async function POST(request: NextRequest) {
  console.log('🎯 Webhook Agent IA reçu - Version simplifiée');

  try {
    const body = await request.json();
    const {
      source = 'form_test',
      prospect_data,
      utm_params = {},
      metadata = {}
    } = body;

    // Validation des données essentielles
    if (!prospect_data || !prospect_data.phone) {
      return NextResponse.json(
        { error: 'Données prospect manquantes ou numéro de téléphone requis' },
        { status: 400 }
      );
    }

    // Déterminer l'organisation
    const organizationId = request.headers.get('X-Organization-Id') || prospect_data.organization_id;
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organisation non identifiée' },
        { status: 400 }
      );
    }

    console.log('🏢 Organisation:', organizationId);

    // Récupérer la configuration voice
    const { data: voiceConfig, error: configError } = await supabase
      .from('voice_config')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_enabled', true)
      .single();

    if (configError || !voiceConfig) {
      console.error('❌ Configuration agent IA non trouvée:', configError);
      return NextResponse.json(
        { error: 'Agent IA non configuré pour cette organisation' },
        { status: 400 }
      );
    }

    // Formater le numéro de téléphone
    const formattedPhone = formatPhoneNumber(prospect_data.phone);
    if (!isValidPhoneNumber(formattedPhone)) {
      return NextResponse.json(
        { error: 'Numéro de téléphone invalide' },
        { status: 400 }
      );
    }

    // 🚀 CRÉATION DIRECTE DU PROSPECT
    const { data: prospect, error: prospectError } = await supabase
      .from('crm_prospects')
      .insert({
        organization_id: organizationId,
        first_name: prospect_data.first_name,
        last_name: prospect_data.last_name,
        email: prospect_data.email,
        phone: formattedPhone,
        company: prospect_data.company || null,
        job_title: prospect_data.job_title || null,
        patrimoine_estime: prospect_data.patrimoine_estime || null,
        revenus_annuels: prospect_data.revenus_annuels || null,
        situation_familiale: prospect_data.situation_familiale || null,
        nb_enfants: prospect_data.nb_enfants || null,
        stage_slug: 'nouveau',
        qualification: 'non_qualifie',
        source: source,
        source_detail: `Formulaire ${source}`,
        utm_source: utm_params?.source,
        utm_medium: utm_params?.medium,
        utm_campaign: utm_params?.campaign,
        notes: `Prospect créé via formulaire ${source} - ${new Date().toLocaleString()}`
      })
      .select('*')
      .single();

    if (prospectError) {
      console.error('❌ Erreur création prospect:', prospectError);
      return NextResponse.json(
        { error: `Erreur création prospect: ${prospectError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Prospect créé:', prospect.id);

    // Si en horaires de travail, programmer l'appel
    if (isWithinWorkingHours(voiceConfig)) {
      try {
        const call = await programCallDirectly(prospect, voiceConfig);
        console.log('📞 Appel programmé:', call?.id);

        return NextResponse.json({
          success: true,
          message: 'Prospect créé et appel programmé avec succès',
          prospect_id: prospect.id,
          call_id: call?.id
        });
      } catch (callError) {
        console.error('❌ Erreur programmation appel:', callError);

        // Prospect créé mais appel échoué
        return NextResponse.json({
          success: true,
          message: 'Prospect créé, mais erreur lors de la programmation d\'appel',
          prospect_id: prospect.id,
          call_error: callError instanceof Error ? callError.message : 'Erreur inconnue'
        });
      }
    } else {
      console.log('⏰ Hors horaires de travail - Appel non programmé');

      return NextResponse.json({
        success: true,
        message: 'Prospect créé avec succès (hors horaires de travail)',
        prospect_id: prospect.id
      });
    }

  } catch (error) {
    console.error('❌ Erreur webhook:', error);
    return NextResponse.json(
      {
        error: 'Erreur interne serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '+33' + cleaned.substring(1);
  }

  if (!cleaned.startsWith('+')) {
    cleaned = '+33' + cleaned;
  }

  return cleaned;
}

function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+\d{10,15}$/;
  return phoneRegex.test(phone);
}

function isWithinWorkingHours(voiceConfig: any): boolean {
  const now = new Date();
  const currentDay = now.getDay() === 0 ? 7 : now.getDay();

  // Vérifier si on est dans les jours de travail
  if (!voiceConfig.working_days || !voiceConfig.working_days.includes(currentDay)) {
    return false;
  }

  const currentHour = now.getHours();
  const startHour = voiceConfig.working_hours_start ? parseInt(voiceConfig.working_hours_start.split(':')[0]) : 9;
  const endHour = voiceConfig.working_hours_end ? parseInt(voiceConfig.working_hours_end.split(':')[0]) : 18;

  return currentHour >= startHour && currentHour < endHour;
}

async function programCallDirectly(prospect: any, voiceConfig: any): Promise<any> {
  // Créer l'enregistrement d'appel
  const { data: call, error: callError } = await supabase
    .from('phone_calls')
    .insert({
      organization_id: prospect.organization_id,
      prospect_id: prospect.id,
      to_number: prospect.phone,
      from_number: process.env.TWILIO_PHONE_NUMBER,
      vapi_assistant_id: voiceConfig.vapi_assistant_id || 'default',
      status: 'queued',
      source: 'webhook_auto'
    })
    .select('*')
    .single();

  if (callError) {
    throw new Error(`Erreur création appel: ${callError.message}`);
  }

  // Programmer avec VAPI (si configuration disponible)
  try {
    const vapiService = VapiService.createFromConfig(voiceConfig);

    const vapiCall = await vapiService.createCall({
      phoneNumber: prospect.phone,
      assistantId: voiceConfig.vapi_assistant_id || 'default',
      metadata: {
        prospect_id: prospect.id,
        prospect_name: `${prospect.first_name} ${prospect.last_name}`.trim(),
        call_id: call.id
      }
    });

    // Mettre à jour avec l'ID Vapi
    await supabase
      .from('phone_calls')
      .update({
        vapi_call_id: vapiCall.id,
        status: 'ringing',
        started_at: new Date().toISOString()
      })
      .eq('id', call.id);

    console.log('✅ Appel VAPI créé:', vapiCall.id);

    return call;

  } catch (vapiError) {
    console.error('❌ Erreur VAPI:', vapiError);

    // Marquer l'appel comme échoué
    await supabase
      .from('phone_calls')
      .update({
        status: 'failed',
        error_message: vapiError instanceof Error ? vapiError.message : 'Erreur VAPI'
      })
      .eq('id', call.id);

    throw vapiError;
  }
}