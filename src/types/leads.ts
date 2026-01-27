// ======================================
// ULTRON - Lead Finder Types
// ======================================

export interface LeadCredits {
  id: string;
  organization_id: string;
  credits_total: number;
  credits_used: number;
  last_purchase_date?: string;
  last_usage_date?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadSearch {
  id: string;
  organization_id: string;
  user_id: string;
  search_type: 'particulier' | 'entreprise';
  profession: string;
  location?: string;
  postal_code?: string;
  leads_requested: number;
  leads_found: number;
  credits_consumed: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  search_duration_ms?: number;
  api_source?: string;
  api_response_raw?: Record<string, unknown>;
  started_at: string;
  completed_at?: string;
  created_at: string;
}

export interface LeadResult {
  id: string;
  search_id: string;
  organization_id: string;
  name?: string;
  company_name?: string;
  profession?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  source: string;
  confidence_score?: number;
  raw_data?: Record<string, unknown>;
  imported_to_crm: boolean;
  prospect_id?: string;
  imported_at?: string;
  imported_by?: string;
  is_valid: boolean;
  quality_score?: number;
  validation_notes?: string;
  created_at: string;
}

export interface LeadStats {
  id: string;
  organization_id: string;
  date: string;
  searches_performed: number;
  leads_found: number;
  credits_consumed: number;
  leads_imported: number;
  import_rate: number;
  avg_quality_score: number;
  entreprise_searches: number;
  particulier_searches: number;
  outscraper_calls: number;
  google_places_calls: number;
  demo_calls: number;
  created_at: string;
  updated_at: string;
}

// ======================================
// API Request/Response Types
// ======================================

export interface LeadSearchRequest {
  type: 'particulier' | 'entreprise';
  profession: string;
  location?: string;
  postalCode?: string;
  count: number;
}

export interface LeadSearchResponse {
  search_id: string;
  leads: LeadResult[];
  creditsUsed: number;
  creditsRemaining: number;
  searchDuration?: number;
}

export interface LeadCreditsResponse {
  total: number;
  used: number;
  available: number;
  last_purchase_date?: string;
  last_usage_date?: string;
}

export interface LeadImportRequest {
  leadIds: string[];
}

export interface LeadImportResponse {
  imported: number;
  prospects: Record<string, unknown>[]; // Will use CrmProspect type when imported
  failed?: string[];
}

// ======================================
// UI Component Types
// ======================================

export interface LeadFinderFilters {
  searchType: 'particulier' | 'entreprise';
  profession: string;
  location: string;
  postalCode: string;
  leadsCount: string;
}

export interface LeadFinderState {
  loading: boolean;
  results: LeadResult[];
  selectedLeads: Set<string>;
  creditsBalance: number | null;
  filters: LeadFinderFilters;
}

// ======================================
// External API Types
// ======================================

export interface OutscraperPlace {
  name: string;
  full_address: string;
  postal_code?: string;
  city?: string;
  phone?: string;
  email?: string;
  site?: string;
  rating?: number;
  reviews_count?: number;
  category?: string;
  place_id?: string;
  latitude?: number;
  longitude?: number;
  [key: string]: unknown;
}

export interface GooglePlace {
  name: string;
  formatted_address: string;
  place_id: string;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  [key: string]: unknown;
}

export interface OutscraperResponse {
  data: OutscraperPlace[][];
  status: string;
  request_id?: string;
}

export interface GooglePlacesResponse {
  results: GooglePlace[];
  status: string;
  next_page_token?: string;
}

// ======================================
// Configuration Types
// ======================================

export interface LeadScrapingConfig {
  outscraper_api_key?: string;
  google_places_api_key?: string;
  hunter_api_key?: string;
  default_credits_per_organization: number;
  max_leads_per_search: number;
  rate_limit_per_hour: number;
  demo_mode: boolean;
}

// ======================================
// Utility Types
// ======================================

export type LeadSource = 'outscraper' | 'google_places' | 'hunter' | 'demo' | 'manual';
export type SearchStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type LeadQuality = 'high' | 'medium' | 'low' | 'invalid';

export interface LeadValidationResult {
  isValid: boolean;
  quality: LeadQuality;
  score: number;
  issues: string[];
  suggestions?: string[];
}

// ======================================
// Dashboard/Analytics Types
// ======================================

export interface LeadMetrics {
  totalSearches: number;
  totalLeads: number;
  totalImported: number;
  importRate: number;
  avgQualityScore: number;
  creditsUsed: number;
  creditsRemaining: number;
  topProfessions: Array<{
    profession: string;
    count: number;
    avg_quality: number;
  }>;
  dailyUsage: Array<{
    date: string;
    searches: number;
    leads: number;
    credits: number;
  }>;
}

export interface ProfessionStats {
  profession: string;
  total_searches: number;
  total_leads: number;
  avg_quality_score: number;
  import_rate: number;
  last_search: string;
}

// ======================================
// Error Types
// ======================================

export interface LeadError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export class LeadScrapingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'LeadScrapingError';
  }
}

// ======================================
// Constants
// ======================================

export const LEAD_SEARCH_TYPES = ['particulier', 'entreprise'] as const;

export const LEAD_SOURCES = [
  'outscraper',
  'google_places',
  'hunter',
  'demo',
  'manual'
] as const;

export const SEARCH_STATUSES = [
  'pending',
  'processing',
  'completed',
  'failed'
] as const;

export const PROFESSION_CATEGORIES = [
  // Professions libérales
  'Médecin', 'Dentiste', 'Avocat', 'Notaire', 'Pharmacien', 'Vétérinaire',
  'Architecte', 'Expert-comptable', 'Kinésithérapeute', 'Psychologue',

  // Artisans
  'Plombier', 'Électricien', 'Maçon', 'Menuisier', 'Peintre', 'Couvreur',
  'Chauffagiste', 'Carreleur', 'Serrurier', 'Jardinage',

  // Commerce
  'Restaurant', 'Boulangerie', 'Boucherie', 'Salon de coiffure',
  'Institut de beauté', 'Magasin de vêtements', 'Garage automobile',

  // Services
  'Agent immobilier', 'Consultant', 'Coach', 'Formation',
  'Agence communication', 'Développeur web', 'Designer graphique'
] as const;

export const DEFAULT_LEAD_CONFIG: LeadScrapingConfig = {
  default_credits_per_organization: 10,
  max_leads_per_search: 100,
  rate_limit_per_hour: 50,
  demo_mode: true,
};