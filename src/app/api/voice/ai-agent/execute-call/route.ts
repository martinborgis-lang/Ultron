// ========================================
// API EXÉCUTION APPEL PROGRAMMÉ - QSTASH
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import VapiService from '@/lib/services/vapi-service';

const supabase = createAdminClient();

/**
 * GET /api/voice/ai-agent/execute-call
 * Endpoint de test pour vérifier que l'endpoint est accessible
 */
export async function GET(request: NextRequest) {
  console.log('🏥 [EXECUTE-CALL] Health check endpoint appelé');

  return NextResponse.json({
    success: true,
    message: 'Endpoint execute-call est accessible',
    timestamp: new Date().toISOString(),
    url: request.url,
    method: 'GET'
  });
}

/**
 * POST /api/voice/ai-agent/execute-call
 * Exécuter un appel programmé (appelé par QStash)
 */
export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log('🎯 [EXECUTE-CALL] Début exécution appel programmé via QStash -', timestamp);

  // Log des headers pour debug QStash
  const headers = Object.fromEntries(request.headers.entries());
  console.log('📋 [EXECUTE-CALL] Headers reçus:', {
    'user-agent': headers['user-agent'],
    'content-type': headers['content-type'],
    'upstash-signature': headers['upstash-signature'] ? '[PRESENT]' : '[MISSING]',
    'authorization': headers['authorization'] ? '[PRESENT]' : '[MISSING]'
  });

  try {
    const body = await request.json();
    const { call_id, prospect_id, organization_id } = body;

    console.log('📥 [EXECUTE-CALL] Payload reçu:', { call_id, prospect_id, organization_id });

    if (!call_id) {
      console.error('❌ [EXECUTE-CALL] call_id manquant');
      return NextResponse.json({ error: 'call_id requis' }, { status: 400 });
    }

    // Récupérer les détails de l'appel
    const { data: call, error: callError } = await supabase
      .from('phone_calls')
      .select('*')
      .eq('id', call_id)
      .single();

    if (callError || !call) {
      console.error('❌ Appel introuvable:', callError);
      return NextResponse.json({ error: 'Appel introuvable' }, { status: 404 });
    }

    // Vérifier que l'appel n'a pas déjà été exécuté
    if (call.status !== 'queued') {
      console.log('ℹ️ Appel déjà traité, statut:', call.status);
      return NextResponse.json({
        success: true,
        message: 'Appel déjà traité',
        call_status: call.status
      });
    }

    // Récupérer le prospect
    const { data: prospect, error: prospectError } = await supabase
      .from('crm_prospects')
      .select('*')
      .eq('id', call.prospect_id)
      .single();

    if (prospectError || !prospect) {
      console.error('❌ Prospect introuvable:', prospectError);

      // Marquer l'appel comme échoué
      await supabase
        .from('phone_calls')
        .update({
          status: 'failed',
          error_message: 'Prospect introuvable'
        })
        .eq('id', call_id);

      return NextResponse.json({ error: 'Prospect introuvable' }, { status: 404 });
    }

    // Récupérer la configuration voice
    const { data: voiceConfig, error: configError } = await supabase
      .from('voice_config')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('is_enabled', true)
      .single();

    if (configError || !voiceConfig) {
      console.error('❌ Configuration voice introuvable:', configError);

      // Marquer l'appel comme échoué
      await supabase
        .from('phone_calls')
        .update({
          status: 'failed',
          error_message: 'Agent IA non configuré'
        })
        .eq('id', call_id);

      return NextResponse.json({ error: 'Agent IA non configuré' }, { status: 400 });
    }

    // Vérifier que c'est encore dans les horaires de travail
    if (!isWithinWorkingHours(voiceConfig)) {
      console.log('⏰ Hors horaires de travail au moment de l\'exécution');

      // Programmer pour le prochain créneau disponible
      const nextTime = getNextAvailableCallTime(voiceConfig);
      if (nextTime) {
        await rescheduleCall(call_id, nextTime);
        return NextResponse.json({
          success: true,
          message: 'Appel reprogrammé pour prochain créneau',
          rescheduled_time: nextTime.toISOString()
        });
      } else {
        // Marquer comme échoué si aucun créneau disponible
        await supabase
          .from('phone_calls')
          .update({
            status: 'failed',
            error_message: 'Aucun créneau disponible'
          })
          .eq('id', call_id);

        return NextResponse.json({ error: 'Aucun créneau disponible' }, { status: 400 });
      }
    }

    // Exécuter l'appel maintenant
    try {
      await executeCallNow(call, prospect, voiceConfig);

      return NextResponse.json({
        success: true,
        message: 'Appel exécuté avec succès',
        call_id: call_id
      });

    } catch (callError) {
      console.error('❌ Erreur lors de l\'exécution de l\'appel:', callError);

      // Marquer l'appel comme échoué
      await supabase
        .from('phone_calls')
        .update({
          status: 'failed',
          error_message: callError instanceof Error ? callError.message : 'Erreur VAPI'
        })
        .eq('id', call_id);

      return NextResponse.json({
        error: 'Erreur lors de l\'exécution de l\'appel',
        details: callError instanceof Error ? callError.message : 'Erreur inconnue'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Erreur execute-call:', error);
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

async function executeCallNow(call: any, prospect: any, voiceConfig: any): Promise<void> {
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

  console.log('✅ Appel VAPI exécuté via QStash:', vapiCall.id);
}

async function rescheduleCall(callId: string, newTime: Date): Promise<void> {
  // Mettre à jour la base avec la nouvelle heure
  await supabase
    .from('phone_calls')
    .update({
      scheduled_at: newTime.toISOString(),
      status: 'queued' // Remettre en queue pour reprogrammation
    })
    .eq('id', callId);

  // Programmer de nouveau via QStash
  // (implémenter si nécessaire)
  console.log(`📅 Appel ${callId} reprogrammé pour ${newTime.toISOString()}`);
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

function getNextAvailableCallTime(voiceConfig: any): Date | null {
  const now = new Date();
  const workingDays = voiceConfig.working_days || [1, 2, 3, 4, 5]; // Lun-Ven par défaut
  const startTime = voiceConfig.working_hours_start || '09:00';

  // Parser les heures
  const [startHour, startMinute] = startTime.split(':').map(Number);

  // Chercher le prochain créneau disponible (max 7 jours)
  for (let i = 1; i <= 7; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + i);

    const dayOfWeek = checkDate.getDay() === 0 ? 7 : checkDate.getDay();

    if (workingDays.includes(dayOfWeek)) {
      // Programmer au début des heures de bureau
      checkDate.setHours(startHour, startMinute, 0, 0);

      // Vérifier que c'est encore dans les heures de travail
      if (isWithinWorkingHours(voiceConfig, checkDate)) {
        return checkDate;
      }
    }
  }

  return null; // Aucun créneau trouvé dans la semaine
}