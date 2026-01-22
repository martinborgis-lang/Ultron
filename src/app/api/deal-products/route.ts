import { logger } from '@/lib/logger';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { createAdminClient } from '@/lib/supabase-admin';
import type { DealProductForm } from '@/types/products';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { prospect_id, product_id, client_amount, notes }: DealProductForm & { prospect_id: string } = body;

    // Validation
    if (!prospect_id || !product_id || !client_amount || client_amount <= 0) {
      return NextResponse.json({
        error: 'prospect_id, product_id et client_amount requis'
      }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Vérifier que le prospect appartient à l'organisation
    const { data: prospect } = await adminClient
      .from('crm_prospects')
      .select('id, organization_id, stage_slug')
      .eq('id', prospect_id)
      .eq('organization_id', context.organization.id)
      .single();

    if (!prospect) {
      return NextResponse.json({
        error: 'Prospect non trouvé'
      }, { status: 404 });
    }

    // Vérifier que le produit appartient à l'organisation
    const { data: product } = await adminClient
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('organization_id', context.organization.id)
      .eq('is_active', true)
      .single();

    if (!product) {
      return NextResponse.json({
        error: 'Produit non trouvé ou inactif'
      }, { status: 404 });
    }

    // Supprimer l'ancien deal s'il existe
    await adminClient
      .from('deal_products')
      .delete()
      .eq('prospect_id', prospect_id);

    // Créer le nouveau deal
    const dealData = {
      organization_id: context.organization.id,
      prospect_id,
      product_id,
      advisor_id: context.user.id,
      client_amount,
      notes
    };

    const { data: deal, error } = await adminClient
      .from('deal_products')
      .insert(dealData)
      .select(`
        *,
        product:products(*),
        prospect:crm_prospects(id, first_name, last_name, email),
        advisor:users(id, full_name, email)
      `)
      .single();

    if (error) {
      logger.error('Erreur création deal:', error);
      return NextResponse.json({ error: 'Erreur lors de la création du deal' }, { status: 500 });
    }

    return NextResponse.json({
      deal,
      message: 'Deal configuré avec succès'
    });

  } catch (error) {
    logger.error('Erreur API deal-products:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const prospectId = searchParams.get('prospect_id');
    const advisorId = searchParams.get('advisor_id');
    const period = searchParams.get('period') || '30d';

    const adminClient = createAdminClient();

    // Calculer les dates pour la période
    const now = new Date();
    const daysMap = { '7d': 7, '30d': 30, '90d': 90, '6m': 180, '1y': 365 };
    const days = daysMap[period as keyof typeof daysMap] || 30;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    let query = adminClient
      .from('deal_products')
      .select(`
        *,
        product:products(id, name, type, category),
        prospect:crm_prospects(id, first_name, last_name, email),
        advisor:users(id, full_name, email)
      `)
      .eq('organization_id', context.organization.id)
      .gte('closed_at', startDate.toISOString())
      .order('closed_at', { ascending: false });

    if (prospectId) {
      query = query.eq('prospect_id', prospectId);
    }

    if (advisorId) {
      query = query.eq('advisor_id', advisorId);
    }

    // Pour les non-admins, filtrer par leurs propres deals
    if (context.user.role !== 'admin') {
      query = query.eq('advisor_id', context.user.id);
    }

    const { data: deals, error } = await query;

    if (error) {
      logger.error('Erreur récupération deals:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ deals: deals || [] });

  } catch (error) {
    logger.error('Erreur API get deals:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}