import {
  ProspectProfile,
  TaxCalculationResult,
  SituationFamiliale,
  ValidationResult,
} from '@/types/fiscalite';
import taxRules from '@/lib/tax_rules_2026.json';

export class IncomeTaxEngine {
  /**
   * Calcule l'impôt sur le revenu et le TMI selon le profil
   */
  public calculateTax(profile: ProspectProfile): TaxCalculationResult {
    // Validation préalable
    const validation = this.validateProfile(profile);
    if (!validation.is_valid) {
      throw new Error(`Profil invalide: ${validation.errors.join(', ')}`);
    }

    // Calcul des parts fiscales
    const parts_fiscales = this.calculateFiscalParts(
      profile.situation_famille,
      profile.nb_enfants_charge,
      profile.parent_isole_case_T
    );

    // Calcul du quotient familial
    const quotient_familial = profile.revenu_net_imposable_foyer / parts_fiscales;

    // Calcul de l'IR brut par part via barème progressif
    const ir_par_part = this.calculateIRParPart(quotient_familial);
    const ir_brut = ir_par_part * parts_fiscales;

    // TMI = taux de la tranche où se situe le quotient
    const tmi = this.calculateTMI(quotient_familial);

    // Plafonnement quotient familial (enfants)
    const ir_apres_qf = this.applyQuotientFamilialCap(
      ir_brut,
      parts_fiscales,
      profile.situation_famille,
      profile.nb_enfants_charge
    );

    // Décote
    const decote = this.calculateDecote(ir_apres_qf, profile.situation_famille);
    const ir_net = Math.max(0, ir_apres_qf - decote);

    // Taux moyen
    const taux_moyen = profile.revenu_net_imposable_foyer > 0
      ? (ir_net / profile.revenu_net_imposable_foyer) * 100
      : 0;

    return {
      ir_net: Math.round(ir_net),
      tmi: tmi * 100, // en pourcentage
      taux_moyen: Math.round(taux_moyen * 100) / 100,
      parts_fiscales,
      quotient_familial: Math.round(quotient_familial),
      ir_brut: Math.round(ir_brut),
      ir_apres_qf: Math.round(ir_apres_qf),
      decote: Math.round(decote),
    };
  }

  /**
   * Calcule les parts fiscales selon la situation familiale
   */
  private calculateFiscalParts(
    situation: SituationFamiliale,
    nb_enfants: number,
    parent_isole?: boolean
  ): number {
    // Base selon situation
    let parts_base: number;
    if (situation === 'MARIE_PACSE') {
      parts_base = 2;
    } else {
      parts_base = 1;
    }

    // Parts enfants (résidence principale)
    let parts_enfants = 0;
    if (nb_enfants === 1) {
      parts_enfants = 0.5;
    } else if (nb_enfants === 2) {
      parts_enfants = 1.0;
    } else if (nb_enfants >= 3) {
      parts_enfants = 1.0 + (nb_enfants - 2) * 1.0;
    }

    // Parent isolé (demi-part supplémentaire)
    const parent_isole_parts = parent_isole && nb_enfants > 0 ? 0.5 : 0;

    return parts_base + parts_enfants + parent_isole_parts;
  }

  /**
   * Calcule l'IR par part via le barème progressif
   */
  private calculateIRParPart(quotient: number): number {
    let ir = 0;

    for (const tranche of taxRules.income_brackets) {
      const min = tranche.min;
      const max = tranche.max || Infinity;

      if (quotient > min) {
        const taxable = Math.min(quotient, max) - min;
        ir += taxable * tranche.rate;
      }
    }

    return ir;
  }

  /**
   * Détermine le TMI (taux marginal d'imposition)
   */
  private calculateTMI(quotient: number): number {
    for (const tranche of taxRules.income_brackets) {
      const min = tranche.min;
      const max = tranche.max || Infinity;

      if (quotient >= min && quotient <= max) {
        return tranche.rate;
      }
    }

    // Par défaut, la dernière tranche
    return taxRules.income_brackets[taxRules.income_brackets.length - 1].rate;
  }

  /**
   * Applique le plafonnement du quotient familial
   */
  private applyQuotientFamilialCap(
    ir_avec_enfants: number,
    parts_totales: number,
    situation: SituationFamiliale,
    nb_enfants: number
  ): number {
    if (nb_enfants === 0) {
      return ir_avec_enfants;
    }

    // Calcul IR sans enfants
    const parts_sans_enfants = situation === 'MARIE_PACSE' ? 2 : 1;
    const quotient_sans_enfants =
      (ir_avec_enfants * parts_totales) / parts_sans_enfants; // Approximation

    // Cette approche est simplifiée. Dans une implémentation complète,
    // il faudrait recalculer l'IR avec parts_sans_enfants
    const parts_enfants = parts_totales - parts_sans_enfants;
    const nb_half_parts_enfants = parts_enfants / 0.5;

    const avantage = Math.max(0, ir_avec_enfants * 0.2); // Approximation
    const plafond = taxRules.quotient_familial.qf_cap_half_part * nb_half_parts_enfants;

    if (avantage > plafond) {
      return ir_avec_enfants + avantage - plafond;
    }

    return ir_avec_enfants;
  }

  /**
   * Calcule la décote selon la situation familiale
   */
  private calculateDecote(ir_brut: number, situation: SituationFamiliale): number {
    const isCouple = situation === 'MARIE_PACSE';
    const seuil = isCouple
      ? taxRules.decote.decote_threshold_couple
      : taxRules.decote.decote_threshold_single;
    const base = isCouple
      ? taxRules.decote.decote_base_couple
      : taxRules.decote.decote_base_single;

    if (ir_brut <= seuil) {
      return Math.max(0, base - ir_brut * taxRules.decote.decote_rate);
    }

    return 0;
  }

  /**
   * Valide un profil prospect pour le calcul fiscal
   */
  public validateProfile(profile: ProspectProfile): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Champs obligatoires
    if (!profile.residence_fiscale_fr) {
      warnings.push('Calcul indicatif - résidence fiscale non française');
    }

    if (!profile.situation_famille) {
      errors.push('Situation familiale requise');
    }

    if (profile.nb_enfants_charge < 0) {
      errors.push('Nombre d\'enfants invalide');
    }

    if (!profile.revenu_net_imposable_foyer || profile.revenu_net_imposable_foyer <= 0) {
      errors.push('Revenu net imposable requis et positif');
    }

    // Cohérence
    if (profile.parent_isole_case_T && profile.situation_famille === 'MARIE_PACSE') {
      warnings.push('Parent isolé case T incompatible avec mariage/PACS');
    }

    const completeness = this.calculateCompleteness(profile);
    if (completeness < 80) {
      warnings.push(`Profil incomplet (${completeness}%) - précision limitée`);
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      completeness_score: completeness,
    };
  }

  /**
   * Calcule le score de complétude d'un profil
   */
  private calculateCompleteness(profile: ProspectProfile): number {
    const required_fields = [
      'residence_fiscale_fr',
      'situation_famille',
      'nb_enfants_charge',
      'revenu_net_imposable_foyer'
    ];

    const optional_fields = [
      'revenus_brut_salaires',
      'revenus_activite_nets',
      'plafond_per_disponible',
      'revenus_fonciers_existants',
      'parent_isole_case_T'
    ];

    let score = 0;
    let total_weight = 0;

    // Champs obligatoires (poids 2)
    for (const field of required_fields) {
      total_weight += 2;
      if (profile[field as keyof ProspectProfile] !== undefined &&
          profile[field as keyof ProspectProfile] !== null) {
        score += 2;
      }
    }

    // Champs optionnels (poids 1)
    for (const field of optional_fields) {
      total_weight += 1;
      if (profile[field as keyof ProspectProfile] !== undefined &&
          profile[field as keyof ProspectProfile] !== null) {
        score += 1;
      }
    }

    return Math.round((score / total_weight) * 100);
  }

  /**
   * Retourne les champs manquants pour optimiser la précision
   */
  public getMissingFields(profile: ProspectProfile): string[] {
    const missing: string[] = [];

    if (!profile.revenus_activite_nets) {
      missing.push('revenus_activite_nets');
    }

    if (!profile.plafond_per_disponible) {
      missing.push('plafond_per_disponible');
    }

    if (profile.revenus_fonciers_existants === undefined) {
      missing.push('revenus_fonciers_existants');
    }

    return missing;
  }
}