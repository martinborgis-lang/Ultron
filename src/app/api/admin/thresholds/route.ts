import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

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
    const { organization_id, thresholds } = body;

    // Vérifier que c'est bien l'organisation de l'utilisateur
    if (organization_id !== context.organization.id) {
      return NextResponse.json({ error: 'Organisation non autorisée' }, { status: 403 });
    }

    const adminClient = createAdminClient();

    // Récupérer la config actuelle
    const { data: currentOrg } = await adminClient
      .from('organizations')
      .select('scoring_config')
      .eq('id', organization_id)
      .single();

    const currentConfig = currentOrg?.scoring_config || {};

    // Fusionner avec les nouveaux seuils
    const updatedConfig = {
      ...currentConfig,
      admin_thresholds: thresholds
    };

    // Mettre à jour la configuration
    const { error } = await adminClient
      .from('organizations')
      .update({
        scoring_config: updatedConfig,
        updated_at: new Date().toISOString()
      })
      .eq('id', organization_id);

    if (error) {
      console.error('Erreur mise à jour seuils:', error);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Seuils mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur API thresholds:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

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

    const { data: organization } = await adminClient
      .from('organizations')
      .select('scoring_config')
      .eq('id', context.organization.id)
      .single();

    const thresholds = organization?.scoring_config?.admin_thresholds || {};

    return NextResponse.json({ thresholds });

  } catch (error) {
    console.error('Erreur API get thresholds:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}