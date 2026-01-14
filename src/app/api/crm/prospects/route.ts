import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET : Liste des prospects avec filtres
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer l'organization_id de l'utilisateur
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_id', user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const stages = searchParams.getAll('stage');
    const qualifications = searchParams.getAll('qualification');
    const assigned_to = searchParams.get('assigned_to');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('crm_prospects')
      .select(`
        *,
        stage:pipeline_stages(id, name, slug, color, position),
        assigned_user:users!crm_prospects_assigned_to_fkey(id, full_name, email)
      `, { count: 'exact' })
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false });

    // Filtres
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    if (stages.length > 0) {
      query = query.in('stage_slug', stages);
    }

    if (qualifications.length > 0) {
      query = query.in('qualification', qualifications);
    }

    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      prospects: data,
      total: count,
      limit,
      offset
    });

  } catch (error: any) {
    console.error('Error fetching prospects:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST : Créer un nouveau prospect
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('auth_id', user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 404 });
    }

    const body = await request.json();

    // Récupérer le stage par défaut si non fourni
    let stage_id = body.stage_id;
    let stage_slug = body.stage_slug || 'nouveau';

    if (!stage_id) {
      const { data: defaultStage } = await supabase
        .from('pipeline_stages')
        .select('id, slug')
        .eq('organization_id', userData.organization_id)
        .eq('slug', stage_slug)
        .single();

      if (defaultStage) {
        stage_id = defaultStage.id;
        stage_slug = defaultStage.slug;
      }
    }

    const { data, error } = await supabase
      .from('crm_prospects')
      .insert({
        organization_id: userData.organization_id,
        ...body,
        stage_id,
        stage_slug,
        assigned_to: body.assigned_to || userData.id,
        tags: body.tags || [],
      })
      .select(`
        *,
        stage:pipeline_stages(id, name, slug, color),
        assigned_user:users!crm_prospects_assigned_to_fkey(id, full_name, email)
      `)
      .single();

    if (error) throw error;

    // Créer une activité pour la création
    await supabase.from('crm_activities').insert({
      organization_id: userData.organization_id,
      prospect_id: data.id,
      user_id: userData.id,
      type: 'note',
      subject: 'Prospect créé',
      content: `Prospect créé par ${user.email}`,
    });

    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    console.error('Error creating prospect:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
