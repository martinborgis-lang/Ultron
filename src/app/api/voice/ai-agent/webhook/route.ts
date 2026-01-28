// ========================================
// API WEBHOOK FORMULAIRES - AGENT IA AUTOMATIQUE
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import VapiService from '@/lib/services/vapi-service';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import {
  ProcessWebhookRequest,
  VoiceWebhook,
  VoiceConfig,
  PhoneCall,
  CreateCallRequest
} from '@/types/voice';

const supabase = createAdminClient();

/**
 * POST /api/voice/ai-agent/webhook
 * Traiter les webhooks de formulaires et déclencher des appels automatiques
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Webhook Agent IA reçu');

    // Récupération et validation des données
    const body = await request.json() as ProcessWebhookRequest;
    const { source, prospect_data, utm_params, metadata } = body;

    // Validation des données requises
    if (!prospect_data || !prospect_data.phone) {
      return NextResponse.json(
        { error: 'Données prospect incomplètes (numéro de téléphone requis)' },
        { status: 400 }
      );
    }

    // Déterminer l'organisation (via header ou domaine)
    let organizationId = request.headers.get('x-organization-id');

    if (!organizationId && prospect_data.organization_slug) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', prospect_data.organization_slug)
        .single();
      organizationId = org?.id;
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organisation non identifiée' },
        { status: 400 }
      );
    }

    console.log('🏢 Organisation ID:', organizationId);

    // Vérifier la configuration Agent IA pour cette organisation
    const { data: voiceConfig } = await supabase
      .from('voice_config')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_enabled', true)
      .single();

    if (!voiceConfig) {
      console.log('❌ Agent IA non configuré ou désactivé');
      return NextResponse.json(
        { error: 'Agent IA non configuré pour cette organisation' },
        { status: 400 }
      );
    }

    console.log('✅ Configuration Agent IA trouvée');

    // Enregistrer le webhook en base
    const webhookData: Partial<VoiceWebhook> = {
      organization_id: organizationId,
      source,
      webhook_url: request.url,
      prospect_data,
      phone_number: formatPhoneNumber(prospect_data.phone),
      email: prospect_data.email,
      name: `${prospect_data.first_name || ''} ${prospect_data.last_name || ''}`.trim() || prospect_data.name,
      processing_status: 'pending',
      ip_address: getClientIP(request),
      user_agent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      utm_source: utm_params?.source,
      utm_medium: utm_params?.medium,
      utm_campaign: utm_params?.campaign
    };

    const { data: webhook, error: webhookError } = await supabase
      .from('voice_webhooks')
      .insert(webhookData)
      .select('*')
      .single();

    if (webhookError) {
      console.error('❌ Erreur création webhook:', webhookError);
      return NextResponse.json(
        { error: 'Erreur enregistrement webhook' },
        { status: 500 }
      );
    }

    console.log('📝 Webhook enregistré:', webhook.id);

    // Traitement asynchrone du webhook
    try {
      await processWebhookAsync(webhook, voiceConfig);
    } catch (processError) {
      console.error('❌ Erreur traitement webhook:', processError);

      // Marquer comme échoué
      await supabase
        .from('voice_webhooks')
        .update({
          processing_status: 'failed',
          error_message: processError instanceof Error ? processError.message : 'Erreur inconnue',
          processed_at: new Date().toISOString()
        })
        .eq('id', webhook.id);

      return NextResponse.json(
        {
          error: 'Erreur traitement webhook',
          webhook_id: webhook.id,
          details: processError instanceof Error ? processError.message : 'Erreur inconnue'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook traité avec succès',
      webhook_id: webhook.id,
      processing_status: 'processing'
    });

  } catch (error) {
    console.error('❌ Erreur webhook Agent IA:', error);
    return NextResponse.json(
      {
        error: 'Erreur interne serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * Traiter le webhook de manière asynchrone
 */
async function processWebhookAsync(webhook: VoiceWebhook, voiceConfig: VoiceConfig) {
  console.log('🔄 Début traitement webhook:', webhook.id);

  try {
    // Marquer comme en cours de traitement
    await supabase
      .from('voice_webhooks')
      .update({ processing_status: 'processing' })
      .eq('id', webhook.id);

    // 1. Vérifications préliminaires
    const validations = await performValidations(webhook, voiceConfig);
    if (!validations.isValid) {
      await markWebhookAsSkipped(webhook.id, validations.reason);
      return;
    }

    // 2. Créer ou mettre à jour le prospect
    const prospect = await createOrUpdateProspect(webhook);

    // 3. Vérifier s'il faut programmer un appel
    const shouldCall = await shouldProgramCall(webhook, voiceConfig);
    if (!shouldCall.should) {
      await markWebhookAsSkipped(webhook.id, shouldCall.reason);
      return;
    }

    // 4. Programmer l'appel (immédiat ou différé)
    const call = await programCall(webhook, prospect, voiceConfig);

    // 5. Marquer le webhook comme traité
    await supabase
      .from('voice_webhooks')
      .update({
        processing_status: 'completed',
        processed_at: new Date().toISOString(),
        prospect_created_id: prospect.id,
        call_created_id: call.id,
        processing_notes: 'Traitement réussi - Appel programmé'
      })
      .eq('id', webhook.id);

    console.log('✅ Webhook traité avec succès:', {
      webhook_id: webhook.id,
      prospect_id: prospect.id,
      call_id: call.id
    });

  } catch (error) {
    console.error('❌ Erreur traitement webhook:', error);
    throw error;
  }
}

/**
 * Valider si l'appel peut être effectué
 */
async function performValidations(webhook: VoiceWebhook, voiceConfig: VoiceConfig): Promise<{
  isValid: boolean;
  reason?: string;
}> {
  // Vérifier le numéro de téléphone
  if (!webhook.phone_number || !isValidPhoneNumber(webhook.phone_number)) {
    return { isValid: false, reason: 'Numéro de téléphone invalide' };
  }

  // Vérifier les horaires de travail
  if (!isWithinWorkingHours(voiceConfig)) {
    return { isValid: false, reason: 'Hors horaires de travail' };
  }

  // Vérifier si le numéro n'est pas en liste noire
  const { data: blacklisted } = await supabase
    .from('phone_calls')
    .select('id')
    .eq('organization_id', webhook.organization_id)
    .eq('to_number', webhook.phone_number)
    .eq('outcome', 'not_interested')
    .limit(1);

  if (blacklisted && blacklisted.length > 0) {
    return { isValid: false, reason: 'Numéro en liste noire (pas intéressé)' };
  }

  // Vérifier la limite quotidienne d'appels
  const today = new Date().toISOString().split('T')[0];
  const { data: todaysCalls } = await supabase
    .from('phone_calls')
    .select('id')
    .eq('organization_id', webhook.organization_id)
    .gte('created_at', today)
    .lt('created_at', today + 'T23:59:59');

  const dailyLimit = 100; // Limite par défaut
  if (todaysCalls && todaysCalls.length >= dailyLimit) {
    return { isValid: false, reason: 'Limite quotidienne d\'appels atteinte' };
  }

  return { isValid: true };
}

/**
 * Créer ou mettre à jour le prospect dans le CRM
 */
async function createOrUpdateProspect(webhook: VoiceWebhook): Promise<any> {
  const prospectData = webhook.prospect_data;

  // Chercher un prospect existant par email ou téléphone
  const { data: existingProspect } = await supabase
    .from('crm_prospects')
    .select('*')
    .eq('organization_id', webhook.organization_id)
    .or(`email.eq.${prospectData.email || ''},phone.eq.${webhook.phone_number}`)
    .single();

  if (existingProspect) {
    console.log('👤 Prospect existant trouvé:', existingProspect.id);

    // Mettre à jour avec les nouvelles informations
    const { data: updatedProspect } = await supabase
      .from('crm_prospects')
      .update({
        first_name: prospectData.first_name || existingProspect.first_name,
        last_name: prospectData.last_name || existingProspect.last_name,
        email: prospectData.email || existingProspect.email,
        phone: webhook.phone_number,
        company: prospectData.company || existingProspect.company,
        source: webhook.source,
        source_detail: `Webhook ${webhook.source}`,
        utm_source: webhook.utm_source,
        utm_medium: webhook.utm_medium,
        utm_campaign: webhook.utm_campaign,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingProspect.id)
      .select('*')
      .single();

    return updatedProspect;
  } else {
    console.log('➕ Création nouveau prospect');

    // Créer un nouveau prospect
    const newProspectData = {
      organization_id: webhook.organization_id,
      first_name: prospectData.first_name,
      last_name: prospectData.last_name,
      email: prospectData.email,
      phone: webhook.phone_number,
      company: prospectData.company,
      job_title: prospectData.job_title,
      source: webhook.source,
      source_detail: `Webhook ${webhook.source}`,
      stage_slug: 'nouveau',
      qualification: 'non_qualifie',
      utm_source: webhook.utm_source,
      utm_medium: webhook.utm_medium,
      utm_campaign: webhook.utm_campaign,
      notes: `Prospect créé automatiquement via webhook ${webhook.source}`
    };

    const { data: newProspect, error } = await supabase
      .from('crm_prospects')
      .insert(newProspectData)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Erreur création prospect: ${error.message}`);
    }

    return newProspect;
  }
}

/**
 * Vérifier s'il faut programmer un appel
 */
async function shouldProgramCall(webhook: VoiceWebhook, voiceConfig: VoiceConfig): Promise<{
  should: boolean;
  reason?: string;
}> {
  // Vérifier s'il y a déjà un appel récent pour ce numéro
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const { data: recentCall } = await supabase
    .from('phone_calls')
    .select('*')
    .eq('organization_id', webhook.organization_id)
    .eq('to_number', webhook.phone_number)
    .gte('created_at', oneDayAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (recentCall) {
    // Si l'appel récent a abouti à un RDV, ne pas rappeler
    if (recentCall.outcome === 'appointment_booked') {
      return { should: false, reason: 'RDV déjà pris récemment' };
    }

    // Si la personne a dit ne pas être intéressée, ne pas rappeler
    if (recentCall.outcome === 'not_interested') {
      return { should: false, reason: 'Prospect pas intéressé' };
    }

    // Si l'appel a échoué pour problème technique, on peut réessayer
    if (recentCall.status === 'failed' || recentCall.status === 'no_answer') {
      return { should: true };
    }
  }

  return { should: true };
}

/**
 * Programmer un appel via Vapi
 */
async function programCall(webhook: VoiceWebhook, prospect: any, voiceConfig: VoiceConfig): Promise<PhoneCall> {
  console.log('📞 Programmation appel pour:', webhook.phone_number);

  // Créer l'enregistrement d'appel en base
  const callData: Partial<PhoneCall> = {
    organization_id: webhook.organization_id,
    prospect_id: prospect.id,
    to_number: webhook.phone_number,
    from_number: voiceConfig.vapi_phone_number,
    vapi_assistant_id: voiceConfig.vapi_assistant_id,
    status: 'queued',
    source: 'webhook',
    metadata: {
      webhook_id: webhook.id,
      source: webhook.source,
      utm_source: webhook.utm_source,
      utm_medium: webhook.utm_medium,
      utm_campaign: webhook.utm_campaign
    }
  };

  const { data: call, error: callError } = await supabase
    .from('phone_calls')
    .insert(callData)
    .select('*')
    .single();

  if (callError) {
    throw new Error(`Erreur création appel: ${callError.message}`);
  }

  // Déclencher l'appel via Vapi (avec délai si hors horaires)
  const shouldDelay = !isWithinWorkingHours(voiceConfig);

  if (shouldDelay) {
    // Programmer pour le prochain créneau ouvrable
    const nextWorkingTime = getNextWorkingTime(voiceConfig);
    await supabase
      .from('phone_calls')
      .update({
        scheduled_call_at: nextWorkingTime.toISOString(),
        processing_notes: 'Appel programmé pour le prochain créneau ouvrable'
      })
      .eq('id', call.id);

    console.log('⏰ Appel programmé pour:', nextWorkingTime);
  } else {
    // Déclencher l'appel immédiatement
    try {
      const vapiService = VapiService.createFromConfig(voiceConfig);

      const callRequest = {
        phoneNumber: webhook.phone_number,
        assistantId: voiceConfig.vapi_assistant_id,
        metadata: {
          prospect_id: prospect.id,
          organization_id: webhook.organization_id,
          call_id: call.id,
          webhook_id: webhook.id
        }
      };

      const vapiCall = await vapiService.createCall(callRequest);

      // Mettre à jour avec l'ID Vapi
      await supabase
        .from('phone_calls')
        .update({
          vapi_call_id: vapiCall.id,
          status: 'ringing',
          started_at: new Date().toISOString()
        })
        .eq('id', call.id);

      console.log('🎯 Appel déclenché via Vapi:', vapiCall.id);
    } catch (vapiError) {
      console.error('❌ Erreur Vapi:', vapiError);

      // Marquer l'appel comme échoué
      await supabase
        .from('phone_calls')
        .update({
          status: 'failed',
          error_message: vapiError instanceof Error ? vapiError.message : 'Erreur Vapi inconnue'
        })
        .eq('id', call.id);

      throw vapiError;
    }
  }

  return call;
}

/**
 * Marquer un webhook comme ignoré
 */
async function markWebhookAsSkipped(webhookId: string, reason: string) {
  await supabase
    .from('voice_webhooks')
    .update({
      processing_status: 'skipped',
      processed_at: new Date().toISOString(),
      processing_notes: reason
    })
    .eq('id', webhookId);

  console.log('⏭️ Webhook ignoré:', reason);
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

function formatPhoneNumber(phone: string): string {
  // Retirer tous les caractères non numériques sauf +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Si commence par 0, remplacer par +33
  if (cleaned.startsWith('0')) {
    cleaned = '+33' + cleaned.substring(1);
  }

  // Si ne commence pas par +, ajouter +33
  if (!cleaned.startsWith('+')) {
    cleaned = '+33' + cleaned;
  }

  return cleaned;
}

function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+\d{10,15}$/;
  return phoneRegex.test(phone);
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function isWithinWorkingHours(voiceConfig: VoiceConfig): boolean {
  const now = new Date();
  const currentDay = now.getDay() === 0 ? 7 : now.getDay(); // Dimanche = 7

  // Vérifier le jour de la semaine
  if (!voiceConfig.working_days.includes(currentDay)) {
    return false;
  }

  // Vérifier l'heure (simplifiée, sans gestion timezone pour l'instant)
  const currentHour = now.getHours();
  const startHour = parseInt(voiceConfig.working_hours_start.split(':')[0]);
  const endHour = parseInt(voiceConfig.working_hours_end.split(':')[0]);

  return currentHour >= startHour && currentHour < endHour;
}

function getNextWorkingTime(voiceConfig: VoiceConfig): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Pour simplifier, programmer pour demain à l'heure de début
  const [startHour, startMinute] = voiceConfig.working_hours_start.split(':').map(Number);
  tomorrow.setHours(startHour, startMinute, 0, 0);

  return tomorrow;
}

// Support pour les autres méthodes HTTP
export async function GET() {
  return NextResponse.json({
    message: 'Webhook Agent IA Automatique',
    status: 'active',
    endpoints: {
      webhook: 'POST /api/voice/ai-agent/webhook',
      documentation: 'https://docs.ultron.app/voice/webhook'
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Organization-Id'
    }
  });
}