// ========================================
// TYPES AGENT IA AUTOMATIQUE VAPI.AI
// ========================================

// Configuration Agent IA par organisation
export interface VoiceConfig {
  id: string;
  organization_id: string;

  // Configuration Vapi.ai
  vapi_api_key: string;
  vapi_phone_number?: string;
  vapi_assistant_id?: string;

  // Configuration Agent IA
  agent_name: string;
  agent_voice: VapiVoice;
  agent_language: string;

  // Horaires d'appel
  working_hours_start: string; // Format "HH:MM"
  working_hours_end: string;
  working_days: number[]; // 1=Lundi, 7=Dimanche
  timezone: string;

  // Scripts et prompts
  system_prompt: string;
  qualification_questions: string[];

  // Configuration comportement
  max_call_duration_seconds: number;
  retry_on_no_answer: boolean;
  max_retry_attempts: number;
  delay_between_retries_minutes: number;

  // Webhook configuration
  webhook_url?: string;
  webhook_secret?: string;

  // État
  is_enabled: boolean;

  created_at: string;
  updated_at: string;
}

// Création/Mise à jour configuration
export interface VoiceConfigInput {
  agent_name?: string;
  agent_voice?: VapiVoice;
  agent_language?: string;
  working_hours_start?: string;
  working_hours_end?: string;
  working_days?: number[];
  timezone?: string;
  system_prompt?: string;
  qualification_questions?: string[];
  max_call_duration_seconds?: number;
  retry_on_no_answer?: boolean;
  max_retry_attempts?: number;
  delay_between_retries_minutes?: number;
  webhook_url?: string;
  webhook_secret?: string;
  is_enabled?: boolean;
}

// Appels téléphoniques
export interface PhoneCall {
  id: string;
  organization_id: string;
  prospect_id?: string;
  user_id?: string;

  // Numéros
  from_number?: string;
  to_number: string;

  // Vapi.ai
  vapi_call_id?: string;
  vapi_assistant_id?: string;

  // État
  status: CallStatus;
  started_at?: string;
  ended_at?: string;
  duration_seconds?: number;

  // Conversation
  transcript_text?: string;
  transcript_json?: VapiTranscript[];

  // Qualification
  qualification_score?: number;
  qualification_result?: QualificationResult;
  qualification_notes?: string;

  // Résultat
  outcome: CallOutcome;
  appointment_date?: string;
  appointment_duration_minutes?: number;
  appointment_notes?: string;

  // Analytics
  cost_cents?: number;
  answered: boolean;
  client_satisfaction_rating?: number;

  // Métadonnées
  source: CallSource;
  campaign_id?: string;
  retry_count: number;
  parent_call_id?: string;

  // Enregistrement
  recording_url?: string;
  recording_duration_seconds?: number;

  // Erreurs
  error_message?: string;
  error_code?: string;

  created_at: string;
  updated_at: string;
}

// Statuts d'appel
export type CallStatus =
  | 'queued'      // En file d'attente
  | 'ringing'     // En cours de sonnerie
  | 'in_progress' // En cours
  | 'completed'   // Terminé
  | 'failed'      // Échoué
  | 'no_answer'   // Pas de réponse
  | 'busy'        // Occupé
  | 'cancelled';  // Annulé

// Résultats d'appel
export type CallOutcome =
  | 'appointment_booked' // RDV pris
  | 'callback_requested' // Rappel demandé
  | 'not_interested'     // Pas intéressé
  | 'wrong_number'       // Mauvais numéro
  | 'unknown';          // Inconnu

// Source d'appel
export type CallSource =
  | 'webhook'    // Depuis webhook formulaire
  | 'manual'     // Appel manuel
  | 'campaign';  // Campagne automatique

// Résultat qualification
export type QualificationResult = 'CHAUD' | 'TIEDE' | 'FROID' | 'NON_QUALIFIE';

// Scripts de conversation
export interface VoiceScript {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  script_type: ScriptType;
  opening_message: string;
  questions?: ScriptQuestion[];
  closing_message?: string;
  max_duration_seconds: number;
  interrupt_sensitive: boolean;
  is_active: boolean;
  version: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type ScriptType =
  | 'qualification'  // Script qualification
  | 'appointment'    // Script prise RDV
  | 'callback'      // Script rappel
  | 'followup';     // Script suivi

export interface ScriptQuestion {
  id: string;
  question: string;
  expected_response_type: 'text' | 'yes_no' | 'choice' | 'number';
  choices?: string[]; // Pour type 'choice'
  required: boolean;
  followup_question?: string;
}

// Webhooks formulaires
export interface VoiceWebhook {
  id: string;
  organization_id: string;
  source: WebhookSource;
  webhook_url?: string;
  prospect_data: Record<string, any>;
  phone_number?: string;
  email?: string;
  name?: string;
  processed: boolean;
  processing_status: ProcessingStatus;
  prospect_created_id?: string;
  call_created_id?: string;
  processing_notes?: string;
  error_message?: string;
  processed_at?: string;
  scheduled_call_at?: string;
  ip_address?: string;
  user_agent?: string;
  referer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  created_at: string;
  updated_at: string;
}

export type WebhookSource =
  | 'contact_form'     // Formulaire de contact
  | 'landing_page'     // Page d'atterrissage
  | 'facebook_lead'    // Lead Facebook
  | 'google_ads'       // Google Ads
  | 'website_chat';    // Chat website

export type ProcessingStatus =
  | 'pending'     // En attente
  | 'processing'  // En cours
  | 'completed'   // Traité
  | 'failed'      // Échec
  | 'skipped';    // Ignoré

// Statistiques quotidiennes
export interface VoiceDailyStats {
  id: string;
  organization_id: string;
  date: string;
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  no_answer_calls: number;
  appointments_booked: number;
  qualified_prospects: number;
  total_duration_minutes: number;
  total_cost_cents: number;
  average_cost_per_call_cents: number;
  average_qualification_score?: number;
  average_satisfaction_rating?: number;
  created_at: string;
}

// ========================================
// TYPES VAPI.AI API
// ========================================

// Voix disponibles Vapi
export type VapiVoice =
  | 'jennifer'      // Voix féminine naturelle
  | 'alex'          // Voix masculine claire
  | 'sarah'         // Voix féminine professionnelle
  | 'mike'          // Voix masculine chaleureuse
  | 'emma'          // Voix féminine jeune
  | 'john'          // Voix masculine autoritaire
  | 'lisa'          // Voix féminine douce
  | 'david';        // Voix masculine mature

// Configuration assistant Vapi
export interface VapiAssistant {
  id?: string;
  name: string;
  voice: VapiVoice;
  language: string;
  systemPrompt: string;
  functions?: VapiFunction[];
  firstMessage?: string;
  endCallMessage?: string;
  maxDuration?: number;
  responseDelaySeconds?: number;
  llmRequestDelaySeconds?: number;
  interruptSensitive?: boolean;
}

// Fonctions Vapi pour l'assistant
export interface VapiFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

// Requête création appel Vapi
export interface VapiCallRequest {
  phoneNumber: string;
  assistantId?: string;
  assistant?: VapiAssistant;
  phoneNumberId?: string;
  name?: string;
  metadata?: Record<string, any>;
}

// Réponse appel Vapi
export interface VapiCallResponse {
  id: string;
  phoneNumber: string;
  status: VapiCallStatus;
  assistantId: string;
  startedAt?: string;
  endedAt?: string;
  cost?: number;
  transcript?: VapiTranscript[];
  recordingUrl?: string;
  metadata?: Record<string, any>;
}

// Statut appel Vapi
export type VapiCallStatus =
  | 'queued'
  | 'ringing'
  | 'in-progress'
  | 'forwarding'
  | 'ended';

// Segment de transcription
export interface VapiTranscript {
  role: 'user' | 'assistant' | 'function';
  content: string;
  timestamp: number;
  duration?: number;
  functionCall?: VapiFunctionCall;
}

// Appel de fonction dans la transcription
export interface VapiFunctionCall {
  name: string;
  arguments: Record<string, any>;
  result?: any;
}

// Events webhook Vapi
export interface VapiWebhookEvent {
  type: VapiEventType;
  call: VapiCallResponse;
  timestamp: number;
  metadata?: Record<string, any>;
}

export type VapiEventType =
  | 'call-started'
  | 'call-ended'
  | 'transcript-updated'
  | 'function-called'
  | 'recording-available';

// ========================================
// TYPES REQUÊTES API AGENT IA
// ========================================

// Créer un appel manuel
export interface CreateCallRequest {
  prospect_id?: string;
  phone_number: string;
  script_type?: ScriptType;
  priority?: 'low' | 'normal' | 'high';
  scheduled_at?: string;
  metadata?: Record<string, any>;
}

// Traiter webhook formulaire
export interface ProcessWebhookRequest {
  source: WebhookSource;
  prospect_data: Record<string, any>;
  utm_params?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
  metadata?: Record<string, any>;
}

// Créneaux disponibles pour RDV
export interface AvailableSlot {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration_minutes: number;
  advisor_id?: string;
  advisor_name?: string;
}

// Requête créneaux disponibles
export interface AvailableSlotsRequest {
  start_date?: string; // YYYY-MM-DD (défaut: aujourd'hui)
  end_date?: string;   // YYYY-MM-DD (défaut: +7 jours)
  duration_minutes?: number; // Durée RDV (défaut: 60)
  advisor_id?: string; // Conseiller spécifique
}

// Réserver un RDV
export interface BookAppointmentRequest {
  prospect_id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration_minutes: number;
  advisor_id?: string;
  notes?: string;
  call_id?: string; // ID appel qui a généré le RDV
}

// Réponse réservation RDV
export interface BookAppointmentResponse {
  success: boolean;
  appointment_id?: string;
  calendar_event_id?: string;
  meet_link?: string;
  confirmation_email_sent?: boolean;
  error_message?: string;
}

// ========================================
// TYPES DASHBOARD
// ========================================

// Statistiques dashboard Agent IA
export interface VoiceDashboardStats {
  today: {
    calls_made: number;
    appointments_booked: number;
    qualification_rate: number; // % prospects qualifiés
    answer_rate: number; // % réponse
    cost_total: number; // Coût total euros
  };
  this_week: {
    calls_made: number;
    appointments_booked: number;
    qualified_prospects: number;
    average_call_duration: number; // minutes
    conversion_rate: number; // % RDV pris
  };
  this_month: {
    calls_made: number;
    appointments_booked: number;
    total_cost: number;
    roi_percentage: number; // ROI calculé
    top_performing_script?: string;
  };
}

// Appels récents pour dashboard
export interface RecentCall {
  id: string;
  prospect_name?: string;
  phone_number: string;
  status: CallStatus;
  outcome: CallOutcome;
  duration_minutes?: number;
  qualification_result?: QualificationResult;
  qualification_score?: number;
  appointment_booked: boolean;
  created_at: string;
}

// Configuration dashboard
export interface VoiceDashboardConfig {
  auto_refresh_interval: number; // secondes
  show_cost_details: boolean;
  show_recordings: boolean;
  default_date_range: 'today' | 'week' | 'month';
  notifications_enabled: boolean;
}

// ========================================
// TYPES ERRORS & VALIDATION
// ========================================

// Erreurs spécifiques Agent IA
export interface VoiceError {
  code: VoiceErrorCode;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export type VoiceErrorCode =
  | 'VAPI_API_ERROR'           // Erreur API Vapi
  | 'INVALID_PHONE_NUMBER'     // Numéro invalide
  | 'OUTSIDE_WORKING_HOURS'    // Hors horaires
  | 'DAILY_LIMIT_EXCEEDED'     // Limite quotidienne
  | 'PROSPECT_NOT_FOUND'       // Prospect introuvable
  | 'ASSISTANT_NOT_CONFIGURED' // Assistant non configuré
  | 'INSUFFICIENT_FUNDS'       // Fonds insuffisants Vapi
  | 'WEBHOOK_VALIDATION_FAILED'// Validation webhook
  | 'CALENDAR_CONFLICT'        // Conflit calendrier
  | 'SCRIPT_NOT_FOUND';        // Script introuvable

// Validation numéro de téléphone
export interface PhoneValidation {
  is_valid: boolean;
  formatted_number: string;
  country_code: string;
  national_number: string;
  type: 'mobile' | 'landline' | 'unknown';
  carrier?: string;
  error_message?: string;
}

// ========================================
// TYPES UTILITAIRES
// ========================================

// Pagination
export interface VoicePagination<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

// Filtres recherche
export interface VoiceFilters {
  status?: CallStatus[];
  outcome?: CallOutcome[];
  date_from?: string;
  date_to?: string;
  prospect_id?: string;
  advisor_id?: string;
  source?: CallSource[];
  qualification_result?: QualificationResult[];
  has_recording?: boolean;
  min_duration?: number;
  max_duration?: number;
}

// Options tri
export interface VoiceSortOptions {
  field: 'created_at' | 'duration_seconds' | 'qualification_score' | 'cost_cents';
  direction: 'asc' | 'desc';
}

// Réponse API standard
export interface VoiceApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: VoiceError;
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    processing_time?: number;
  };
}

// Export types principaux
export type {
  VoiceConfig,
  VoiceConfigInput,
  PhoneCall,
  VoiceScript,
  VoiceWebhook,
  VoiceDailyStats,
  VapiAssistant,
  VapiCallRequest,
  VapiCallResponse,
  VapiWebhookEvent,
  VoiceDashboardStats,
  CreateCallRequest,
  ProcessWebhookRequest,
  AvailableSlot,
  BookAppointmentRequest,
  BookAppointmentResponse
};