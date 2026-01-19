export interface Organization {
  id: string;
  name: string;
  slug: string;
  google_sheet_id: string | null;
  google_credentials: Record<string, unknown> | null;
  logo_url: string | null;
  primary_color: string;
  plan: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  auth_id: string;
  organization_id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'conseiller';
  gmail_credentials: Record<string, unknown> | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Prompt {
  id: string;
  organization_id: string;
  type: string;
  name: string;
  system_prompt: string | null;
  user_prompt: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyStat {
  id: string;
  organization_id: string;
  date: string;
  total_prospects: number;
  prospects_chaud: number;
  prospects_tiede: number;
  prospects_froid: number;
  mails_envoyes: number;
  rdv_pris: number;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  organization_id: string;
  user_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface Prospect {
  id: number;
  nom: string;
  prenom: string;
  qualification: 'CHAUD' | 'TIEDE' | 'FROID' | 'NON_QUALIFIE' | '';
  score: number;
  statut: string;
}

export interface Activity {
  id: number;
  action: string;
  target: string;
  time: string;
}

export interface ChartDataPoint {
  date: string;
  chauds: number;
  tiedes: number;
  froids: number;
}
