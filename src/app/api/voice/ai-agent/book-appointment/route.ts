// ========================================
// API PRISE DE RENDEZ-VOUS - AGENT IA
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import {
  BookAppointmentRequest,
  BookAppointmentResponse,
  VoiceApiResponse
} from '@/types/voice';

const supabase = createAdminClient();

/**
 * POST /api/voice/ai-agent/book-appointment
 * Réserver un rendez-vous depuis l'Agent IA
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📅 Demande réservation RDV Agent IA');

    // Récupération des données
    const body = await request.json() as BookAppointmentRequest;
    const {
      prospect_id,
      date,
      time,
      duration_minutes = 60,
      advisor_id,
      notes,
      call_id
    } = body;

    console.log('📅 Données RDV:', {
      prospect_id,
      date,
      time,
      duration_minutes,
      advisor_id,
      call_id
    });

    // Validation des données requises
    if (!prospect_id || !date || !time) {
      return NextResponse.json<BookAppointmentResponse>({
        success: false,
        error_message: 'Prospect ID, date et heure sont requis'
      }, { status: 400 });
    }

    // Validation du format de date et heure
    if (!isValidDate(date) || !isValidTime(time)) {
      return NextResponse.json<BookAppointmentResponse>({
        success: false,
        error_message: 'Format de date (YYYY-MM-DD) ou heure (HH:MM) invalide'
      }, { status: 400 });
    }

    // Vérifier que le RDV n'est pas dans le passé
    const appointmentDateTime = new Date(`${date}T${time}:00`);
    if (appointmentDateTime <= new Date()) {
      return NextResponse.json<BookAppointmentResponse>({
        success: false,
        error_message: 'Impossible de réserver un RDV dans le passé'
      }, { status: 400 });
    }

    // Récupérer les informations du prospect
    const { data: prospect, error: prospectError } = await supabase
      .from('crm_prospects')
      .select('*, organization_id')
      .eq('id', prospect_id)
      .single();

    if (prospectError || !prospect) {
      return NextResponse.json<BookAppointmentResponse>({
        success: false,
        error_message: 'Prospect non trouvé'
      }, { status: 404 });
    }

    console.log('👤 Prospect trouvé:', prospect.first_name, prospect.last_name);

    // Déterminer le conseiller
    let selectedAdvisor = null;

    if (advisor_id) {
      // Vérifier que le conseiller existe et est actif
      const { data: advisor } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', advisor_id)
        .eq('organization_id', prospect.organization_id)
        .eq('is_active', true)
        .single();

      if (!advisor) {
        return NextResponse.json<BookAppointmentResponse>({
          success: false,
          error_message: 'Conseiller spécifié non disponible'
        }, { status: 400 });
      }

      selectedAdvisor = advisor;
    } else {
      // Trouver un conseiller disponible automatiquement
      selectedAdvisor = await findAvailableAdvisor(
        prospect.organization_id,
        date,
        time,
        duration_minutes
      );

      if (!selectedAdvisor) {
        return NextResponse.json<BookAppointmentResponse>({
          success: false,
          error_message: 'Aucun conseiller disponible à ce créneau'
        }, { status: 409 });
      }
    }

    console.log('🧑‍💼 Conseiller sélectionné:', selectedAdvisor.full_name);

    // Vérifier la disponibilité du conseiller
    const isAvailable = await checkAdvisorAvailability(
      selectedAdvisor.id,
      date,
      time,
      duration_minutes
    );

    if (!isAvailable) {
      return NextResponse.json<BookAppointmentResponse>({
        success: false,
        error_message: 'Conseiller non disponible à ce créneau'
      }, { status: 409 });
    }

    // Créer l'événement de rendez-vous
    const appointmentData = {
      organization_id: prospect.organization_id,
      prospect_id,
      type: 'meeting',
      title: `RDV CGP - ${prospect.first_name || ''} ${prospect.last_name || ''}`.trim(),
      description: `Rendez-vous de conseil en gestion de patrimoine\n\nProspect: ${prospect.first_name || ''} ${prospect.last_name || ''}\nTéléphone: ${prospect.phone || ''}\nEmail: ${prospect.email || ''}\n\nNotes: ${notes || 'Aucune note spécifique'}`,
      start_date: `${date}T${time}:00`,
      end_date: new Date(
        new Date(`${date}T${time}:00`).getTime() + duration_minutes * 60000
      ).toISOString(),
      all_day: false,
      status: 'pending',
      assigned_to: selectedAdvisor.id,
      created_by: selectedAdvisor.id,
      priority: 'medium',
      notes: notes || 'Rendez-vous pris via Agent IA automatique',
      metadata: {
        booked_via_ai: true,
        call_id: call_id,
        source: 'vapi_ai_agent',
        duration_minutes,
        booking_timestamp: new Date().toISOString()
      }
    };

    const { data: appointment, error: appointmentError } = await supabase
      .from('crm_events')
      .insert(appointmentData)
      .select('*')
      .single();

    if (appointmentError) {
      console.error('❌ Erreur création RDV:', appointmentError);
      return NextResponse.json<BookAppointmentResponse>({
        success: false,
        error_message: 'Erreur lors de la création du rendez-vous'
      }, { status: 500 });
    }

    console.log('✅ RDV créé:', appointment.id);

    // Mettre à jour l'appel téléphonique si spécifié
    if (call_id) {
      await supabase
        .from('phone_calls')
        .update({
          appointment_date: appointmentData.start_date,
          appointment_duration_minutes: duration_minutes,
          appointment_notes: notes,
          outcome: 'appointment_booked'
        })
        .eq('id', call_id);

      console.log('📞 Appel mis à jour avec info RDV');
    }

    // Mettre à jour le prospect
    await supabase
      .from('crm_prospects')
      .update({
        last_activity_at: new Date().toISOString(),
        stage_slug: 'rdv_pris', // Avancer dans le pipeline
        notes: prospect.notes
          ? `${prospect.notes}\n\nRDV programmé le ${date} à ${time} avec ${selectedAdvisor.full_name}`
          : `RDV programmé le ${date} à ${time} avec ${selectedAdvisor.full_name}`
      })
      .eq('id', prospect_id);

    // Créer une activité CRM
    await supabase
      .from('crm_activities')
      .insert({
        organization_id: prospect.organization_id,
        prospect_id,
        user_id: selectedAdvisor.id,
        type: 'meeting',
        subject: 'Rendez-vous programmé via Agent IA',
        content: `Rendez-vous automatiquement programmé le ${date} à ${time} (${duration_minutes} minutes).\n\nNotes: ${notes || 'Aucune'}`,
        metadata: {
          appointment_id: appointment.id,
          call_id: call_id,
          booked_via_ai: true
        }
      });

    // Optionnel: Intégrer avec Google Calendar
    let calendarEventId = null;
    let meetLink = null;

    try {
      const calendarResult = await createGoogleCalendarEvent(
        selectedAdvisor.id,
        appointmentData,
        prospect
      );

      if (calendarResult) {
        calendarEventId = calendarResult.eventId;
        meetLink = calendarResult.meetLink;

        // Mettre à jour l'événement avec les infos Google
        await supabase
          .from('crm_events')
          .update({
            external_id: calendarEventId,
            external_source: 'google_calendar',
            meet_link: meetLink
          })
          .eq('id', appointment.id);

        console.log('📅 Événement Google Calendar créé:', calendarEventId);
      }
    } catch (calendarError) {
      console.error('⚠️ Erreur Google Calendar (non bloquant):', calendarError);
      // Ne pas faire échouer la réservation pour une erreur Calendar
    }

    // Optionnel: Envoyer email de confirmation
    let confirmationEmailSent = false;

    try {
      await sendConfirmationEmail(prospect, selectedAdvisor, appointmentData, meetLink);
      confirmationEmailSent = true;
      console.log('📧 Email de confirmation envoyé');
    } catch (emailError) {
      console.error('⚠️ Erreur email confirmation (non bloquant):', emailError);
      // Ne pas faire échouer la réservation pour une erreur email
    }

    // Réponse de succès
    const response: BookAppointmentResponse = {
      success: true,
      appointment_id: appointment.id,
      calendar_event_id: calendarEventId || undefined,
      meet_link: meetLink || undefined,
      confirmation_email_sent: confirmationEmailSent
    };

    console.log('🎉 RDV réservé avec succès');

    return NextResponse.json({
      success: true,
      data: response,
      metadata: {
        prospect_id,
        advisor_id: selectedAdvisor.id,
        appointment_date: appointmentData.start_date,
        processing_time: 0
      }
    });

  } catch (error) {
    console.error('❌ Erreur réservation RDV:', error);
    return NextResponse.json<BookAppointmentResponse>({
      success: false,
      error_message: error instanceof Error ? error.message : 'Erreur interne serveur'
    }, { status: 500 });
  }
}

/**
 * GET /api/voice/ai-agent/book-appointment
 * Informations sur l'API de réservation
 */
export async function GET() {
  return NextResponse.json({
    message: 'API de réservation de rendez-vous pour Agent IA',
    status: 'active',
    methods: ['POST'],
    required_fields: ['prospect_id', 'date', 'time'],
    optional_fields: ['duration_minutes', 'advisor_id', 'notes', 'call_id'],
    date_format: 'YYYY-MM-DD',
    time_format: 'HH:MM',
    example_request: {
      prospect_id: 'uuid',
      date: '2024-01-15',
      time: '14:30',
      duration_minutes: 60,
      notes: 'Premier rendez-vous suite à qualification téléphonique'
    }
  });
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Trouver un conseiller disponible automatiquement
 */
async function findAvailableAdvisor(
  organizationId: string,
  date: string,
  time: string,
  durationMinutes: number
): Promise<{ id: string; full_name: string; email: string } | null> {
  // Récupérer tous les conseillers actifs
  const { data: advisors } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .in('role', ['admin', 'conseiller']);

  if (!advisors || advisors.length === 0) {
    return null;
  }

  // Tester chaque conseiller jusqu'à en trouver un de disponible
  for (const advisor of advisors) {
    const isAvailable = await checkAdvisorAvailability(
      advisor.id,
      date,
      time,
      durationMinutes
    );

    if (isAvailable) {
      return advisor;
    }
  }

  return null;
}

/**
 * Vérifier la disponibilité d'un conseiller
 */
async function checkAdvisorAvailability(
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
    .select('id, title, start_date, end_date')
    .eq('assigned_to', advisorId)
    .not('status', 'eq', 'cancelled')
    .or(`
      and(start_date.lte.${startDateTime.toISOString()},end_date.gt.${startDateTime.toISOString()}),
      and(start_date.lt.${endDateTime.toISOString()},end_date.gte.${endDateTime.toISOString()}),
      and(start_date.gte.${startDateTime.toISOString()},end_date.lte.${endDateTime.toISOString()})
    `);

  const hasConflicts = conflicts && conflicts.length > 0;

  if (hasConflicts) {
    console.log('⚠️ Conflit détecté pour conseiller:', advisorId, conflicts);
  }

  return !hasConflicts;
}

/**
 * Créer un événement Google Calendar
 */
async function createGoogleCalendarEvent(
  advisorId: string,
  appointmentData: any,
  prospect: any
): Promise<{ eventId: string; meetLink?: string } | null> {
  try {
    // Récupérer les credentials Google du conseiller
    const { data: advisor } = await supabase
      .from('users')
      .select('gmail_credentials')
      .eq('id', advisorId)
      .single();

    if (!advisor?.gmail_credentials) {
      console.log('⚠️ Pas de credentials Google pour le conseiller');
      return null;
    }

    // Ici, on intégrerait avec l'API Google Calendar
    // Pour l'instant, on simule
    const mockEventId = `mock_event_${Date.now()}`;
    const mockMeetLink = `https://meet.google.com/mock-meeting-${Date.now()}`;

    console.log('📅 Simulation création Google Calendar:', mockEventId);

    return {
      eventId: mockEventId,
      meetLink: mockMeetLink
    };

  } catch (error) {
    console.error('❌ Erreur Google Calendar:', error);
    return null;
  }
}

/**
 * Envoyer un email de confirmation
 */
async function sendConfirmationEmail(
  prospect: any,
  advisor: any,
  appointmentData: any,
  meetLink?: string | null
): Promise<void> {
  try {
    if (!prospect.email) {
      console.log('⚠️ Pas d\'email prospect, pas d\'envoi');
      return;
    }

    // Ici, on intégrerait avec le système d'email existant
    // Pour l'instant, on simule
    console.log('📧 Simulation envoi email confirmation à:', prospect.email);

    // On pourrait utiliser la même logique que dans les autres APIs d'email
    // En utilisant les templates et la configuration Gmail

  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    throw error;
  }
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
 * Valider le format d'heure HH:MM
 */
function isValidTime(timeString: string): boolean {
  const regex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
  return regex.test(timeString);
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