import {
  ProductType,
  ProspectProfile,
  InvestmentProject,
  ProductTaxResult,
  TaxCalculationResult,
} from '@/types/fiscalite';
import taxRules from '@/lib/tax_rules_2026.json';

export class ProductTaxEngine {
  /**
   * Calcule la fiscalité d'un produit donné
   */
  public calculateProductTax(
    product: ProductType,
    profile: ProspectProfile,
    investment: InvestmentProject,
    current_tax: TaxCalculationResult
  ): ProductTaxResult {
    const V = investment.montant_invest;
    const n = investment.horizon_years;
    const r = investment.hyp_r;

    // Valeur future et gains hypothétiques
    const FV = V * Math.pow(1 + r, n);
    const G = FV - V;

    switch (product) {
      case 'CTO':
        return this.calculateCTOTax(G);

      case 'PEA':
        return this.calculatePEATax(G, n);

      case 'AV':
        return this.calculateAVTax(G, n, profile.situation_famille, investment.av_primes_total_estime);

      case 'PER':
        return this.calculatePERTax(V, G, profile, investment, current_tax.tmi / 100);

      case 'SCPI':
        return this.calculateSCPITax(
          V,
          n,
          profile,
          investment.scpi_rendement_yield || taxRules.default_assumptions.scpi_yield_default,
          current_tax.tmi / 100
        );

      case 'MALRAUX':
        return this.calculateMalrauxTax(investment, current_tax.tmi / 100);

      case 'LIVRET_A':
        return this.calculateLivretATax();

      case 'PEA_PME':
        return this.calculatePEAPMETax(G, n);

      default:
        throw new Error(`Produit non supporté: ${product}`);
    }
  }

  /**
   * CTO - Compte-Titres Ordinaire (référence)
   */
  private calculateCTOTax(gains: number): ProductTaxResult {
    const tax_ir = gains * taxRules.pfu_and_ps.pfu_ir_rate;
    const tax_ps = gains * taxRules.pfu_and_ps.ps_rate;
    const tax_total = gains * taxRules.pfu_and_ps.pfu_total;

    return {
      product_type: 'CTO',
      tax_ir,
      tax_ps,
      tax_total,
      conditions: ['PFU 30% (12,8% IR + 17,2% PS)'],
      warnings: [],
    };
  }

  /**
   * PEA - Plan d'Épargne en Actions
   */
  private calculatePEATax(gains: number, horizon: number): ProductTaxResult {
    const warnings: string[] = [];
    let tax_ir = 0;
    let tax_ps = gains * taxRules.pfu_and_ps.ps_rate;
    const conditions: string[] = [];

    if (horizon >= 5) {
      // Exonération IR après 5 ans
      tax_ir = 0;
      conditions.push('Exonération IR après 5 ans');
      conditions.push('PS 17,2% uniquement');
    } else {
      // Avant 5 ans : fiscalité complexe
      tax_ir = gains * taxRules.pfu_and_ps.pfu_ir_rate; // Approximation PFU
      warnings.push('Retrait avant 5 ans : fiscalité défavorable (PFU ou barème + exceptions)');
      conditions.push('Avant 5 ans : PFU 30% approximatif');
    }

    return {
      product_type: 'PEA',
      tax_ir,
      tax_ps,
      tax_total: tax_ir + tax_ps,
      conditions,
      warnings,
    };
  }

  /**
   * Assurance-Vie
   */
  private calculateAVTax(
    gains: number,
    horizon: number,
    situation: string,
    primes_level?: '<150k' | '>=150k'
  ): ProductTaxResult {
    const warnings: string[] = [];
    const conditions: string[] = [];

    // PS toujours 17,2%
    const tax_ps = gains * taxRules.pfu_and_ps.ps_rate;

    let tax_ir = 0;

    if (horizon < 8) {
      // Avant 8 ans : PFU IR 12,8%
      tax_ir = gains * taxRules.pfu_and_ps.pfu_ir_rate;
      conditions.push('Avant 8 ans : PFU 12,8%');
    } else {
      // Après 8 ans : abattement + taux réduit
      const isCouple = situation === 'MARIE_PACSE';
      const abattement = isCouple
        ? taxRules.assurance_vie.av_abattement_couple
        : taxRules.assurance_vie.av_abattement_single;

      const gains_taxable = Math.max(0, gains - abattement);

      if (primes_level === '<150k') {
        tax_ir = gains_taxable * taxRules.assurance_vie.av_pfu_ir_8y_lt150k;
        conditions.push(`Après 8 ans : abattement ${abattement}€, taux 7,5%`);
      } else if (primes_level === '>=150k') {
        tax_ir = gains_taxable * taxRules.assurance_vie.av_pfu_ir_8y_gte150k;
        conditions.push(`Après 8 ans : abattement ${abattement}€, taux 12,8% (primes ≥150k)`);
        warnings.push('Calcul approximatif - fraction exacte primes <150k à préciser');
      } else {
        // Approximation conservatrice
        tax_ir = gains_taxable * taxRules.assurance_vie.av_pfu_ir_8y_gte150k;
        warnings.push('Primes totales inconnues - approximation conservatrice 12,8%');
        conditions.push(`Après 8 ans : abattement ${abattement}€, taux à préciser`);
      }
    }

    return {
      product_type: 'AV',
      tax_ir,
      tax_ps,
      tax_total: tax_ir + tax_ps,
      conditions,
      warnings,
    };
  }

  /**
   * PER - Plan d'Épargne Retraite
   */
  private calculatePERTax(
    versement: number,
    gains: number,
    profile: ProspectProfile,
    investment: InvestmentProject,
    tmi: number
  ): ProductTaxResult {
    const warnings: string[] = [];
    const conditions: string[] = [];

    // Calcul du plafond déductible
    let plafond_deductible: number;
    if (profile.plafond_per_disponible) {
      plafond_deductible = profile.plafond_per_disponible;
      conditions.push('Plafond exact (avis d\'impôt)');
    } else if (profile.revenus_activite_nets) {
      plafond_deductible = Math.max(
        taxRules.per.per_min,
        Math.min(taxRules.per.per_max, taxRules.per.per_rate * profile.revenus_activite_nets)
      );
      conditions.push('Plafond estimé (salarié)');
    } else {
      plafond_deductible = taxRules.per.per_min;
      warnings.push('Revenus d\'activité manquants - plafond minimal utilisé');
    }

    const versement_deductible = Math.min(versement, plafond_deductible);

    // Économie IR immédiate
    const eco_ir_immediate = versement_deductible * tmi;

    // Fiscalité à la sortie (fourchette)
    const tmi_conservateur = tmi;
    const tmi_optimiste = this.calculateOptimisticTMI(tmi);

    // Approximation : taxe sur versements déduits
    const ir_sortie_conservateur = versement_deductible * tmi_conservateur;
    const ir_sortie_optimiste = versement_deductible * tmi_optimiste;

    // PS sur gains
    const ps_sortie_gains = gains * taxRules.pfu_and_ps.ps_rate;

    const tax_total_conservateur = ir_sortie_conservateur + ps_sortie_gains;
    const tax_total_optimiste = ir_sortie_optimiste + ps_sortie_gains;

    const gain_fiscal_net_conservateur = eco_ir_immediate - ir_sortie_conservateur;
    const gain_fiscal_net_optimiste = eco_ir_immediate - ir_sortie_optimiste;

    conditions.push(`Plafond déductible: ${Math.round(plafond_deductible)}€`);
    conditions.push('Fiscalité sortie: fourchette TMI actuel/réduit');
    warnings.push('+ avantage différé d\'impôt non quantifié');

    return {
      product_type: 'PER',
      tax_ir: (ir_sortie_conservateur + ir_sortie_optimiste) / 2, // Moyenne
      tax_ps: ps_sortie_gains,
      tax_total: (tax_total_conservateur + tax_total_optimiste) / 2,
      conditions,
      warnings,
      eco_ir_immediate,
      plafond_per_calcule: plafond_deductible,
      gain_fiscal_net: {
        conservateur: gain_fiscal_net_conservateur,
        optimiste: gain_fiscal_net_optimiste,
      },
    };
  }

  /**
   * SCPI - Société Civile de Placement Immobilier
   */
  private calculateSCPITax(
    investissement: number,
    horizon: number,
    profile: ProspectProfile,
    rendement_yield: number,
    tmi: number
  ): ProductTaxResult {
    const warnings: string[] = [];
    const conditions: string[] = [];

    const revenus_annuels = investissement * rendement_yield;

    // Vérification micro-foncier
    const revenus_fonciers_totaux =
      (profile.revenus_fonciers_existants || 0) + revenus_annuels;

    const micro_eligible = revenus_fonciers_totaux <= taxRules.micro_foncier.micro_foncier_max;

    let revenus_imposables: number;
    if (micro_eligible) {
      revenus_imposables = revenus_annuels * (1 - taxRules.micro_foncier.micro_foncier_abatt);
      conditions.push(`Micro-foncier : abattement ${taxRules.micro_foncier.micro_foncier_abatt * 100}%`);
    } else {
      revenus_imposables = revenus_annuels;
      warnings.push('Régime réel supposé - charges déductibles à affiner en RDV');
      conditions.push('Régime réel (charges au réel)');
    }

    // Impôt annuel
    const ir_annuel = revenus_imposables * tmi;
    const ps_annuel = revenus_imposables * taxRules.pfu_and_ps.ps_rate;
    const tax_annuel = ir_annuel + ps_annuel;

    // Sur la période
    const tax_cumule = tax_annuel * horizon;

    conditions.push(`Rendement distribué : ${rendement_yield * 100}%`);
    conditions.push('Fiscalité sur revenus distribués uniquement');

    return {
      product_type: 'SCPI',
      tax_ir: ir_annuel * horizon,
      tax_ps: ps_annuel * horizon,
      tax_total: tax_cumule,
      tax_annuel,
      conditions,
      warnings,
    };
  }

  /**
   * Malraux - Réduction d'impôt
   */
  private calculateMalrauxTax(investment: InvestmentProject, tmi: number): ProductTaxResult {
    const warnings: string[] = [];
    const conditions: string[] = [];

    if (!investment.malraux_travaux_eligibles) {
      throw new Error('Montant travaux Malraux requis');
    }

    const taux = investment.malraux_taux === 30 ? 0.30 : 0.22;
    const plafond_restant = investment.malraux_plafond_4ans_restant ||
                           taxRules.malraux.malraux_plafond_annuel;

    const base_eligible = Math.min(investment.malraux_travaux_eligibles, plafond_restant);
    const reduction_ir = base_eligible * taux;

    conditions.push(`Taux de réduction : ${taux * 100}%`);
    conditions.push(`Plafond 4 ans : ${taxRules.malraux.malraux_plafond_4ans}€`);
    warnings.push(`Plafonnement niches fiscales : ${taxRules.niches_fiscales.plafond_global_10k}€ (sauf exceptions)`);
    warnings.push('Conditions strictes monuments historiques/ZPPAUP');

    return {
      product_type: 'MALRAUX',
      tax_ir: -reduction_ir, // Réduction = économie
      tax_ps: 0,
      tax_total: -reduction_ir,
      reduction_ir,
      conditions,
      warnings,
    };
  }

  /**
   * Livret A - Exonération totale
   */
  private calculateLivretATax(): ProductTaxResult {
    return {
      product_type: 'LIVRET_A',
      tax_ir: 0,
      tax_ps: 0,
      tax_total: 0,
      conditions: ['Exonération IR + PS totale'],
      warnings: ['Rendement plafonné - pas un produit CGP premium'],
    };
  }

  /**
   * PEA-PME - Fiscalité identique au PEA
   */
  private calculatePEAPMETax(gains: number, horizon: number): ProductTaxResult {
    const result = this.calculatePEATax(gains, horizon);
    result.product_type = 'PEA_PME';
    result.conditions.push('Fiscalité identique PEA');
    result.warnings.push('Utile si PEA principal plafond atteint');

    return result;
  }

  /**
   * Calcule un TMI optimiste pour le PER (sortie à la retraite)
   */
  private calculateOptimisticTMI(current_tmi: number): number {
    // Hypothèse : baisse d'une tranche à la retraite
    const brackets = taxRules.income_brackets.map(b => b.rate);
    const current_index = brackets.findIndex(rate => rate >= current_tmi);

    if (current_index > 0) {
      return brackets[current_index - 1];
    }

    return Math.max(0, current_tmi - 0.11); // Au minimum -11%
  }

  /**
   * Calcule l'économie fiscale vs CTO de référence
   */
  public calculateSavingsVsCTO(
    product_result: ProductTaxResult,
    cto_tax: number
  ): number {
    return cto_tax - product_result.tax_total;
  }

  /**
   * Génère des warnings automatiques selon le contexte
   */
  public generateContextWarnings(
    product: ProductType,
    profile: ProspectProfile,
    investment: InvestmentProject,
    current_tax: TaxCalculationResult
  ): string[] {
    const warnings: string[] = [];

    // TMI = 0 → PER peu intéressant
    if (current_tax.tmi === 0 && product === 'PER') {
      warnings.push('TMI nul : gain IR immédiat PER faible');
    }

    // Horizon < 5 ans → PEA défavorable
    if (investment.horizon_years < 5 && ['PEA', 'PEA_PME'].includes(product)) {
      warnings.push('Horizon < 5 ans : PEA fiscalement défavorable');
    }

    // AV avec primes importantes
    if (product === 'AV' && investment.av_primes_total_estime === '>=150k') {
      warnings.push('Primes ≥150k : taux mixte, précision dépend encours existant');
    }

    // SCPI et micro-foncier
    if (product === 'SCPI') {
      const revenus_totaux = (profile.revenus_fonciers_existants || 0) +
                            investment.montant_invest * (investment.scpi_rendement_yield || 0.045);
      if (revenus_totaux > taxRules.micro_foncier.micro_foncier_max) {
        warnings.push('Régime réel foncier : optimisation charges à étudier');
      }
    }

    return warnings;
  }
}