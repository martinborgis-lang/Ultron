import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase-admin';
import PaginationHelper, { COMMON_SORT_FIELDS } from '@/lib/pagination/pagination-helper';

export const dynamic = 'force-dynamic';

// GET : Liste des activités (pour un prospect ou globales)
export async function GET(request: NextRequest) {
  try {
    // Auth check with regular client
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Use admin client for database operations (bypasses RLS)
    const adminClient = createAdminClient();

    const { data: userData } = await adminClient
      .from('users')
      .select('organization_id')
      .eq('auth_id', user.id)
      .single();

    // ✅ PAGINATION : Parse des paramètres standardisés
    const paginationParams = PaginationHelper.parseParams(request.nextUrl.searchParams);

    // Validation du champ de tri pour la sécurité
    const safeSort = PaginationHelper.validateSortField(
      paginationParams.sort || 'created_at',
      [...COMMON_SORT_FIELDS.ACTIVITIES]
    );

    const searchParams = request.nextUrl.searchParams;
    const prospect_id = searchParams.get('prospect_id');

    let query = adminClient
      .from('crm_activities')
      .select(`
        *,
        user:users(id, full_name)
      `, { count: 'exact' })
      .eq('organization_id', userData?.organization_id)
      .order(safeSort, { ascending: paginationParams.order === 'asc' });

    if (prospect_id) {
      query = query.eq('prospect_id', prospect_id);
    }

    // ✅ PAGINATION : Appliquer la pagination à la query Supabase
    query = PaginationHelper.applyToSupabaseQuery(query, paginationParams);

    const { data, error, count } = await query;

    if (error) throw error;

    // ✅ PAGINATION : Créer la réponse paginée standardisée
    const paginatedResponse = PaginationHelper.createResponse(
      data || [],
      count || 0,
      paginationParams
    );

    return NextResponse.json({
      ...paginatedResponse,
      meta: {
        ...paginatedResponse.pagination,
        filters: { prospect_id }
      }
    });

  } catch (error: any) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST : Créer une activité
export async function POST(request: NextRequest) {
  try {
    // Auth check with regular client
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Use admin client for database operations (bypasses RLS)
    const adminClient = createAdminClient();

    const { data: userData } = await adminClient
      .from('users')
      .select('id, organization_id')
      .eq('auth_id', user.id)
      .single();

    const body = await request.json();

    const { data, error } = await adminClient
      .from('crm_activities')
      .insert({
        organization_id: userData?.organization_id,
        user_id: userData?.id,
        ...body
      })
      .select(`
        *,
        user:users(id, full_name)
      `)
      .single();

    if (error) throw error;

    // Mettre à jour last_activity_at sur le prospect
    if (body.prospect_id) {
      await adminClient
        .from('crm_prospects')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', body.prospect_id);
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
