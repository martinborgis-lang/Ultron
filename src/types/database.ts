/**
 * Types pour les enregistrements de base de données
 */

// Type de base pour tous les enregistrements de base de données
export interface DatabaseRecord {
  id: string;
  created_at: string;
  updated_at?: string;
}

// Type pour les enregistrements d'événements de planning depuis la DB
export interface PlanningEventDbRecord extends DatabaseRecord {
  organization_id: string;
  prospect_id?: string;
  prospect_sheet_id?: string;
  prospect_name?: string;
  type: 'task' | 'call' | 'meeting' | 'reminder' | 'email';
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  due_date?: string;
  all_day: boolean;
  status: 'pending' | 'completed' | 'cancelled';
  completed_at?: string;
  assigned_to?: string;
  created_by?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  external_id?: string;
  external_source?: string;
  metadata?: {
    meet_link?: string;
    calendar_html_link?: string;
    [key: string]: unknown;
  };
  // Relations possibles
  prospect?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  assignedUser?: {
    id: string;
    full_name: string;
    email: string;
  };
}

// Type pour les prospects CRM depuis la DB
export interface CrmProspectDbRecord extends DatabaseRecord {
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  job_title?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country: string;
  patrimoine_estime?: number;
  revenus_annuels?: number;
  situation_familiale?: string;
  nb_enfants?: number;
  age?: number;
  profession?: string;
  stage_id?: string;
  stage_slug: string;
  deal_value?: number;
  close_probability: number;
  expected_close_date?: string;
  qualification: 'CHAUD' | 'TIEDE' | 'FROID' | 'NON_QUALIFIE';
  score_ia?: number;
  analyse_ia?: string;
  derniere_qualification?: string;
  source?: string;
  source_detail?: string;
  assigned_to?: string;
  tags?: string[];
  notes?: string;
  lost_reason?: string;
  won_date?: string;
  lost_date?: string;
  last_activity_at?: string;
  // Relations possibles
  stage?: {
    id: string;
    name: string;
    slug: string;
    color: string;
    position: number;
  };
  assignedUser?: {
    id: string;
    full_name: string;
    email: string;
  };
}

// Type générique pour les responses de bases de données avec relations
export interface DatabaseResponse<T = unknown> {
  data: T[] | null;
  error: {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
  } | null;
  count?: number;
  status: number;
  statusText: string;
}

export type DatabaseRow = Record<string, unknown>;
export type DatabaseUpdate = Record<string, unknown>;
export type DatabaseInsert = Record<string, unknown>;