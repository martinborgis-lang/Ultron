import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { createAdminClient } from '@/lib/supabase-admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Produits par défaut identiques à ceux dans le schéma database/
const DEFAULT_PRODUCTS = [
  {
    name: 'Assurance Vie',
    description: 'Contrats d\'assurance vie et capitalisation',
    type: 'commission',
    commission_rate: 2.0
  },
  {
    name: 'PEA',
    description: 'Plan d\'Épargne en Actions',
    type: 'commission',
    commission_rate: 1.5
  }
];

export async function POST(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (context.user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé - admin requis' }, { status: 403 });
    }

    const body = await request.json();
    const { organization_id, sync_all = false } = body;

    const adminClient = createAdminClient();

    let organizationsToSync = [];

    if (sync_all && context.user.role === 'admin') {
      // Super admin peut sync toutes les orgs
      const { data: orgs } = await adminClient
        .from('organizations')
        .select('id, name');

      organizationsToSync = orgs || [];
    } else if (organization_id) {
      // Admin peut sync son organisation ou une spécifique
      organizationsToSync = [{ id: organization_id }];
    } else {
      // Par défaut, sync l'organisation de l'admin
      organizationsToSync = [{ id: context.organization.id, name: context.organization.name }];
    }

    const results = [];

    for (const org of organizationsToSync) {
      try {
        logger.info(`Synchronisation produits pour organisation ${org.id}`);

        // Vérifier les produits existants
        const { data: existingProducts } = await adminClient
          .from('products')
          .select('name')
          .eq('organization_id', org.id);

        const existingNames = new Set((existingProducts || []).map(p => p.name));
        const productsToCreate = DEFAULT_PRODUCTS.filter(product => !existingNames.has(product.name));

        let created = 0;
        let skipped = existingProducts?.length || 0;

        if (productsToCreate.length > 0) {
          const { data: newProducts, error: insertError } = await adminClient
            .from('products')
            .insert(
              productsToCreate.map(product => ({
                organization_id: org.id,
                name: product.name,
                description: product.description,
                type: product.type,
                commission_rate: product.commission_rate,
                is_active: true,
                created_by: null
              }))
            )
            .select();

          if (insertError) {
            throw insertError;
          }

          created = newProducts?.length || 0;
        }

        results.push({
          organization_id: org.id,
          organization_name: 'name' in org ? (org.name || 'Unknown') : 'Unknown',
          products_created: created,
          products_existing: skipped,
          total_products: created + skipped,
        });

      } catch (orgError) {
        logger.error(`Erreur sync produits pour org ${org.id}:`, orgError);
        results.push({
          organization_id: org.id,
          organization_name: 'name' in org ? (org.name || 'Unknown') : 'Unknown',
          error: orgError instanceof Error ? orgError.message : 'Erreur inconnue'
        });
      }
    }

    return NextResponse.json({
      success: true,
      organizations_synced: results.length,
      results
    });

  } catch (error) {
    logger.error('Erreur API sync-products:', error);
    return NextResponse.json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (context.user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const adminClient = createAdminClient();

    // Récupérer toutes les organisations et leurs produits
    const { data: organizations } = await adminClient
      .from('organizations')
      .select(`
        id,
        name,
        products (
          id,
          name,
          type,
          commission_rate,
          is_active
        )
      `)
      .order('name');

    const analysis = (organizations || []).map(org => {
      const products = org.products || [];
      const productNames = products.map(p => p.name);
      const expectedNames = DEFAULT_PRODUCTS.map(p => p.name);

      const missing = expectedNames.filter(name => !productNames.includes(name));
      const extra = productNames.filter(name => !expectedNames.includes(name));

      return {
        organization_id: org.id,
        organization_name: org.name,
        total_products: products.length,
        expected_products: expectedNames.length,
        missing_products: missing,
        extra_products: extra,
        needs_sync: missing.length > 0,
        product_list: products.map(p => ({
          name: p.name,
          type: p.type,
          commission_rate: p.commission_rate,
          is_active: p.is_active
        }))
      };
    });

    const needSync = analysis.filter(org => org.needs_sync);

    return NextResponse.json({
      total_organizations: analysis.length,
      organizations_need_sync: needSync.length,
      analysis,
      default_products: DEFAULT_PRODUCTS
    });

  } catch (error) {
    logger.error('Erreur GET sync-products:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}