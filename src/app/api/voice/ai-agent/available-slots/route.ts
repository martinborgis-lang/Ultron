// ========================================
// API CRÉNEAUX DISPONIBLES - AGENT IA
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import {
  AvailableSlotsRequest,
  AvailableSlot,
  VoiceApiResponse
} from '@/types/voice';

const supabase = createAdminClient();

/**
 * GET /api/voice/ai-agent/available-slots
 * Récupérer les créneaux de rendez-vous disponibles
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📅 Demande créneaux disponibles');

    // Authentification (optionnelle pour l'IA)
    const authHeader = request.headers.get('authorization');
    let organization_id: string | null = null;
    let user_id: string | null = null;

    if (authHeader) {
      try {
        const { user, organization } = await getCurrentUserAndOrganization();
        if (user && organization) {
          organization_id = organization.id;
          user_id = user.id;
        }
      } catch (error) {
        // Ignorer les erreurs d'auth pour les appels depuis Vapi
        console.log('⚠️ Auth échouée, utilisation mode public');
      }
    }

    // Récupérer l'organization_id depuis les paramètres si pas authentifié
    const { searchParams } = new URL(request.url);
    if (!organization_id) {
      organization_id = searchParams.get('organization_id');
      if (!organization_id) {
        return NextResponse.json(
          { error: 'Organization ID requis' },
          { status: 400 }
        );
      }
    }

    // Paramètres de la requête
    const start_date = searchParams.get('start_date') || getTodayString();
    const end_date = searchParams.get('end_date') || getDateString(7); // +7 jours
    const duration_minutes = parseInt(searchParams.get('duration_minutes') || '60');
    const advisor_id = searchParams.get('advisor_id');
    const preferred_time_range = searchParams.get('preferred_time_range'); // 'matin', 'apres-midi', 'soir'

    console.log('📅 Paramètres:', {
      start_date,
      end_date,
      duration_minutes,
      advisor_id,
      preferred_time_range
    });

    // Validation des paramètres
    if (!isValidDate(start_date) || !isValidDate(end_date)) {
      return NextResponse.json(
        { error: 'Format de date invalide (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    if (duration_minutes < 15 || duration_minutes > 240) {
      return NextResponse.json(
        { error: 'Durée doit être entre 15 et 240 minutes' },
        { status: 400 }
      );
    }

    // Récupérer la configuration de l'organisation
    const { data: orgConfig } = await supabase
      .from('voice_config')
      .select('working_hours_start, working_hours_end, working_days, timezone')
      .eq('organization_id', organization_id)
      .single();

    // Configuration par défaut si pas trouvée
    const config = {
      working_hours_start: orgConfig?.working_hours_start || '09:00',
      working_hours_end: orgConfig?.working_hours_end || '18:00',
      working_days: orgConfig?.working_days || [1, 2, 3, 4, 5], // Lun-Ven
      timezone: orgConfig?.timezone || 'Europe/Paris'
    };

    // Récupérer les conseillers disponibles
    const advisors = await getAvailableAdvisors(organization_id, advisor_id);

    if (advisors.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Aucun conseiller disponible'
      });
    }

    // Générer tous les créneaux possibles
    const allSlots = generateTimeSlots(
      start_date,
      end_date,
      config,
      duration_minutes,
      preferred_time_range
    );

    // Filtrer les créneaux selon la disponibilité des conseillers
    const availableSlots: AvailableSlot[] = [];

    for (const slot of allSlots) {
      for (const advisor of advisors) {
        const isAvailable = await isAdvisorAvailable(
          advisor.id,
          slot.date,
          slot.time,
          duration_minutes
        );

        if (isAvailable) {
          availableSlots.push({
            date: slot.date,
            time: slot.time,
            duration_minutes,
            advisor_id: advisor.id,
            advisor_name: advisor.full_name
          });

          // Limiter à un conseiller par créneau pour simplifier
          break;
        }
      }
    }

    // Limiter le nombre de créneaux retournés
    const maxSlots = 20;
    const limitedSlots = availableSlots.slice(0, maxSlots);

    console.log(`✅ ${limitedSlots.length} créneaux trouvés`);

    return NextResponse.json<VoiceApiResponse<AvailableSlot[]>>({
      success: true,
      data: limitedSlots,
      metadata: {
        total: limitedSlots.length,
        start_date,
        end_date,
        duration_minutes,
        advisors_count: advisors.length
      }
    });

  } catch (error) {
    console.error('❌ Erreur créneaux disponibles:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SLOTS_ERROR',
          message: 'Erreur récupération créneaux',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/voice/ai-agent/available-slots
 * Alternative avec body pour requêtes complexes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AvailableSlotsRequest;

    // Convertir en paramètres GET et rediriger
    const params = new URLSearchParams();

    if (body.start_date) params.set('start_date', body.start_date);
    if (body.end_date) params.set('end_date', body.end_date);
    if (body.duration_minutes) params.set('duration_minutes', body.duration_minutes.toString());
    if (body.advisor_id) params.set('advisor_id', body.advisor_id);

    const getUrl = new URL(request.url);
    getUrl.search = params.toString();

    // Simuler une requête GET
    const getRequest = new NextRequest(getUrl, {
      method: 'GET',
      headers: request.headers
    });

    return await GET(getRequest);

  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur traitement requête POST' },
      { status: 400 }
    );
  }
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Récupérer les conseillers disponibles
 */
async function getAvailableAdvisors(
  organizationId: string,
  advisorId?: string | null
): Promise<Array<{ id: string; full_name: string }>> {
  let query = supabase
    .from('users')
    .select('id, full_name')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .in('role', ['admin', 'conseiller']);

  if (advisorId) {
    query = query.eq('id', advisorId);
  }

  const { data: advisors, error } = await query;

  if (error) {
    console.error('❌ Erreur récupération conseillers:', error);
    return [];
  }

  return advisors || [];
}

/**
 * Générer tous les créneaux de temps possibles
 */
function generateTimeSlots(
  startDate: string,
  endDate: string,
  config: {
    working_hours_start: string;
    working_hours_end: string;
    working_days: number[];
  },
  durationMinutes: number,
  preferredTimeRange?: string | null
): Array<{ date: string; time: string }> {
  const slots: Array<{ date: string; time: string }> = [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Définir les plages horaires selon la préférence
  let timeRanges: Array<{ start: string; end: string }>;

  if (preferredTimeRange === 'matin') {
    timeRanges = [{ start: config.working_hours_start, end: '12:00' }];
  } else if (preferredTimeRange === 'apres-midi') {
    timeRanges = [{ start: '14:00', end: config.working_hours_end }];
  } else if (preferredTimeRange === 'soir') {
    timeRanges = [{ start: '17:00', end: config.working_hours_end }];
  } else {
    // Toute la journée avec pause déjeuner
    timeRanges = [
      { start: config.working_hours_start, end: '12:00' },
      { start: '14:00', end: config.working_hours_end }
    ];
  }

  // Parcourir chaque jour
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // Dimanche = 7

    // Vérifier si c'est un jour de travail
    if (!config.working_days.includes(dayOfWeek)) {
      continue;
    }

    const dateString = date.toISOString().split('T')[0];

    // Générer les créneaux pour chaque plage horaire
    for (const range of timeRanges) {
      const startHour = parseInt(range.start.split(':')[0]);
      const startMinute = parseInt(range.start.split(':')[1]);
      const endHour = parseInt(range.end.split(':')[0]);
      const endMinute = parseInt(range.end.split(':')[1]);

      // Créer des créneaux toutes les 30 minutes
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = (hour === startHour ? startMinute : 0); minute < 60; minute += 30) {
          // Vérifier qu'il y a assez de temps avant la fin de la plage
          const slotEnd = hour * 60 + minute + durationMinutes;
          const rangeEnd = endHour * 60 + endMinute;

          if (slotEnd <= rangeEnd) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            slots.push({
              date: dateString,
              time: timeString
            });
          }
        }
      }
    }
  }

  return slots;
}

/**
 * Vérifier si un conseiller est disponible à un moment donné
 */
async function isAdvisorAvailable(
  advisorId: string,
  date: string,
  time: string,
  durationMinutes: number
): Promise<boolean> {
  const startDateTime = new Date(`${date}T${time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

  // Vérifier les conflits avec les événements existants
  const { data: conflicts } = await supabase
    .from('crm_events')
    .select('id')
    .eq('assigned_to', advisorId)
    .not('status', 'eq', 'cancelled')
    .or(`
      and(start_date.lte.${startDateTime.toISOString()},end_date.gt.${startDateTime.toISOString()}),
      and(start_date.lt.${endDateTime.toISOString()},end_date.gte.${endDateTime.toISOString()}),
      and(start_date.gte.${startDateTime.toISOString()},end_date.lte.${endDateTime.toISOString()})
    `);

  return !conflicts || conflicts.length === 0;
}

/**
 * Valider le format de date YYYY-MM-DD
 */
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Obtenir la date d'aujourd'hui au format YYYY-MM-DD
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Obtenir une date dans X jours au format YYYY-MM-DD
 */
function getDateString(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

// Support pour les autres méthodes HTTP
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}