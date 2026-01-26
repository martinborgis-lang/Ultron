import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Use admin client for database operations
    const adminClient = createAdminClient();

    const { data: userData } = await adminClient
      .from('users')
      .select('id, organization_id')
      .eq('auth_id', user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 404 });
    }

    const body = await request.json();
    const { prospects } = body;

    if (!prospects || !Array.isArray(prospects)) {
      return NextResponse.json({ error: 'Liste de prospects requise' }, { status: 400 });
    }

    // Recherche des doublons pour chaque prospect
    const duplicateChecks = await Promise.all(
      prospects.map(async (prospect: any, index: number) => {
        const { first_name, last_name, email, phone } = prospect;

        // Construire les conditions de recherche
        const searchConditions = [];

        // Recherche par email exact
        if (email && email.trim()) {
          searchConditions.push(`email.eq.${email.trim().toLowerCase()}`);
        }

        // Recherche par téléphone exact
        if (phone && phone.trim()) {
          const cleanPhone = phone.replace(/[\s\-\.\(\)]/g, '');
          searchConditions.push(`phone.eq.${cleanPhone}`);
        }

        // Recherche par nom complet (prénom ET nom)
        if (first_name?.trim() && last_name?.trim()) {
          searchConditions.push(
            `and(first_name.ilike.%${first_name.trim()}%,last_name.ilike.%${last_name.trim()}%)`
          );
        }

        if (searchConditions.length === 0) {
          return {
            index,
            prospect,
            duplicates: [],
            hasDuplicates: false
          };
        }

        try {
          const { data: existingProspects } = await adminClient
            .from('crm_prospects')
            .select('id, first_name, last_name, email, phone, created_at')
            .eq('organization_id', userData.organization_id)
            .or(searchConditions.join(','))
            .limit(10); // Limiter à 10 doublons max

          const duplicates = existingProspects || [];

          return {
            index,
            prospect,
            duplicates: duplicates.map(dup => ({
              id: dup.id,
              name: `${dup.first_name || ''} ${dup.last_name || ''}`.trim(),
              email: dup.email,
              phone: dup.phone,
              created_at: dup.created_at
            })),
            hasDuplicates: duplicates.length > 0
          };

        } catch (error) {
          console.error('Erreur recherche doublons pour prospect', index, error);
          return {
            index,
            prospect,
            duplicates: [],
            hasDuplicates: false,
            error: 'Erreur lors de la vérification'
          };
        }
      })
    );

    // Statistiques
    const totalDuplicates = duplicateChecks.filter(check => check.hasDuplicates).length;
    const totalProspects = prospects.length;

    return NextResponse.json({
      success: true,
      totalProspects,
      totalDuplicates,
      duplicateChecks
    });

  } catch (error: unknown) {
    console.error('Check duplicates error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}