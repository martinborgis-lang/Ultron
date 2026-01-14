// Types pour le CRM Ultron

export interface PipelineStage {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  color: string;
  position: number;
  is_won: boolean;
  is_lost: boolean;
  default_probability: number;
  created_at: string;
}

export interface CrmProspect {
  id: string;
  organization_id: string;

  // Infos de base
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;

  // Localisation
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string;

  // Données patrimoine
  patrimoine_estime: number | null;
  revenus_annuels: number | null;
  situation_familiale: string | null;
  nb_enfants: number | null;
  age: number | null;
  profession: string | null;

  // Pipeline & Deal
  stage_id: string | null;
  stage_slug: string;
  deal_value: number | null;
  close_probability: number;
  expected_close_date: string | null;

  // Qualification IA
  qualification: 'chaud' | 'tiede' | 'froid' | 'non_qualifie';
  score_ia: number | null;
  analyse_ia: string | null;
  derniere_qualification: string | null;

  // Source & Attribution
  source: string | null;
  source_detail: string | null;
  assigned_to: string | null;

  // Tags & Notes
  tags: string[];
  notes: string | null;

  // Metadata
  lost_reason: string | null;
  won_date: string | null;
  lost_date: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;

  // Relations (pour les jointures)
  stage?: PipelineStage;
  assigned_user?: {
    id: string;
    full_name: string;
    email: string;
  };
  activities_count?: number;
  tasks_count?: number;
}

export interface CrmActivity {
  id: string;
  organization_id: string;
  prospect_id: string;
  user_id: string | null;

  type: 'email' | 'call' | 'meeting' | 'note' | 'task_completed' | 'stage_change' | 'qualification';
  direction: 'inbound' | 'outbound' | null;

  subject: string | null;
  content: string | null;

  // Email tracking
  email_status: 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced' | null;
  email_opened_at: string | null;
  email_opened_count: number;

  // Calls/Meetings
  duration_minutes: number | null;
  outcome: 'positive' | 'neutral' | 'negative' | 'no_answer' | 'voicemail' | null;

  metadata: Record<string, any>;
  created_at: string;

  // Relations
  user?: {
    id: string;
    full_name: string;
  };
}

export interface CrmTask {
  id: string;
  organization_id: string;
  prospect_id: string | null;
  assigned_to: string | null;
  created_by: string | null;

  title: string;
  description: string | null;
  type: 'task' | 'call' | 'email' | 'meeting' | 'follow_up';
  priority: 'low' | 'medium' | 'high' | 'urgent';

  due_date: string | null;
  reminder_at: string | null;
  completed_at: string | null;
  is_completed: boolean;

  created_at: string;

  // Relations
  prospect?: Pick<CrmProspect, 'id' | 'first_name' | 'last_name' | 'company'>;
  assigned_user?: {
    id: string;
    full_name: string;
  };
}

export interface CrmEmailTemplate {
  id: string;
  organization_id: string;
  created_by: string | null;

  name: string;
  subject: string;
  content: string;
  category: 'introduction' | 'follow_up' | 'proposal' | 'closing' | 'other' | null;

  is_shared: boolean;
  usage_count: number;
  is_active: boolean;

  created_at: string;
  updated_at: string;
}

// Types pour les filtres
export interface ProspectFilters {
  search?: string;
  stages?: string[];
  qualifications?: string[];
  assigned_to?: string[];
  tags?: string[];
  date_range?: {
    start: string;
    end: string;
  };
  deal_value_min?: number;
  deal_value_max?: number;
}

// Types pour les stats
export interface PipelineStats {
  stage_slug: string;
  stage_name: string;
  stage_color: string;
  count: number;
  total_value: number;
  weighted_value: number;
}

export interface DashboardStats {
  total_prospects: number;
  prospects_by_stage: PipelineStats[];
  prospects_by_qualification: {
    qualification: string;
    count: number;
  }[];
  total_deal_value: number;
  weighted_forecast: number;
  activities_this_week: number;
  tasks_overdue: number;
  tasks_due_today: number;
}
