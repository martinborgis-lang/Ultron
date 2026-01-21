import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { createAdminClient } from '@/lib/supabase-admin';
import type { Product } from '@/types/products';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';

    const adminClient = createAdminClient();

    let query = adminClient
      .from('products')
      .select('*')
      .eq('organization_id', context.organization.id)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Erreur récupération produits:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ products: products || [] });

  } catch (error) {
    console.error('Erreur API products:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (context.user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé - Admin requis' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, type, fixed_value, commission_rate, category } = body;

    // Validation
    if (!name || !type || !category) {
      return NextResponse.json({
        error: 'Champs requis : name, type, category'
      }, { status: 400 });
    }

    if (type === 'fixed' && (!fixed_value || fixed_value <= 0)) {
      return NextResponse.json({
        error: 'Valeur fixe requise et positive pour les produits fixes'
      }, { status: 400 });
    }

    if (type === 'commission' && (!commission_rate || commission_rate <= 0 || commission_rate > 100)) {
      return NextResponse.json({
        error: 'Taux de commission requis entre 0 et 100% pour les produits à commission'
      }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Vérifier l'unicité du nom dans l'organisation
    const { data: existing } = await adminClient
      .from('products')
      .select('id')
      .eq('organization_id', context.organization.id)
      .eq('name', name)
      .single();

    if (existing) {
      return NextResponse.json({
        error: 'Un produit avec ce nom existe déjà'
      }, { status: 400 });
    }

    const productData: Partial<Product> = {
      organization_id: context.organization.id,
      name,
      description,
      type,
      category,
      created_by: context.user.id,
      is_active: true
    };

    if (type === 'fixed') {
      productData.fixed_value = fixed_value;
    } else {
      productData.commission_rate = commission_rate;
    }

    const { data: product, error } = await adminClient
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (error) {
      console.error('Erreur création produit:', error);
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
    }

    return NextResponse.json({
      product,
      message: 'Produit créé avec succès'
    });

  } catch (error) {
    console.error('Erreur API create product:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}