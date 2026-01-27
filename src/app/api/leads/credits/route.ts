import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { LeadCreditsResponse } from '@/types/leads';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer l'organisation de l'utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData?.organization_id) {
      console.error('[Lead Credits] User error:', userError);
      return NextResponse.json(
        { error: 'Organisation non trouvée' },
        { status: 400 }
      );
    }

    const organizationId = userData.organization_id;

    // Récupérer ou créer les crédits
    let { data: credits, error: creditsError } = await supabase
      .from('lead_credits')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (creditsError && creditsError.code === 'PGRST116') {
      // Pas de crédits trouvés, créer avec des crédits de démo
      console.log('[Lead Credits] Creating initial credits for org:', organizationId);

      const { data: newCredits, error: createError } = await supabase
        .from('lead_credits')
        .insert({
          organization_id: organizationId,
          credits_total: 10, // Crédits de démo
          credits_used: 0,
        })
        .select()
        .single();

      if (createError) {
        console.error('[Lead Credits] Error creating credits:', createError);
        return NextResponse.json(
          { error: 'Erreur lors de la création des crédits' },
          { status: 500 }
        );
      }

      credits = newCredits;
    } else if (creditsError) {
      console.error('[Lead Credits] Error fetching credits:', creditsError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des crédits' },
        { status: 500 }
      );
    }

    const response: LeadCreditsResponse = {
      total: credits?.credits_total || 0,
      used: credits?.credits_used || 0,
      available: (credits?.credits_total || 0) - (credits?.credits_used || 0),
      last_purchase_date: credits?.last_purchase_date,
      last_usage_date: credits?.last_usage_date,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Lead Credits] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// Endpoint pour ajouter des crédits (admin uniquement)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return NextResponse.json(
        { error: 'Organisation non trouvée' },
        { status: 400 }
      );
    }

    if (userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé - Admin requis' },
        { status: 403 }
      );
    }

    // Récupérer les paramètres de la requête
    const body = await request.json();
    const { credits } = body;

    if (!credits || credits <= 0) {
      return NextResponse.json(
        { error: 'Nombre de crédits invalide' },
        { status: 400 }
      );
    }

    // Récupérer les crédits actuels puis les mettre à jour
    const { data: currentCredits, error: fetchError } = await supabase
      .from('lead_credits')
      .select('credits_total')
      .eq('organization_id', userData.organization_id)
      .single();

    if (fetchError) {
      console.error('[Lead Credits] Error fetching current credits:', fetchError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des crédits actuels' },
        { status: 500 }
      );
    }

    // Ajouter les crédits
    const newTotal = (currentCredits?.credits_total || 0) + credits;
    const { data: updatedCredits, error: updateError } = await supabase
      .from('lead_credits')
      .update({
        credits_total: newTotal,
        last_purchase_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', userData.organization_id)
      .select()
      .single();

    if (updateError) {
      console.error('[Lead Credits] Error adding credits:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'ajout des crédits' },
        { status: 500 }
      );
    }

    const response: LeadCreditsResponse = {
      total: updatedCredits?.credits_total || 0,
      used: updatedCredits?.credits_used || 0,
      available: (updatedCredits?.credits_total || 0) - (updatedCredits?.credits_used || 0),
      last_purchase_date: updatedCredits?.last_purchase_date,
      last_usage_date: updatedCredits?.last_usage_date,
    };

    return NextResponse.json({
      message: `${credits} crédits ajoutés avec succès`,
      credits: response,
    });

  } catch (error) {
    console.error('[Lead Credits] Unexpected error in POST:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}