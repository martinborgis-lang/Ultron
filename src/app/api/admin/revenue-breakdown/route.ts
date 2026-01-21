import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (context.user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    const adminClient = createAdminClient();

    // Calculer les dates pour la période
    const now = new Date();
    const daysMap = { '7d': 7, '30d': 30, '90d': 90, '6m': 180, '1y': 365 };
    const days = daysMap[period as keyof typeof daysMap] || 30;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Récupérer les deals fermés avec produits et commissions
    const { data: deals, error } = await adminClient
      .from('deal_products')
      .select(`
        *,
        product:products(id, name, type, category),
        prospect:crm_prospects(id, first_name, last_name, email, stage_slug),
        advisor:users(id, full_name, email),
        advisor_commission:advisor_commissions!inner(commission_rate)
      `)
      .eq('organization_id', context.organization.id)
      .gte('closed_at', startDate.toISOString())
      .order('closed_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération deals:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    // Calculer les métriques
    const metrics = {
      totalDeals: deals?.length || 0,
      totalEnterpriseCA: 0,
      totalAdvisorCommissions: 0,
      byProduct: {} as Record<string, {
        name: string;
        category: string;
        dealCount: number;
        enterpriseCA: number;
        advisorCommissions: number;
      }>,
      byAdvisor: {} as Record<string, {
        name: string;
        email: string;
        dealCount: number;
        enterpriseCA: number;
        commissions: number;
      }>,
      byType: {
        fixed: { dealCount: 0, enterpriseCA: 0, commissions: 0 },
        commission: { dealCount: 0, enterpriseCA: 0, commissions: 0 }
      }
    };

    deals?.forEach(deal => {
      if (!deal.product) return;

      const enterpriseRevenue = deal.company_revenue || 0;
      const advisorCommission = deal.advisor_commission_amount || 0;

      metrics.totalEnterpriseCA += enterpriseRevenue;
      metrics.totalAdvisorCommissions += advisorCommission;

      // Par produit
      const productId = deal.product.id;
      if (!metrics.byProduct[productId]) {
        metrics.byProduct[productId] = {
          name: deal.product.name,
          category: deal.product.category || '',
          dealCount: 0,
          enterpriseCA: 0,
          advisorCommissions: 0
        };
      }
      metrics.byProduct[productId].dealCount++;
      metrics.byProduct[productId].enterpriseCA += enterpriseRevenue;
      metrics.byProduct[productId].advisorCommissions += advisorCommission;

      // Par conseiller
      const advisorId = deal.advisor_id;
      if (!metrics.byAdvisor[advisorId]) {
        metrics.byAdvisor[advisorId] = {
          name: deal.advisor?.full_name || 'N/A',
          email: deal.advisor?.email || '',
          dealCount: 0,
          enterpriseCA: 0,
          commissions: 0
        };
      }
      metrics.byAdvisor[advisorId].dealCount++;
      metrics.byAdvisor[advisorId].enterpriseCA += enterpriseRevenue;
      metrics.byAdvisor[advisorId].commissions += advisorCommission;

      // Par type de produit
      const productType = deal.product.type;
      if (productType === 'fixed' || productType === 'commission') {
        metrics.byType[productType].dealCount++;
        metrics.byType[productType].enterpriseCA += enterpriseRevenue;
        metrics.byType[productType].commissions += advisorCommission;
      }
    });

    // Convertir en arrays pour faciliter l'affichage
    const response = {
      ...metrics,
      byProduct: Object.values(metrics.byProduct),
      byAdvisor: Object.values(metrics.byAdvisor),
      averageCommissionRate: metrics.totalEnterpriseCA > 0
        ? (metrics.totalAdvisorCommissions / metrics.totalEnterpriseCA) * 100
        : 0,
      deals: deals || []
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur API revenue-breakdown:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}