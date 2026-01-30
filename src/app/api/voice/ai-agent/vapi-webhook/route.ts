// ========================================
// API WEBHOOK VAPI.AI - ÉVÉNEMENTS APPELS
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { VapiWebhookEvent, PhoneCall, CallOutcome } from '@/types/voice';
import { ProspectQualificationAnalyzer } from '@/lib/services/vapi-service';

const supabase = createAdminClient();

/**
 * POST /api/voice/ai-agent/vapi-webhook
 * Recevoir et traiter les événements webhook de Vapi.ai
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Webhook Vapi.ai reçu');

    // Récupérer l'événement Vapi
    const event = await request.json() as VapiWebhookEvent;

    // Log pour debugging
    console.log('📨 Type événement:', event.type);
    console.log('📞 ID Appel:', event.call.id);

    // Valider la signature du webhook (si configuré)
    const webhookSecret = request.headers.get('x-vapi-secret');
    if (webhookSecret) {
      const isValid = await validateVapiSignature(request, webhookSecret);
      if (!isValid) {
        console.log('❌ Signature webhook invalide');
        return NextResponse.json(
          { error: 'Signature invalide' },
          { status: 401 }
        );
      }
    }

    // Traiter selon le type d'événement
    switch (event.type) {
      case 'call-started':
        await handleCallStarted(event);
        break;

      case 'call-ended':
        await handleCallEnded(event);
        break;

      case 'transcript-updated':
        await handleTranscriptUpdated(event);
        break;

      case 'function-called':
        await handleFunctionCalled(event);
        break;

      case 'recording-available':
        await handleRecordingAvailable(event);
        break;

      default:
        console.warn('⚠️ Type événement inconnu:', event.type);
        return NextResponse.json(
          { error: 'Type événement non supporté' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Événement ${event.type} traité`,
      call_id: event.call.id
    });

  } catch (error) {
    console.error('❌ Erreur webhook Vapi:', error);
    return NextResponse.json(
      {
        error: 'Erreur traitement webhook',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

// ========================================
// HANDLERS ÉVÉNEMENTS VAPI
// ========================================

/**
 * Gérer le démarrage d'un appel
 */
async function handleCallStarted(event: VapiWebhookEvent) {
  console.log('🟢 Appel démarré:', event.call.id);

  const { data: call } = await findCallByVapiId(event.call.id);

  if (call) {
    await supabase
      .from('phone_calls')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
        answered: true
      })
      .eq('id', call.id);

    console.log('✅ Statut appel mis à jour: in_progress');

    // Envoyer notification temps réel si applicable
    await sendRealtimeNotification(call.organization_id, {
      type: 'call_started',
      call_id: call.id,
      prospect_id: call.prospect_id,
      phone_number: call.to_number
    });
  }
}

/**
 * Gérer la fin d'un appel
 */
async function handleCallEnded(event: VapiWebhookEvent) {
  console.log('🔴 Appel terminé:', event.call.id);

  const { data: call } = await findCallByVapiId(event.call.id);

  if (!call) {
    console.warn('⚠️ Appel non trouvé en base:', event.call.id);
    return;
  }

  // Calculer la durée
  const startTime = call.started_at ? new Date(call.started_at) : new Date();
  const endTime = new Date();
  const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

  // Analyser la transcription si disponible
  let qualificationResult = null;
  if (event.call.transcript && event.call.transcript.length > 0) {
    const transcriptText = event.call.transcript
      .map(t => t.content)
      .join(' ');

    // Récupérer la config de l'organisation pour les questions
    const { data: voiceConfig } = await supabase
      .from('voice_config')
      .select('qualification_questions')
      .eq('organization_id', call.organization_id)
      .single();

    const questions = voiceConfig?.qualification_questions || [];
    qualificationResult = ProspectQualificationAnalyzer.analyzeTranscript(
      transcriptText,
      questions
    );

    console.log('🧠 Qualification IA:', qualificationResult);
  }

  // Déterminer l'outcome basé sur la transcription et les événements
  const outcome = determineCallOutcome(event, qualificationResult);

  // Calculer le coût estimé
  const costCents = calculateCallCost(durationSeconds);

  // Mettre à jour l'appel
  const updateData: Partial<PhoneCall> = {
    status: 'completed',
    ended_at: endTime.toISOString(),
    duration_seconds: durationSeconds,
    cost_cents: costCents,
    outcome
  };

  // Ajouter les données de transcription si disponibles
  if (event.call.transcript) {
    updateData.transcript_json = event.call.transcript;
    updateData.transcript_text = event.call.transcript
      .map(t => t.content)
      .join('\n');
  }

  // Ajouter les résultats de qualification
  if (qualificationResult) {
    updateData.qualification_score = qualificationResult.score;
    updateData.qualification_result = qualificationResult.result;
    updateData.qualification_notes = qualificationResult.notes;
  }

  await supabase
    .from('phone_calls')
    .update(updateData)
    .eq('id', call.id);

  console.log('✅ Appel mis à jour avec résultats');

  // Mettre à jour le prospect s'il existe
  if (call.prospect_id && qualificationResult) {
    await updateProspectWithQualification(call.prospect_id, qualificationResult, outcome);
  }

  // Déclencher les workflows post-appel
  await triggerPostCallWorkflows(call, outcome, qualificationResult);

  // Notification temps réel
  await sendRealtimeNotification(call.organization_id, {
    type: 'call_ended',
    call_id: call.id,
    prospect_id: call.prospect_id,
    outcome,
    qualification_result: qualificationResult?.result,
    duration_seconds: durationSeconds
  });
}

/**
 * Gérer la mise à jour de transcription en temps réel
 */
async function handleTranscriptUpdated(event: VapiWebhookEvent) {
  console.log('📝 Transcription mise à jour:', event.call.id);

  const { data: call } = await findCallByVapiId(event.call.id);

  if (call && event.call.transcript) {
    // Sauvegarder la transcription en temps réel
    const transcriptText = event.call.transcript
      .map(t => t.content)
      .join('\n');

    await supabase
      .from('phone_calls')
      .update({
        transcript_json: event.call.transcript,
        transcript_text: transcriptText
      })
      .eq('id', call.id);

    // Notification temps réel pour le dashboard
    await sendRealtimeNotification(call.organization_id, {
      type: 'transcript_updated',
      call_id: call.id,
      transcript_preview: transcriptText.substring(0, 100) + '...'
    });
  }
}

/**
 * Gérer l'appel d'une fonction par l'assistant
 */
async function handleFunctionCalled(event: VapiWebhookEvent) {
  console.log('⚙️ Fonction appelée:', event.call.id);

  const { data: call } = await findCallByVapiId(event.call.id);
  if (!call) return;

  // Analyser l'appel de fonction dans la transcription
  const lastTranscript = event.call.transcript?.[event.call.transcript.length - 1];

  if (lastTranscript?.functionCall) {
    const functionCall = lastTranscript.functionCall;
    console.log('📞 Fonction:', functionCall.name, 'Args:', functionCall.arguments);

    // Traiter selon le type de fonction
    switch (functionCall.name) {
      case 'check_availability':
        await handleCheckAvailability(call, functionCall.arguments);
        break;

      case 'book_appointment':
        await handleBookAppointment(call, functionCall.arguments);
        break;

      case 'qualify_prospect':
        await handleQualifyProspect(call, functionCall.arguments);
        break;

      case 'end_call_with_outcome':
        await handleEndCallWithOutcome(call, functionCall.arguments);
        break;

      default:
        console.warn('⚠️ Fonction inconnue:', functionCall.name);
    }
  }
}

/**
 * Gérer la disponibilité d'un enregistrement
 */
async function handleRecordingAvailable(event: VapiWebhookEvent) {
  console.log('🎵 Enregistrement disponible:', event.call.id);

  const { data: call } = await findCallByVapiId(event.call.id);

  if (call && event.call.recordingUrl) {
    await supabase
      .from('phone_calls')
      .update({
        recording_url: event.call.recordingUrl,
        recording_duration_seconds: event.call.endedAt && event.call.startedAt
          ? Math.floor(
              (new Date(event.call.endedAt).getTime() - new Date(event.call.startedAt).getTime()) / 1000
            )
          : null
      })
      .eq('id', call.id);

    console.log('✅ URL enregistrement sauvegardée');
  }
}

// ========================================
// HANDLERS FONCTIONS ASSISTANT
// ========================================

async function handleCheckAvailability(call: PhoneCall, args: any) {
  console.log('📅 [VAPI-WEBHOOK] Vérification disponibilités:', args);

  try {
    // Préparer les paramètres pour l'API
    const params = new URLSearchParams();
    params.append('organization_id', call.organization_id);

    if (args.preferred_date) {
      params.append('start_date', args.preferred_date);
      // End date = +7 jours
      const endDate = new Date(args.preferred_date);
      endDate.setDate(endDate.getDate() + 7);
      params.append('end_date', endDate.toISOString().split('T')[0]);
    }

    if (args.preferred_time_range) {
      params.append('preferred_time_range', args.preferred_time_range);
    }

    // Appeler notre API de créneaux disponibles
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/voice/ai-agent/available-slots?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ [VAPI-WEBHOOK] Créneaux trouvés:', data.data?.length || 0);

      // Enregistrer l'activité avec les créneaux trouvés
      await supabase
        .from('crm_activities')
        .insert({
          organization_id: call.organization_id,
          prospect_id: call.prospect_id,
          user_id: call.user_id,
          type: 'note',
          subject: 'Vérification créneaux RDV',
          content: `L'agent IA a vérifié les créneaux. ${data.data?.length || 0} créneaux disponibles trouvés.`,
          metadata: {
            function_call: 'check_availability',
            args,
            slots_found: data.data?.length || 0,
            slots: data.data?.slice(0, 5) // Garder 5 premiers créneaux
          }
        });
    } else {
      console.error('❌ [VAPI-WEBHOOK] Erreur API créneaux:', response.status);
    }
  } catch (error) {
    console.error('❌ [VAPI-WEBHOOK] Erreur handleCheckAvailability:', error);
  }
}

async function handleBookAppointment(call: PhoneCall, args: any) {
  console.log('📅 [VAPI-WEBHOOK] Réservation RDV:', args);

  try {
    // Préparer les données pour l'API de réservation
    const bookingData = {
      prospect_id: call.prospect_id,
      date: args.date,
      time: args.time,
      duration_minutes: args.duration_minutes || 60,
      notes: args.notes || 'Rendez-vous pris via Agent IA automatique',
      call_id: call.id
    };

    console.log('📋 [VAPI-WEBHOOK] Données réservation:', bookingData);

    // Appeler notre API de réservation
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/voice/ai-agent/book-appointment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ [VAPI-WEBHOOK] RDV réservé avec succès:', result.data?.appointment_id);

      // Enregistrer l'activité de réservation
      await supabase
        .from('crm_activities')
        .insert({
          organization_id: call.organization_id,
          prospect_id: call.prospect_id,
          user_id: call.user_id,
          type: 'meeting',
          subject: 'RDV réservé via Agent IA',
          content: `Rendez-vous automatiquement réservé le ${args.date} à ${args.time} (${args.duration_minutes || 60} minutes).\n\nNotes: ${args.notes || 'Aucune'}`,
          metadata: {
            function_call: 'book_appointment',
            args,
            appointment_id: result.data?.appointment_id,
            booking_success: true
          }
        });

      // Mettre à jour l'appel avec le résultat
      await supabase
        .from('phone_calls')
        .update({
          appointment_date: `${args.date}T${args.time}:00`,
          appointment_duration_minutes: args.duration_minutes || 60,
          appointment_notes: args.notes,
          outcome: 'appointment_booked'
        })
        .eq('id', call.id);

    } else {
      const error = await response.json();
      console.error('❌ [VAPI-WEBHOOK] Erreur réservation RDV:', error);

      // Enregistrer l'échec de réservation
      await supabase
        .from('crm_activities')
        .insert({
          organization_id: call.organization_id,
          prospect_id: call.prospect_id,
          user_id: call.user_id,
          type: 'note',
          subject: 'Échec réservation RDV via Agent IA',
          content: `Tentative de réservation échouée: ${error.error_message || 'Erreur inconnue'}`,
          metadata: {
            function_call: 'book_appointment',
            args,
            booking_success: false,
            error: error.error_message
          }
        });
    }
  } catch (error) {
    console.error('❌ [VAPI-WEBHOOK] Erreur handleBookAppointment:', error);
  }
}

async function handleQualifyProspect(call: PhoneCall, args: any) {
  console.log('🎯 Qualification prospect:', args);

  // Mettre à jour l'appel avec la qualification
  await supabase
    .from('phone_calls')
    .update({
      qualification_score: args.qualification_score,
      qualification_result: args.qualification_result,
      qualification_notes: args.notes
    })
    .eq('id', call.id);

  // Mettre à jour le prospect si il existe
  if (call.prospect_id) {
    await supabase
      .from('crm_prospects')
      .update({
        qualification: args.qualification_result,
        score_ia: args.qualification_score,
        analyse_ia: args.notes,
        derniere_qualification: new Date().toISOString()
      })
      .eq('id', call.prospect_id);
  }
}

async function handleEndCallWithOutcome(call: PhoneCall, args: any) {
  console.log('🏁 Fin d\'appel avec outcome:', args);

  await supabase
    .from('phone_calls')
    .update({
      outcome: args.outcome,
      processing_notes: args.reason
    })
    .eq('id', call.id);
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

async function findCallByVapiId(vapiCallId: string): Promise<{ data: PhoneCall | null }> {
  const { data, error } = await supabase
    .from('phone_calls')
    .select('*')
    .eq('vapi_call_id', vapiCallId)
    .single();

  if (error) {
    console.warn('⚠️ Appel non trouvé:', vapiCallId, error.message);
    return { data: null };
  }

  return { data };
}

function determineCallOutcome(event: VapiWebhookEvent, qualification: any): CallOutcome {
  // Si un RDV a été pris (détecté dans les fonctions)
  if (event.call.transcript?.some(t => t.functionCall?.name === 'book_appointment')) {
    return 'appointment_booked';
  }

  // Si demande de rappel
  if (event.call.transcript?.some(t =>
    t.content.toLowerCase().includes('rappel') ||
    t.content.toLowerCase().includes('call back')
  )) {
    return 'callback_requested';
  }

  // Si pas intéressé (détecté dans la qualification)
  if (qualification?.result === 'NON_QUALIFIE' || qualification?.score < 20) {
    return 'not_interested';
  }

  // Si mauvais numéro
  if (event.call.transcript?.some(t =>
    t.content.toLowerCase().includes('mauvais numéro') ||
    t.content.toLowerCase().includes('wrong number')
  )) {
    return 'wrong_number';
  }

  return 'unknown';
}

function calculateCallCost(durationSeconds: number): number {
  // Tarification estimée: 5 centimes par minute
  const minutes = Math.ceil(durationSeconds / 60);
  return minutes * 5;
}

async function updateProspectWithQualification(
  prospectId: string,
  qualification: any,
  outcome: string
) {
  await supabase
    .from('crm_prospects')
    .update({
      qualification: qualification.result,
      score_ia: qualification.score,
      analyse_ia: qualification.notes,
      derniere_qualification: new Date().toISOString(),
      last_activity_at: new Date().toISOString()
    })
    .eq('id', prospectId);

  console.log('👤 Prospect mis à jour avec qualification');
}

async function triggerPostCallWorkflows(
  call: PhoneCall,
  outcome: string,
  qualification: any
) {
  console.log('🔄 Déclenchement workflows post-appel');

  // Workflow RDV pris
  if (outcome === 'appointment_booked') {
    // Envoyer email de confirmation (à implémenter)
    console.log('📧 TODO: Envoyer email confirmation RDV');
  }

  // Workflow qualification chaude
  if (qualification?.result === 'CHAUD') {
    // Notifier le conseiller (à implémenter)
    console.log('🔥 TODO: Notifier conseiller - prospect chaud');
  }

  // Workflow prospect pas intéressé
  if (outcome === 'not_interested') {
    // Marquer en liste noire temporaire (déjà fait)
    console.log('🚫 Prospect marqué comme pas intéressé');
  }
}

async function sendRealtimeNotification(
  organizationId: string,
  notification: any
) {
  // Utiliser Supabase Realtime pour notifier en temps réel
  // (à implémenter selon les besoins)
  console.log('📡 Notification temps réel:', notification);
}

async function validateVapiSignature(
  request: NextRequest,
  secret: string
): Promise<boolean> {
  // Implémenter la validation HMAC selon la doc Vapi
  // Pour l'instant, on retourne true
  return true;
}

// Support pour les autres méthodes HTTP
export async function GET() {
  return NextResponse.json({
    message: 'Webhook Vapi.ai pour Agent IA Automatique',
    status: 'active',
    supported_events: [
      'call-started',
      'call-ended',
      'transcript-updated',
      'function-called',
      'recording-available'
    ]
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Vapi-Secret'
    }
  });
}