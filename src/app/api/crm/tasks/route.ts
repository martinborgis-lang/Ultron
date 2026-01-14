import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// GET : Liste des tâches
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

    const searchParams = request.nextUrl.searchParams;
    const prospect_id = searchParams.get('prospect_id');
    const is_completed = searchParams.get('is_completed');
    const assigned_to = searchParams.get('assigned_to');

    let query = adminClient
      .from('crm_tasks')
      .select(`
        *,
        prospect:crm_prospects(id, first_name, last_name, company),
        assigned_user:users!crm_tasks_assigned_to_fkey(id, full_name)
      `)
      .eq('organization_id', userData?.organization_id)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (prospect_id) {
      query = query.eq('prospect_id', prospect_id);
    }

    if (is_completed !== null) {
      query = query.eq('is_completed', is_completed === 'true');
    }

    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST : Créer une tâche
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
      .from('crm_tasks')
      .insert({
        organization_id: userData?.organization_id,
        created_by: userData?.id,
        assigned_to: body.assigned_to || userData?.id,
        ...body
      })
      .select(`
        *,
        prospect:crm_prospects(id, first_name, last_name, company),
        assigned_user:users!crm_tasks_assigned_to_fkey(id, full_name)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
