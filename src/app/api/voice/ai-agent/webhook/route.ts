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

    // Calculer le délai d'attente avant l'appel
    const delayMinutes = voiceConfig.call_delay_minutes || 5;
    const callTime = new Date();
    callTime.setMinutes(callTime.getMinutes() + delayMinutes);

    // Vérifier si l'heure d'appel calculée est dans les horaires
    if (isWithinWorkingHours(voiceConfig, callTime)) {
      try {
        const call = await scheduleCallWithDelay(prospect, voiceConfig, callTime);
        console.log(`📞 Appel programmé pour ${callTime.toLocaleString()} (dans ${delayMinutes} min):`, call?.id);

        return NextResponse.json({
          success: true,
          message: `Prospect créé et appel programmé dans ${delayMinutes} minutes`,
          prospect_id: prospect.id,
          call_id: call?.id,
          scheduled_call_time: callTime.toISOString()
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
      console.log(`⏰ Heure d'appel calculée ${callTime.toLocaleString()} hors horaires de travail`);

      // Programmer pour le prochain créneau disponible
      const nextAvailableTime = getNextAvailableCallTime(voiceConfig);
      if (nextAvailableTime) {
        try {
          const call = await scheduleCallWithDelay(prospect, voiceConfig, nextAvailableTime);
          console.log('📞 Appel reprogrammé pour prochain créneau:', nextAvailableTime.toLocaleString());

          return NextResponse.json({
            success: true,
            message: `Prospect créé et appel programmé pour ${nextAvailableTime.toLocaleString()}`,
            prospect_id: prospect.id,
            call_id: call?.id,
            scheduled_call_time: nextAvailableTime.toISOString()
          });
        } catch (callError) {
          return NextResponse.json({
            success: true,
            message: 'Prospect créé, mais erreur lors de la programmation d\'appel',
            prospect_id: prospect.id,
            call_error: callError instanceof Error ? callError.message : 'Erreur inconnue'
          });
        }
      } else {
        return NextResponse.json({
          success: true,
          message: 'Prospect créé avec succès (aucun créneau d\'appel disponible)',
          prospect_id: prospect.id
        });
      }
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

function isWithinWorkingHours(voiceConfig: any, checkTime?: Date): boolean {
  const timeToCheck = checkTime || new Date();
  const currentDay = timeToCheck.getDay() === 0 ? 7 : timeToCheck.getDay();

  // Vérifier si on est dans les jours de travail
  if (!voiceConfig.working_days || !voiceConfig.working_days.includes(currentDay)) {
    return false;
  }

  const currentHour = timeToCheck.getHours();
  const currentMinute = timeToCheck.getMinutes();

  // Parser les heures de travail
  const startTime = voiceConfig.working_hours_start || '09:00';
  const endTime = voiceConfig.working_hours_end || '18:00';

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const currentMinutes = currentHour * 60 + currentMinute;
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
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

    // Créer ou récupérer l'assistant VAPI
    const assistant = await vapiService.createAssistant(voiceConfig, { name: 'Cabinet Ultron' });

    const vapiCall = await vapiService.createCall({
      phoneNumber: {
        number: prospect.phone
      },
      assistantId: assistant.id || voiceConfig.vapi_assistant_id,
      metadata: {
        prospect_id: prospect.id,
        prospect_name: `${prospect.first_name} ${prospect.last_name}`.trim(),
        call_id: call.id,
        organization_id: prospect.organization_id
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

async function scheduleCallWithDelay(prospect: any, voiceConfig: any, scheduledTime: Date): Promise<any> {
  // Créer l'enregistrement d'appel avec l'heure programmée
  const { data: call, error: callError } = await supabase
    .from('phone_calls')
    .insert({
      organization_id: prospect.organization_id,
      prospect_id: prospect.id,
      to_number: prospect.phone,
      from_number: process.env.TWILIO_PHONE_NUMBER,
      vapi_assistant_id: voiceConfig.vapi_assistant_id || 'default',
      status: 'queued',
      source: 'webhook_scheduled',
      scheduled_at: scheduledTime.toISOString()
    })
    .select('*')
    .single();

  if (callError) {
    throw new Error(`Erreur création appel programmé: ${callError.message}`);
  }

  // Si le délai est de 0, exécuter immédiatement (comme avant)
  const delayMinutes = voiceConfig.call_delay_minutes || 5;
  if (delayMinutes === 0) {
    return await executeCallNow(call, prospect, voiceConfig);
  }

  // Programmer via QStash
  try {
    const qstashResponse = await scheduleCallWithQStash(call, scheduledTime);
    console.log('📅 Appel programmé via QStash:', qstashResponse);

    // Mettre à jour l'appel avec l'ID de la tâche QStash
    await supabase
      .from('phone_calls')
      .update({
        status: 'scheduled',
        metadata: { qstash_message_id: qstashResponse?.messageId }
      })
      .eq('id', call.id);

    return call;
  } catch (qstashError) {
    console.error('❌ Erreur QStash, exécution immédiate:', qstashError);
    // En cas d'erreur QStash, exécuter immédiatement
    return await executeCallNow(call, prospect, voiceConfig);
  }
}

async function executeCallNow(call: any, prospect: any, voiceConfig: any): Promise<any> {
  try {
    const vapiService = VapiService.createFromConfig(voiceConfig);

    // Créer l'assistant VAPI
    const assistant = await vapiService.createAssistant(voiceConfig, { name: 'Cabinet Ultron' });

    const vapiCall = await vapiService.createCall({
      phoneNumber: {
        number: prospect.phone
      },
      assistantId: assistant.id || voiceConfig.vapi_assistant_id,
      metadata: {
        prospect_id: prospect.id,
        prospect_name: `${prospect.first_name} ${prospect.last_name}`.trim(),
        call_id: call.id,
        organization_id: prospect.organization_id
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

    console.log('✅ Appel VAPI exécuté immédiatement:', vapiCall.id);
    return call;

  } catch (vapiError) {
    console.error('❌ Erreur VAPI lors de l\'exécution:', vapiError);

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

async function scheduleCallWithQStash(call: any, scheduledTime: Date): Promise<any> {
  // FORCER l'utilisation de l'URL de production stable pour QStash
  const webhookUrl = 'https://ultron-murex.vercel.app/api/voice/ai-agent/execute-call';

  const payload = {
    call_id: call.id,
    prospect_id: call.prospect_id,
    organization_id: call.organization_id
  };

  const delay = Math.floor((scheduledTime.getTime() - Date.now()) / 1000); // délai en secondes

  // Si le délai est négatif ou trop petit, exécuter immédiatement
  if (delay <= 5) {
    throw new Error('Délai trop court pour la programmation');
  }

  console.log('📅 QStash webhook URL:', webhookUrl);
  console.log('⏰ Délai programmé:', delay, 'secondes');

  // Utiliser QStash v2 - NE PAS encoder l'URL complète, juste les paramètres
  const qstashUrl = `https://qstash.upstash.io/v2/publish/${webhookUrl}`;

  const response = await fetch(qstashUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`,
      'Content-Type': 'application/json',
      'Upstash-Delay': `${delay}s`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur QStash: ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

function getNextAvailableCallTime(voiceConfig: any): Date | null {
  const now = new Date();
  const workingDays = voiceConfig.working_days || [1, 2, 3, 4, 5]; // Lun-Ven par défaut
  const startTime = voiceConfig.working_hours_start || '09:00';
  const endTime = voiceConfig.working_hours_end || '18:00';

  // Parser les heures
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  // Chercher le prochain créneau disponible (max 7 jours)
  for (let i = 1; i <= 7; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + i);

    const dayOfWeek = checkDate.getDay() === 0 ? 7 : checkDate.getDay();

    if (workingDays.includes(dayOfWeek)) {
      // Programmer au début des heures de bureau + délai configuré
      const delayMinutes = voiceConfig.call_delay_minutes || 5;
      checkDate.setHours(startHour, startMinute + delayMinutes, 0, 0);

      // Vérifier que c'est encore dans les heures de travail
      if (isWithinWorkingHours(voiceConfig, checkDate)) {
        return checkDate;
      }
    }
  }

  return null; // Aucun créneau trouvé dans la semaine
}