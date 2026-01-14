import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Auth check with regular client
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    // Use admin client for database operations (bypasses RLS)
    const adminClient = createAdminClient();

    const { data: userData } = await adminClient
      .from('users')
      .select('id, organization_id')
      .eq('auth_id', user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'Organisation non trouvee' }, { status: 404 });
    }

    const body = await request.json();
    const { prospects, mapping } = body;

    if (!prospects || !Array.isArray(prospects) || prospects.length === 0) {
      return NextResponse.json({ error: 'Aucun prospect a importer' }, { status: 400 });
    }

    // Recuperer le stage par defaut
    const { data: defaultStage } = await adminClient
      .from('pipeline_stages')
      .select('id, slug')
      .eq('organization_id', userData.organization_id)
      .eq('slug', 'nouveau')
      .single();

    // Transformer les prospects selon le mapping
    const transformedProspects = prospects.map((row: Record<string, string>) => {
      const prospect: Record<string, string | number | string[] | null> = {
        organization_id: userData.organization_id,
        stage_id: defaultStage?.id || null,
        stage_slug: 'nouveau',
        source: 'import',
        assigned_to: userData.id,
        qualification: 'non_qualifie',
      };

      // Appliquer le mapping
      Object.entries(mapping).forEach(([sourceCol, targetField]) => {
        if (targetField && row[sourceCol] !== undefined && row[sourceCol] !== '') {
          let value: string | number | string[] | null = row[sourceCol];

          // Conversion de types pour certains champs
          if (['patrimoine_estime', 'revenus_annuels', 'deal_value'].includes(targetField as string)) {
            // Nettoyer les valeurs numeriques (enlever EUR, espaces, etc.)
            value = parseFloat(String(value).replace(/[^\d.-]/g, '')) || null;
          } else if (['age', 'nb_enfants', 'close_probability'].includes(targetField as string)) {
            value = parseInt(String(value).replace(/[^\d-]/g, '')) || null;
          } else if (targetField === 'tags' && typeof value === 'string') {
            value = value.split(',').map((t: string) => t.trim()).filter(Boolean);
          }

          prospect[targetField as string] = value;
        }
      });

      return prospect;
    });

    // Filtrer les prospects valides (au moins un nom ou email)
    const validProspects = transformedProspects.filter(
      (p) => p.first_name || p.last_name || p.email || p.company
    );

    if (validProspects.length === 0) {
      return NextResponse.json({
        error: 'Aucun prospect valide trouve. Verifiez le mapping des colonnes.',
      }, { status: 400 });
    }

    // Inserer les prospects par batch de 100
    const batchSize = 100;
    let imported = 0;
    const errors: string[] = [];

    for (let i = 0; i < validProspects.length; i += batchSize) {
      const batch = validProspects.slice(i, i + batchSize);

      const { data, error } = await adminClient
        .from('crm_prospects')
        .insert(batch)
        .select('id');

      if (error) {
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        imported += data?.length || 0;
      }
    }

    // Creer une activite pour l'import
    await adminClient.from('crm_activities').insert({
      organization_id: userData.organization_id,
      user_id: userData.id,
      type: 'note',
      subject: `Import de ${imported} prospects`,
      content: `${imported} prospects importes depuis un fichier CSV/Sheet`,
    });

    return NextResponse.json({
      success: true,
      imported,
      total: validProspects.length,
      skipped: prospects.length - validProspects.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: unknown) {
    console.error('Import error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
