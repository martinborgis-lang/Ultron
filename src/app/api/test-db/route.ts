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
      return NextResponse.json({ error: 'Accès refusé - Admin requis' }, { status: 403 });
    }

    const adminClient = createAdminClient();

    // Tester les tables une par une
    const tests = {
      products: false,
      advisor_commissions: false,
      deal_products: false,
      errors: [] as string[]
    };

    // Test table products
    try {
      const { data, error } = await adminClient
        .from('products')
        .select('id')
        .limit(1);

      if (!error) {
        tests.products = true;
      } else {
        tests.errors.push(`Products table: ${error.message}`);
      }
    } catch (err: any) {
      tests.errors.push(`Products table: ${err.message}`);
    }

    // Test table advisor_commissions
    try {
      const { data, error } = await adminClient
        .from('advisor_commissions')
        .select('id')
        .limit(1);

      if (!error) {
        tests.advisor_commissions = true;
      } else {
        tests.errors.push(`Advisor commissions table: ${error.message}`);
      }
    } catch (err: any) {
      tests.errors.push(`Advisor commissions table: ${err.message}`);
    }

    // Test table deal_products
    try {
      const { data, error } = await adminClient
        .from('deal_products')
        .select('id')
        .limit(1);

      if (!error) {
        tests.deal_products = true;
      } else {
        tests.errors.push(`Deal products table: ${error.message}`);
      }
    } catch (err: any) {
      tests.errors.push(`Deal products table: ${err.message}`);
    }

    const allTablesExist = tests.products && tests.advisor_commissions && tests.deal_products;

    return NextResponse.json({
      status: allTablesExist ? 'success' : 'error',
      tables: tests,
      message: allTablesExist
        ? 'Toutes les tables existent et sont accessibles'
        : 'Certaines tables manquent - exécutez le script SQL products-migration.sql',
      sqlPath: 'database/products-migration.sql'
    });

  } catch (error) {
    console.error('Erreur test base:', error);
    return NextResponse.json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}