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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    const adminClient = createAdminClient();

    let query = adminClient
      .from('advisor_commissions')
      .select(`
        *,
        product:products(id, name, type),
        user:users(id, full_name, email)
      `)
      .eq('organization_id', context.organization.id);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: commissions, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération commissions:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ commissions: commissions || [] });

  } catch (error) {
    console.error('Erreur API advisor commissions:', error);
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
    const { user_id, product_id, commission_rate, is_default } = body;

    // Validation
    if (!user_id || commission_rate == null || commission_rate < 0 || commission_rate > 100) {
      return NextResponse.json({
        error: 'user_id requis et commission_rate entre 0 et 100%'
      }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Vérifier que l'utilisateur appartient à l'organisation
    const { data: user } = await adminClient
      .from('users')
      .select('id, organization_id')
      .eq('id', user_id)
      .eq('organization_id', context.organization.id)
      .single();

    if (!user) {
      return NextResponse.json({
        error: 'Utilisateur non trouvé dans cette organisation'
      }, { status: 404 });
    }

    // Si c'est un taux par défaut, supprimer l'ancien
    if (is_default && !product_id) {
      await adminClient
        .from('advisor_commissions')
        .delete()
        .eq('user_id', user_id)
        .eq('organization_id', context.organization.id)
        .is('product_id', null)
        .eq('is_default', true);
    }

    const commissionData = {
      organization_id: context.organization.id,
      user_id,
      product_id: product_id || null,
      commission_rate,
      is_default: is_default || false
    };

    const { data: commission, error } = await adminClient
      .from('advisor_commissions')
      .insert(commissionData)
      .select(`
        *,
        product:products(id, name, type),
        user:users(id, full_name, email)
      `)
      .single();

    if (error) {
      console.error('Erreur création commission:', error);

      if (error.code === '23505') { // Violation unique constraint
        return NextResponse.json({
          error: 'Commission déjà définie pour ce conseiller et ce produit'
        }, { status: 400 });
      }

      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
    }

    return NextResponse.json({
      commission,
      message: 'Commission configurée avec succès'
    });

  } catch (error) {
    console.error('Erreur API create commission:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}