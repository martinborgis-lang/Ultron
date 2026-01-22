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

  metadata: Record<string, unknown>;
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

// Types pour les stats administrateur
export interface AdvisorStats {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;

  // RDV et activité
  rdv_scheduled_count: number;
  rdv_completed_count: number;
  rdv_no_show_count: number;

  // Pipeline et négociation
  prospects_in_negotiation: number;
  total_deal_value: number;
  weighted_forecast: number;

  // Taux de conversion
  conversion_rate_first_rdv: number;    // % prospects qui passent du contact au 1er RDV
  conversion_rate_proposal: number;     // % qui passent du 1er RDV à la proposition
  conversion_rate_closing: number;      // % qui passent de la proposition au closing
  conversion_rate_overall: number;      // % RDV → Deals signés (métrique principale)

  // Métriques informatives de conversion
  conversion_calls_to_rdv: number;      // % appels → RDV (informatif)
  conversion_calls_to_deals: number;    // % appels → Deals (informatif)
  calls_made_total: number;             // Total d'appels effectués (transitions de stage + activités)

  // Activité
  calls_made: number;
  emails_sent: number;
  meetings_held: number;
  tasks_completed: number;

  // Performance temporelle
  average_response_time: number;        // En heures
  active_days: number;                  // Jours actifs dans la période

  created_prospects: number;
  qualified_prospects: number;
  won_deals: number;
  lost_deals: number;

  // Évolution (comparaison avec période précédente)
  rdv_growth: number;                   // % d'évolution
  conversion_growth: number;
  revenue_growth: number;
}

export interface AdminDashboardStats {
  // Vue d'ensemble du cabinet
  total_advisors: number;
  active_advisors: number;
  total_prospects: number;
  total_revenue: number;

  // Performance globale
  average_conversion_rate: number;
  total_rdv_scheduled: number;
  total_rdv_completed: number;
  total_deals_won: number;
  total_deals_lost: number;

  // Répartition des prospects par conseiller
  prospects_by_advisor: {
    advisor_id: string;
    advisor_name: string;
    count: number;
    percentage: number;
  }[];

  // Répartition du CA par conseiller
  revenue_by_advisor: {
    advisor_id: string;
    advisor_name: string;
    revenue: number;
    percentage: number;
  }[];

  // Stats par période (comparaison)
  period_comparison: {
    rdv_growth: number;
    conversion_growth: number;
    revenue_growth: number;
    prospects_growth: number;
  };

  // Top performers
  top_performers: {
    by_rdv: AdvisorStats;
    by_conversion: AdvisorStats;
    by_revenue: AdvisorStats;
  };

  // Alertes et insights
  alerts: {
    type: 'low_conversion' | 'inactive_advisor' | 'missed_rdv' | 'overdue_tasks';
    advisor_id?: string;
    advisor_name?: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }[];
}

export interface AdminFilters {
  period: '7d' | '30d' | '90d' | '6m' | '1y' | 'custom';
  start_date?: string;
  end_date?: string;
  advisor_ids?: string[];
  compare_with_previous?: boolean;
}

// Types pour les graphiques avancés
export interface AdvisorPerformanceChart {
  advisor_id: string;
  advisor_name: string;
  data: {
    date: string;
    rdv_count: number;
    deals_closed: number;
    conversion_rate: number;
    revenue: number;
  }[];
}

export interface ConversionFunnelData {
  advisor_id: string;
  advisor_name: string;
  stages: {
    stage: 'contact' | 'first_rdv' | 'proposal' | 'negotiation' | 'closed_won';
    stage_name: string;
    count: number;
    conversion_rate: number;
  }[];
}

export interface ActivityHeatmapData {
  advisor_id: string;
  advisor_name: string;
  daily_activity: {
    date: string;
    calls: number;
    emails: number;
    meetings: number;
    total_score: number;
  }[];
}
