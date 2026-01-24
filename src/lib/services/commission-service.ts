import { createAdminClient } from '@/lib/supabase-admin';

export interface CommissionCalculation {
  conseillerInitial: number;
  conseillerPeriodique: number;
  cabinetInitial: number;
  cabinetPeriodique: number;
  totalConseiller: number;
  totalCabinet: number;
  totalEntreprise: number;
  fraisAppliques: number;
}

export interface SaleData {
  productId: string;
  versementInitial: number;
  versementMensuel: number;
  fraisTaux: number;
  fraisSur: 'initial' | 'periodique' | 'les_deux' | null;
}

export class CommissionService {
  /**
   * Calcule les commissions pour une vente donnée
   */
  static async calculateCommissions(saleData: SaleData): Promise<CommissionCalculation> {
    const supabase = createAdminClient();

    // Récupérer les taux de commission du produit
    const { data: product, error } = await supabase
      .from('products')
      .select('commission_conseiller_initial, commission_conseiller_periodique, commission_cabinet_initial, commission_cabinet_periodique')
      .eq('id', saleData.productId)
      .single();

    if (error || !product) {
      throw new Error('Produit non trouvé');
    }

    const {
      commission_conseiller_initial,
      commission_conseiller_periodique,
      commission_cabinet_initial,
      commission_cabinet_periodique
    } = product;

    // Calcul des montants de base
    let montantInitialNet = saleData.versementInitial;
    let montantPeriodique = saleData.versementMensuel * 12; // Année 1

    // Application des frais
    let fraisAppliques = 0;
    if (saleData.fraisTaux > 0 && saleData.fraisSur) {
      if (saleData.fraisSur === 'initial' || saleData.fraisSur === 'les_deux') {
        const fraisInitial = saleData.versementInitial * saleData.fraisTaux;
        montantInitialNet -= fraisInitial;
        fraisAppliques += fraisInitial;
      }
      if (saleData.fraisSur === 'periodique' || saleData.fraisSur === 'les_deux') {
        const fraisPeriodique = montantPeriodique * saleData.fraisTaux;
        montantPeriodique -= fraisPeriodique;
        fraisAppliques += fraisPeriodique;
      }
    }

    // Calcul des commissions
    const conseillerInitial = montantInitialNet * (commission_conseiller_initial / 100);
    const conseillerPeriodique = montantPeriodique * (commission_conseiller_periodique / 100);
    const cabinetInitial = montantInitialNet * (commission_cabinet_initial / 100);
    const cabinetPeriodique = montantPeriodique * (commission_cabinet_periodique / 100);

    const totalConseiller = conseillerInitial + conseillerPeriodique;
    const totalCabinet = cabinetInitial + cabinetPeriodique;
    const totalEntreprise = totalConseiller + totalCabinet;

    return {
      conseillerInitial: Math.round(conseillerInitial * 100) / 100,
      conseillerPeriodique: Math.round(conseillerPeriodique * 100) / 100,
      cabinetInitial: Math.round(cabinetInitial * 100) / 100,
      cabinetPeriodique: Math.round(cabinetPeriodique * 100) / 100,
      totalConseiller: Math.round(totalConseiller * 100) / 100,
      totalCabinet: Math.round(totalCabinet * 100) / 100,
      totalEntreprise: Math.round(totalEntreprise * 100) / 100,
      fraisAppliques: Math.round(fraisAppliques * 100) / 100
    };
  }

  /**
   * Enregistre une vente avec calcul automatique des commissions
   */
  static async recordSale(prospectId: string, saleData: SaleData) {
    const supabase = createAdminClient();

    try {
      // Calculer les commissions
      const commissions = await this.calculateCommissions(saleData);

      // Commencer une transaction
      const { data: prospect, error: prospectError } = await supabase
        .from('crm_prospects')
        .update({
          product_id: saleData.productId,
          versement_initial: saleData.versementInitial,
          versement_mensuel: saleData.versementMensuel,
          frais_taux: saleData.fraisTaux,
          frais_sur: saleData.fraisSur,
          date_vente: new Date().toISOString(),
          commissions_calculees: commissions,
          stage_slug: 'gagne',
          updated_at: new Date().toISOString()
        })
        .eq('id', prospectId)
        .select()
        .single();

      if (prospectError) {
        throw new Error(`Erreur lors de l'enregistrement de la vente: ${prospectError.message}`);
      }

      return {
        prospect,
        commissions
      };
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la vente:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques de commissions pour une organisation
   */
  static async getCommissionStats(organizationId: string, startDate?: string, endDate?: string) {
    const supabase = createAdminClient();

    let query = supabase
      .from('crm_prospects')
      .select(`
        id,
        first_name,
        last_name,
        versement_initial,
        versement_mensuel,
        frais_taux,
        date_vente,
        commissions_calculees,
        assigned_to,
        users!assigned_to(full_name),
        products!product_id(name, type)
      `)
      .eq('organization_id', organizationId)
      .eq('stage_slug', 'gagne')
      .not('date_vente', 'is', null)
      .not('commissions_calculees', 'is', null)
      .order('date_vente', { ascending: false });

    if (startDate) {
      query = query.gte('date_vente', startDate);
    }
    if (endDate) {
      query = query.lte('date_vente', endDate);
    }

    const { data: sales, error } = await query;

    if (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }

    // Calculer les totaux
    let totalCommissionsConseiller = 0;
    let totalCommissionsCabinet = 0;
    let totalCAEntreprise = 0;
    let totalVentes = 0;

    interface SaleData {
      advisor_id: string;
      commissions_calculees: CommissionCalculation;
      prospect?: {
        first_name?: string;
        last_name?: string;
      };
    }

    const salesByAdvisor: Record<string, SaleData[]> = {};

    sales?.forEach((sale: SaleData) => {
      const commissions = sale.commissions_calculees as CommissionCalculation;

      totalCommissionsConseiller += commissions.totalConseiller;
      totalCommissionsCabinet += commissions.totalCabinet;
      totalCAEntreprise += commissions.totalEntreprise;
      totalVentes++;

      // Grouper par conseiller
      const advisorId = sale.assigned_to;
      if (advisorId) {
        if (!salesByAdvisor[advisorId]) {
          salesByAdvisor[advisorId] = {
            advisorName: sale.users?.full_name || 'Inconnu',
            totalCommissions: 0,
            totalCA: 0,
            ventesCount: 0,
            sales: []
          };
        }

        salesByAdvisor[advisorId].totalCommissions += commissions.totalConseiller;
        salesByAdvisor[advisorId].totalCA += commissions.totalEntreprise;
        salesByAdvisor[advisorId].ventesCount++;
        salesByAdvisor[advisorId].sales.push(sale);
      }
    });

    return {
      summary: {
        totalCommissionsConseiller: Math.round(totalCommissionsConseiller * 100) / 100,
        totalCommissionsCabinet: Math.round(totalCommissionsCabinet * 100) / 100,
        totalCAEntreprise: Math.round(totalCAEntreprise * 100) / 100,
        totalVentes,
        moyenneVente: totalVentes > 0 ? Math.round((totalCAEntreprise / totalVentes) * 100) / 100 : 0
      },
      salesByAdvisor: Object.values(salesByAdvisor),
      recentSales: sales?.slice(0, 10) || []
    };
  }
}