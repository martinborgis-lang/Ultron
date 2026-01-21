import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (context.user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé - Admin requis' }, { status: 403 });
    }

    const { id } = await params;
    const adminClient = createAdminClient();

    // Vérifier que la commission existe et appartient à l'organisation
    const { data: commission, error: fetchError } = await adminClient
      .from('advisor_commissions')
      .select('id')
      .eq('id', id)
      .eq('organization_id', context.organization.id)
      .single();

    if (fetchError || !commission) {
      return NextResponse.json({
        error: 'Commission non trouvée'
      }, { status: 404 });
    }

    // Supprimer la commission
    const { error } = await adminClient
      .from('advisor_commissions')
      .delete()
      .eq('id', id)
      .eq('organization_id', context.organization.id);

    if (error) {
      console.error('Erreur suppression commission:', error);
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Commission supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur API delete commission:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}