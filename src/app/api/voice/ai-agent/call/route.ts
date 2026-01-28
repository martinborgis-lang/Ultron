// ========================================
// API APPEL MANUEL - AGENT IA AUTOMATIQUE
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import VapiService from '@/lib/services/vapi-service';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import {
  CreateCallRequest,
  PhoneCall,
  VoiceConfig,
  VapiCallRequest
} from '@/types/voice';

const supabase = createAdminClient();

/**
 * POST /api/voice/ai-agent/call
 * Lancer un appel manuel via l'Agent IA
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📞 Demande d\'appel manuel Agent IA');

    // Authentification et organisation
    const result = await getCurrentUserAndOrganization();

    if (!result) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { user, organization } = result;

    // Récupération des données de la requête
    const body = await request.json() as CreateCallRequest;
    const {
      prospect_id,
      phone_number,
      script_type = 'qualification',
      priority = 'normal',
      scheduled_at,
      metadata = {}
    } = body;

    console.log('📞 Appel pour:', { prospect_id, phone_number, script_type });

    // Validation des données
    if (!phone_number) {
      return NextResponse.json(
        { error: 'Numéro de téléphone requis' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone_number);
    if (!isValidPhoneNumber(formattedPhone)) {
      return NextResponse.json(
        { error: 'Numéro de téléphone invalide' },
        { status: 400 }
      );
    }

    // Vérifier la configuration Agent IA
    const { data: voiceConfig, error: configError } = await supabase
      .from('voice_config')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('is_enabled', true)
      .single();

    if (configError || !voiceConfig) {
      return NextResponse.json(
        { error: 'Agent IA non configuré ou désactivé' },
        { status: 400 }
      );
    }

    console.log('✅ Configuration Agent IA trouvée');

    // Vérifier le prospect s'il est spécifié
    let prospect = null;
    if (prospect_id) {
      const { data: prospectData, error: prospectError } = await supabase
        .from('crm_prospects')
        .select('*')
        .eq('id', prospect_id)
        .eq('organization_id', organization.id)
        .single();

      if (prospectError || !prospectData) {
        return NextResponse.json(
          { error: 'Prospect non trouvé' },
          { status: 404 }
        );
      }

      prospect = prospectData;
      console.log('👤 Prospect trouvé:', prospect.first_name, prospect.last_name);
    }

    // Vérifications préliminaires
    const validations = await performCallValidations(
      formattedPhone,
      organization.id,
      voiceConfig,
      user.role
    );

    if (!validations.isValid) {
      return NextResponse.json(
        { error: validations.reason },
        { status: 400 }
      );
    }

    // Créer l'enregistrement d'appel en base
    const callData: Partial<PhoneCall> = {
      organization_id: organization.id,
      prospect_id,
      user_id: user.id,
      to_number: formattedPhone,
      from_number: voiceConfig.vapi_phone_number,
      vapi_assistant_id: voiceConfig.vapi_assistant_id,
      status: 'queued',
      source: 'manual'
    };

    // Note: scheduled_at handling would need to be implemented in the database schema

    const { data: call, error: callError } = await supabase
      .from('phone_calls')
      .insert(callData)
      .select('*')
      .single();

    if (callError) {
      console.error('❌ Erreur création appel:', callError);
      return NextResponse.json(
        { error: 'Erreur création appel' },
        { status: 500 }
      );
    }

    console.log('📝 Appel créé en base:', call.id);

    // Décider si l'appel doit être immédiat ou programmé
    const shouldCallNow = !scheduled_at && isWithinWorkingHours(voiceConfig);

    if (shouldCallNow) {
      // Déclencher l'appel immédiatement
      const callResult = await initiateVapiCall(call, voiceConfig, prospect);

      if (callResult.success) {
        return NextResponse.json({
          success: true,
          message: 'Appel lancé avec succès',
          call_id: call.id,
          vapi_call_id: callResult.vapi_call_id,
          status: 'initiated'
        });
      } else {
        // Marquer l'appel comme échoué
        await supabase
          .from('phone_calls')
          .update({
            status: 'failed',
            error_message: callResult.error_message
          })
          .eq('id', call.id);

        return NextResponse.json({
          success: false,
          error: callResult.error_message,
          call_id: call.id
        }, { status: 500 });
      }
    } else {
      // Programmer l'appel pour plus tard
      const scheduledTime = scheduled_at
        ? new Date(scheduled_at)
        : getNextWorkingTime(voiceConfig);

      await supabase
        .from('phone_calls')
        .update({
          scheduled_call_at: scheduledTime.toISOString(),
          status: 'queued',
          processing_notes: 'Appel programmé'
        })
        .eq('id', call.id);

      return NextResponse.json({
        success: true,
        message: 'Appel programmé avec succès',
        call_id: call.id,
        scheduled_at: scheduledTime.toISOString(),
        status: 'scheduled'
      });
    }

  } catch (error) {
    console.error('❌ Erreur appel manuel:', error);
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
 * GET /api/voice/ai-agent/call
 * Lister les appels avec filtres et pagination
 */
export async function GET(request: NextRequest) {
  try {
    const result = await getCurrentUserAndOrganization();

    if (!result) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { user, organization } = result;

    // Paramètres de requête
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const outcome = searchParams.get('outcome');
    const prospect_id = searchParams.get('prospect_id');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');

    console.log('📋 Liste des appels - Page:', page, 'Limit:', limit);

    // Construction de la requête
    let query = supabase
      .from('phone_calls')
      .select(`
        *,
        crm_prospects:prospect_id(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false });

    // Filtres
    if (status) {
      query = query.eq('status', status);
    }

    if (outcome) {
      query = query.eq('outcome', outcome);
    }

    if (prospect_id) {
      query = query.eq('prospect_id', prospect_id);
    }

    if (date_from) {
      query = query.gte('created_at', date_from);
    }

    if (date_to) {
      query = query.lte('created_at', date_to);
    }

    // Pagination
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data: calls, error, count } = await query;

    if (error) {
      console.error('❌ Erreur récupération appels:', error);
      return NextResponse.json(
        { error: 'Erreur récupération données' },
        { status: 500 }
      );
    }

    // Compter le total pour la pagination
    const { count: totalCount } = await supabase
      .from('phone_calls')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organization.id);

    return NextResponse.json({
      success: true,
      data: calls,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit),
        has_next: from + limit < (totalCount || 0),
        has_previous: page > 1
      }
    });

  } catch (error) {
    console.error('❌ Erreur liste appels:', error);
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

/**
 * Valider qu'un appel peut être effectué
 */
async function performCallValidations(
  phoneNumber: string,
  organizationId: string,
  voiceConfig: VoiceConfig,
  userRole: string
): Promise<{ isValid: boolean; reason?: string }> {

  // Vérifier si l'utilisateur a le droit de lancer des appels
  if (userRole !== 'admin' && userRole !== 'conseiller') {
    return { isValid: false, reason: 'Permissions insuffisantes' };
  }

  // Vérifier si le numéro n'a pas été appelé récemment
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const { data: recentCall } = await supabase
    .from('phone_calls')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('to_number', phoneNumber)
    .gte('created_at', oneHourAgo.toISOString())
    .eq('status', 'in_progress')
    .limit(1)
    .single();

  if (recentCall) {
    return { isValid: false, reason: 'Appel en cours ou récent pour ce numéro' };
  }

  // Vérifier si le numéro n'est pas en liste noire
  const { data: blacklistedCall } = await supabase
    .from('phone_calls')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('to_number', phoneNumber)
    .eq('outcome', 'not_interested')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (blacklistedCall) {
    const daysSinceBlacklist = Math.floor(
      (Date.now() - new Date(blacklistedCall.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Ne pas rappeler avant 30 jours si pas intéressé
    if (daysSinceBlacklist < 30) {
      return { isValid: false, reason: 'Numéro en liste noire (pas intéressé)' };
    }
  }

  // Vérifier la limite quotidienne
  const today = new Date().toISOString().split('T')[0];
  const { count: todaysCallsCount } = await supabase
    .from('phone_calls')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', today)
    .lt('created_at', today + 'T23:59:59');

  const dailyLimit = 50; // Limite par défaut pour les appels manuels
  if ((todaysCallsCount || 0) >= dailyLimit) {
    return { isValid: false, reason: 'Limite quotidienne d\'appels atteinte' };
  }

  return { isValid: true };
}

/**
 * Initier un appel via Vapi
 */
async function initiateVapiCall(
  call: PhoneCall,
  voiceConfig: VoiceConfig,
  prospect: any = null
): Promise<{
  success: boolean;
  vapi_call_id?: string;
  error_message?: string;
}> {
  try {
    console.log('🎯 Lancement appel Vapi:', call.to_number);

    const vapiService = VapiService.createFromConfig(voiceConfig);

    // Préparer les métadonnées pour l'assistant
    const callMetadata = {
      call_id: call.id,
      prospect_id: call.prospect_id,
      organization_id: call.organization_id,
      prospect_name: prospect ? `${prospect.first_name || ''} ${prospect.last_name || ''}`.trim() : 'Prospect',
      script_type: 'qualification' // Default script type since metadata is not available
    };

    const vapiCallRequest: VapiCallRequest = {
      phoneNumber: call.to_number,
      assistantId: voiceConfig.vapi_assistant_id,
      metadata: callMetadata
    };

    const vapiCall = await vapiService.createCall(vapiCallRequest);

    // Mettre à jour l'appel avec l'ID Vapi
    await supabase
      .from('phone_calls')
      .update({
        vapi_call_id: vapiCall.id,
        status: 'ringing',
        started_at: new Date().toISOString()
      })
      .eq('id', call.id);

    console.log('✅ Appel Vapi initié:', vapiCall.id);

    return {
      success: true,
      vapi_call_id: vapiCall.id
    };

  } catch (error) {
    console.error('❌ Erreur initiation appel Vapi:', error);

    return {
      success: false,
      error_message: error instanceof Error ? error.message : 'Erreur Vapi inconnue'
    };
  }
}

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

function isWithinWorkingHours(voiceConfig: VoiceConfig): boolean {
  const now = new Date();
  const currentDay = now.getDay() === 0 ? 7 : now.getDay();

  if (!voiceConfig.working_days.includes(currentDay)) {
    return false;
  }

  const currentHour = now.getHours();
  const startHour = parseInt(voiceConfig.working_hours_start.split(':')[0]);
  const endHour = parseInt(voiceConfig.working_hours_end.split(':')[0]);

  return currentHour >= startHour && currentHour < endHour;
}

function getNextWorkingTime(voiceConfig: VoiceConfig): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [startHour, startMinute] = voiceConfig.working_hours_start.split(':').map(Number);
  tomorrow.setHours(startHour, startMinute, 0, 0);

  return tomorrow;
}