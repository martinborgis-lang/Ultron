import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET : Liste des activités (pour un prospect ou globales)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_id', user.id)
      .single();

    const searchParams = request.nextUrl.searchParams;
    const prospect_id = searchParams.get('prospect_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('crm_activities')
      .select(`
        *,
        user:users(id, full_name)
      `)
      .eq('organization_id', userData?.organization_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (prospect_id) {
      query = query.eq('prospect_id', prospect_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST : Créer une activité
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

    const body = await request.json();

    const { data, error } = await supabase
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
      await supabase
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
