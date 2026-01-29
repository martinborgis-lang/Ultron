// Types pour le calculateur de défiscalisation

export interface TaxRules2026 {
  // Barème IR métropole pour revenus 2025 (déclaration 2026)
  income_brackets: {
    rate: number;
    min: number;
    max: number | null;
  }[];

  // Quotient familial
  qf_cap_half_part: number;

  // Décote
  decote_rate: number;
  decote_base_single: number;
  decote_base_couple: number;
  decote_threshold_single: number;
  decote_threshold_couple: number;

  // PFU et prélèvements sociaux
  ps_rate: number;
  pfu_ir_rate: number;
  pfu_total: number;

  // Assurance-vie
  av_abattement_single: number;
  av_abattement_couple: number;
  av_pfu_ir_8y_lt150k: number;

  // Micro-foncier
  micro_foncier_max: number;
  micro_foncier_abatt: number;

  // Déficit foncier
  deficit_foncier_cap: number;

  // PER
  per_max: number;
  per_min: number;
  per_rate: number;

  // Seuil de non-recouvrement
  non_recovery_threshold: number;
}

export type SituationFamiliale = 'CELIB' | 'MARIE_PACSE' | 'DIV_SEP' | 'VEUF' | 'CONCUB';
export type ProductType = 'CTO' | 'PEA' | 'AV' | 'PER' | 'SCPI' | 'MALRAUX' | 'LIVRET_A' | 'PEA_PME';

export interface ProspectProfile {
  // Profil obligatoire pour IR/TMI
  residence_fiscale_fr: boolean;
  situation_famille: SituationFamiliale;
  nb_enfants_charge: number;
  revenu_net_imposable_foyer: number;

  // Optionnels pour affinage
  revenus_brut_salaires?: number;
  parent_isole_case_T?: boolean;

  // Patrimoine existant
  revenus_fonciers_existants?: number;
  revenus_activite_nets?: number;
  plafond_per_disponible?: number;

  // Méta-données
  age?: number;
  profession?: string;
  patrimoine_estime?: number;
  nb_parts_fiscales?: number; // Calculé automatiquement
}

export interface InvestmentProject {
  montant_invest: number;
  horizon_years: number;
  hyp_r: number; // Rendement hypothétique pour générer base taxable

  // Paramètres spécifiques produits
  av_primes_total_estime?: '<150k' | '>=150k';
  scpi_rendement_yield?: number;
  micro_foncier_eligible?: boolean;
  malraux_travaux_eligibles?: number;
  malraux_taux?: 22 | 30;
  malraux_plafond_4ans_restant?: number;
  tmi_sortie_mode?: 'TMI_ACTUEL' | 'TMI_MINUS_1_TRANCHE';

  // Objectif (optionnel pour copywriting)
  objectif?: string;
  liquidite?: string;
}

export interface TaxCalculationResult {
  ir_net: number;
  tmi: number;
  taux_moyen: number;
  parts_fiscales: number;
  quotient_familial: number;
  ir_brut: number;
  ir_apres_qf: number;
  decote: number;
}

export interface ProductTaxResult {
  product_type: ProductType;
  tax_ir: number;
  tax_ps: number;
  tax_total: number;
  conditions: string[];
  warnings: string[];

  // Pour PER
  eco_ir_immediate?: number;
  gain_fiscal_net?: {
    conservateur: number;
    optimiste: number;
  };

  // Pour SCPI
  tax_annuel?: number;

  // Pour Malraux
  reduction_ir?: number;
}

export interface FiscalComparison {
  // Situation actuelle
  current_tax: TaxCalculationResult;

  // Comparaison par produit
  products: ProductTaxResult[];

  // Économies vs CTO de référence
  savings_vs_cto: {
    [key in ProductType]?: number;
  };
}

export interface ChartDataPoint {
  year: number;
  cto_tax: number;
  pea_tax: number;
  av_tax: number;
  per_tax_conservateur: number;
  per_tax_optimiste: number;
  scpi_tax_cumule: number;
}

export interface FiscalSimulationInput {
  prospect_profile: ProspectProfile;
  investment_project: InvestmentProject;
  manual_overrides?: Partial<ProspectProfile>; // Champs saisis manuellement
}

export interface FiscalSimulationOutput {
  input: FiscalSimulationInput;
  fiscal_comparison: FiscalComparison;
  chart_data: ChartDataPoint[];
  missing_fields: string[];
  precision_warnings: string[];
}

// Types pour l'intégration CRM
export interface ProspectForFiscal {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;

  // Données financières existantes
  revenus_annuels?: number;
  patrimoine_estime?: number;
  situation_familiale?: string;
  nb_enfants?: number;
  age?: number;
  profession?: string;

  // Données manquantes à compléter
  missing_fiscal_data?: string[];
}

export interface MissingFieldConfig {
  field_name: string;
  label: string;
  type: 'number' | 'select' | 'boolean' | 'text';
  required: boolean;
  tooltip: string;
  options?: { value: string | number; label: string }[];
  min?: number;
  max?: number;
}

// Validation et contrôles
export interface ValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  completeness_score: number; // 0-100%
}

export interface TaxEngineConfig {
  tax_year: number;
  precision_mode: 'basic' | 'advanced';
  include_pe_scenarios: boolean;
  default_assumptions: {
    hyp_rendement: number;
    malraux_plafond_annuel: number;
    scpi_yield_default: number;
  };
}