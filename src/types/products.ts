// Types pour le système de produits et commissions

export interface Product {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  type: 'fixed' | 'commission'; // fixe ou commission

  // Pour produits à bénéfice fixe
  fixed_value?: number;

  // Pour produits à commission
  commission_rate?: number;

  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AdvisorCommission {
  id: string;
  organization_id: string;
  user_id: string;
  product_id?: string; // NULL = commission par défaut
  commission_rate: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;

  // Relations
  product?: Product;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface DealProduct {
  id: string;
  organization_id: string;
  prospect_id: string;
  product_id: string;
  advisor_id: string;

  // Montants
  client_amount: number; // Montant client
  company_revenue: number; // CA entreprise
  advisor_commission: number; // Commission conseiller

  // Taux utilisés
  commission_rate_used?: number;
  advisor_commission_rate?: number;

  closed_at: string;
  notes?: string;
  created_at: string;

  // Relations
  product?: Product;
  prospect?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  advisor?: {
    id: string;
    full_name: string;
    email: string;
  };
}

// Types pour les formulaires
export interface ProductForm {
  name: string;
  description: string;
  type: 'fixed' | 'commission';
  fixed_value?: number;
  commission_rate?: number;
}

export interface DealProductForm {
  product_id: string;
  client_amount: number;
  notes?: string;
}

export interface AdvisorCommissionForm {
  user_id: string;
  product_id?: string;
  commission_rate: number;
  is_default: boolean;
}

// Types pour les statistiques
export interface ProductStats {
  product_id: string;
  product_name: string;
  product_type: 'fixed' | 'commission';
  deals_count: number;
  total_client_amount: number;
  total_company_revenue: number;
  total_advisor_commissions: number;
  average_deal_size: number;
}

export interface AdvisorRevenueStats {
  advisor_id: string;
  advisor_name: string;
  deals_count: number;
  total_company_revenue: number; // CA généré pour l'entreprise
  total_commissions_earned: number; // Commissions gagnées
  commission_percentage: number; // % moyen de commission
  products_breakdown: {
    product_name: string;
    deals_count: number;
    revenue: number;
    commissions: number;
  }[];
}

export interface RevenueBreakdown {
  total_company_revenue: number;
  total_advisor_commissions: number;
  net_profit: number; // Revenue - Commissions
  profit_margin: number; // % de marge

  by_product: ProductStats[];
  by_advisor: AdvisorRevenueStats[];
  by_period: {
    date: string;
    revenue: number;
    commissions: number;
    deals_count: number;
  }[];
}

// Suppression des catégories prédéfinies - chaque organisation crée ses propres produits