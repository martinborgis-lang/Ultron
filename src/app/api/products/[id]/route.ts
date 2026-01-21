import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (context.user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé - Admin requis' }, { status: 403 });
    }

    const body = await request.json();
    const productId = params.id;

    const adminClient = createAdminClient();

    // Vérifier que le produit appartient à l'organisation
    const { data: existingProduct } = await adminClient
      .from('products')
      .select('id, organization_id')
      .eq('id', productId)
      .eq('organization_id', context.organization.id)
      .single();

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    // Validation des données selon le type
    const { type, fixed_value, commission_rate } = body;

    if (type === 'fixed' && fixed_value && fixed_value <= 0) {
      return NextResponse.json({
        error: 'Valeur fixe doit être positive'
      }, { status: 400 });
    }

    if (type === 'commission' && commission_rate && (commission_rate <= 0 || commission_rate > 100)) {
      return NextResponse.json({
        error: 'Taux de commission doit être entre 0 et 100%'
      }, { status: 400 });
    }

    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    };

    const { data: product, error } = await adminClient
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Erreur mise à jour produit:', error);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    return NextResponse.json({
      product,
      message: 'Produit mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur API update product:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (context.user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé - Admin requis' }, { status: 403 });
    }

    const productId = params.id;
    const adminClient = createAdminClient();

    // Vérifier si le produit est utilisé dans des deals
    const { data: deals, error: dealsError } = await adminClient
      .from('deal_products')
      .select('id')
      .eq('product_id', productId)
      .limit(1);

    if (dealsError) {
      console.error('Erreur vérification deals:', dealsError);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    if (deals && deals.length > 0) {
      // Ne pas supprimer, juste désactiver
      const { data: product, error } = await adminClient
        .from('products')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .eq('organization_id', context.organization.id)
        .select()
        .single();

      if (error) {
        console.error('Erreur désactivation produit:', error);
        return NextResponse.json({ error: 'Erreur lors de la désactivation' }, { status: 500 });
      }

      return NextResponse.json({
        product,
        message: 'Produit désactivé (utilisé dans des deals existants)'
      });
    }

    // Supprimer complètement si pas utilisé
    const { error } = await adminClient
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('organization_id', context.organization.id);

    if (error) {
      console.error('Erreur suppression produit:', error);
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Produit supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur API delete product:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}