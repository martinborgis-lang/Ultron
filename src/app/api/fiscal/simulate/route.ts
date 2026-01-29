import { NextRequest, NextResponse } from 'next/server';
import { IncomeTaxEngine } from '@/lib/engines/income-tax-engine';
import { ProductTaxEngine } from '@/lib/engines/product-tax-engine';
import {
  FiscalSimulationInput,
  FiscalSimulationOutput,
  ProductType,
  ChartDataPoint,
  FiscalComparison,
} from '@/types/fiscalite';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prospect_profile, investment_project, products } = body as {
      prospect_profile: FiscalSimulationInput['prospect_profile'];
      investment_project: FiscalSimulationInput['investment_project'];
      products: ProductType[];
    };

    // Validation des données d'entrée
    if (!prospect_profile || !investment_project || !products?.length) {
      return NextResponse.json(
        { error: 'Données d\'entrée invalides' },
        { status: 400 }
      );
    }

    // Initialisation des moteurs de calcul
    const incomeTaxEngine = new IncomeTaxEngine();
    const productTaxEngine = new ProductTaxEngine();

    // 1. Calcul de la situation fiscale actuelle
    const current_tax = incomeTaxEngine.calculateTax(prospect_profile);

    // 2. Calcul fiscal pour chaque produit
    const product_results = [];
    const savings_vs_cto: Record<ProductType, number> = {} as Record<ProductType, number>;
    let cto_result = null;

    for (const product of products) {
      const result = productTaxEngine.calculateProductTax(
        product,
        prospect_profile,
        investment_project,
        current_tax
      );

      // Ajouter warnings contextuels
      const context_warnings = productTaxEngine.generateContextWarnings(
        product,
        prospect_profile,
        investment_project,
        current_tax
      );
      result.warnings = [...result.warnings, ...context_warnings];

      product_results.push(result);

      // Garder CTO comme référence
      if (product === 'CTO') {
        cto_result = result;
      }
    }

    // 3. Calcul des économies vs CTO
    if (cto_result) {
      for (const result of product_results) {
        savings_vs_cto[result.product_type] = productTaxEngine.calculateSavingsVsCTO(
          result,
          cto_result.tax_total
        );
      }
    }

    // 4. Génération des données de graphique
    const chart_data = generateChartData(
      products,
      prospect_profile,
      investment_project,
      current_tax,
      productTaxEngine
    );

    // 5. Identification des champs manquants
    const missing_fields = incomeTaxEngine.getMissingFields(prospect_profile);

    // 6. Warnings de précision
    const precision_warnings = generatePrecisionWarnings(
      prospect_profile,
      investment_project,
      product_results,
      current_tax
    );

    // Construction de la réponse
    const fiscal_comparison: FiscalComparison = {
      current_tax,
      products: product_results,
      savings_vs_cto,
    };

    const simulation_output: FiscalSimulationOutput = {
      input: {
        prospect_profile,
        investment_project,
      },
      fiscal_comparison,
      chart_data,
      missing_fields,
      precision_warnings,
    };

    return NextResponse.json(simulation_output);

  } catch (error) {
    console.error('Erreur simulation fiscale:', error);
    return NextResponse.json(
      { error: 'Erreur interne lors du calcul fiscal' },
      { status: 500 }
    );
  }
}

/**
 * Génère les données pour les graphiques temporels
 */
function generateChartData(
  products: ProductType[],
  profile: FiscalSimulationInput['prospect_profile'],
  investment: FiscalSimulationInput['investment_project'],
  current_tax: any,
  productTaxEngine: ProductTaxEngine
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const max_years = Math.max(investment.horizon_years, 15); // Au moins 15 ans pour le graphique

  for (let year = 1; year <= max_years; year++) {
    const year_investment = {
      ...investment,
      horizon_years: year,
    };

    const point: ChartDataPoint = {
      year,
      cto_tax: 0,
      pea_tax: 0,
      av_tax: 0,
      per_tax_conservateur: 0,
      per_tax_optimiste: 0,
      scpi_tax_cumule: 0,
    };

    // Calcul pour chaque produit sélectionné
    for (const product of products) {
      try {
        const result = productTaxEngine.calculateProductTax(
          product,
          profile,
          year_investment,
          current_tax
        );

        switch (product) {
          case 'CTO':
            point.cto_tax = result.tax_total;
            break;
          case 'PEA':
            point.pea_tax = result.tax_total;
            break;
          case 'AV':
            point.av_tax = result.tax_total;
            break;
          case 'PER':
            if (result.gain_fiscal_net) {
              // PER : on affiche le coût net (après économie immédiate)
              point.per_tax_conservateur = Math.max(0, result.tax_total - (result.eco_ir_immediate || 0));
              point.per_tax_optimiste = Math.max(0, result.tax_total - (result.eco_ir_immediate || 0));
            } else {
              point.per_tax_conservateur = result.tax_total;
              point.per_tax_optimiste = result.tax_total;
            }
            break;
          case 'SCPI':
            point.scpi_tax_cumule = result.tax_total;
            break;
        }
      } catch (error) {
        console.warn(`Erreur calcul ${product} année ${year}:`, error);
      }
    }

    data.push(point);
  }

  return data;
}

/**
 * Génère les warnings de précision selon le contexte
 */
function generatePrecisionWarnings(
  profile: FiscalSimulationInput['prospect_profile'],
  investment: FiscalSimulationInput['investment_project'],
  product_results: any[],
  current_tax: any
): string[] {
  const warnings: string[] = [];

  // Warnings généraux
  if (!profile.residence_fiscale_fr) {
    warnings.push('Résidence fiscale non française - calcul indicatif uniquement');
  }

  if (current_tax.tmi === 0) {
    warnings.push('TMI nul : avantages fiscaux PER et niches limités');
  }

  if (investment.horizon_years < 5) {
    warnings.push('Horizon < 5 ans : PEA et AV non optimaux fiscalement');
  }

  // Warnings spécifiques aux produits
  const has_av = product_results.some(p => p.product_type === 'AV');
  const has_scpi = product_results.some(p => p.product_type === 'SCPI');
  const has_per = product_results.some(p => p.product_type === 'PER');

  if (has_av && investment.av_primes_total_estime === '>=150k') {
    warnings.push('Assurance-vie : primes ≥150k - taux mixte selon encours existant');
  }

  if (has_scpi) {
    const revenus_fonciers = (profile.revenus_fonciers_existants || 0) +
                            investment.montant_invest * (investment.scpi_rendement_yield || 0.045);
    if (revenus_fonciers > 15000) {
      warnings.push('SCPI : régime réel foncier - optimisation charges à étudier en RDV');
    }
  }

  if (has_per && !profile.plafond_per_disponible) {
    warnings.push('PER : plafond estimé - consulter avis d\'impôt pour précision maximale');
  }

  // Warning rendement hypothétique
  if (investment.hyp_r > 0.08) {
    warnings.push(`Rendement ${(investment.hyp_r * 100).toFixed(1)}% élevé - hypothèse optimiste pour comparaison fiscale`);
  }

  return warnings;
}