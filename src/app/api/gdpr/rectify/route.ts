import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';

export const dynamic = 'force-dynamic';

const ALLOWED_FIELDS = [
  'first_name', 'last_name', 'email', 'phone',
  'address', 'city', 'postal_code', 'company',
];

export async function PATCH(request: NextRequest) {
  const context = await getCurrentUserAndOrganization();
  if (!context) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { prospect_id, corrections } = await request.json();

  if (!prospect_id || !corrections) {
    return NextResponse.json({ error: 'prospect_id et corrections requis' }, { status: 400 });
  }

  // Filtrer aux champs autorisés
  const safeCorrections: Record<string, any> = {};
  for (const [key, value] of Object.entries(corrections)) {
    if (ALLOWED_FIELDS.includes(key)) {
      safeCorrections[key] = value;
    }
  }

  if (Object.keys(safeCorrections).length === 0) {
    return NextResponse.json({
      error: 'Aucun champ valide',
      allowed_fields: ALLOWED_FIELDS,
    }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from('crm_prospects')
    .update({ ...safeCorrections, updated_at: new Date().toISOString() })
    .eq('id', prospect_id)
    .eq('organization_id', context.organization.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Prospect non trouvé' }, { status: 404 });
  }

  return NextResponse.json({ success: true, prospect: data });
}