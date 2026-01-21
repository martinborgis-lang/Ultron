import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  const context = await getCurrentUserAndOrganization();
  if (!context) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const prospectId = request.nextUrl.searchParams.get('prospect_id');
  if (!prospectId) {
    return NextResponse.json({ error: 'prospect_id requis' }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Vérifier que le prospect existe
  const { data: prospect } = await adminClient
    .from('crm_prospects')
    .select('id, email')
    .eq('id', prospectId)
    .eq('organization_id', context.organization.id)
    .single();

  if (!prospect) {
    return NextResponse.json({ error: 'Prospect non trouvé' }, { status: 404 });
  }

  // Anonymiser le prospect (garde les stats mais supprime les données perso)
  await adminClient
    .from('crm_prospects')
    .update({
      first_name: 'SUPPRIMÉ',
      last_name: 'RGPD',
      email: `deleted-${prospectId.substring(0, 8)}@anonymized.local`,
      phone: null,
      address: null,
      city: null,
      postal_code: null,
      company: null,
      profession: null,
      patrimoine_estime: null,
      revenus_annuels: null,
      situation_familiale: null,
      nb_enfants: null,
      age: null,
      notes: null,
      analyse_ia: null,
      tags: null,
      gdpr_anonymized_at: new Date().toISOString(),
    })
    .eq('id', prospectId);

  // Supprimer les activités détaillées
  await adminClient
    .from('crm_activities')
    .delete()
    .eq('prospect_id', prospectId);

  return NextResponse.json({
    success: true,
    message: 'Données anonymisées avec succès',
  });
}