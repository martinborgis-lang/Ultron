import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer l'organization de l'user
    const adminClient = createAdminClient();
    const { data: userData } = await adminClient
      .from('users')
      .select('organization_id')
      .eq('auth_id', user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'Pas d\'organisation' }, { status: 400 });
    }

    const filter = request.nextUrl.searchParams.get('filter') || 'today';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let query = adminClient
      .from('crm_events')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('due_date', { ascending: true, nullsFirst: false });

    // Appliquer les filtres
    switch (filter) {
      case 'today':
        query = query
          .gte('due_date', today.toISOString())
          .lt('due_date', tomorrow.toISOString());
        break;
      case 'overdue':
        query = query
          .lt('due_date', today.toISOString())
          .neq('status', 'completed');
        break;
      case 'upcoming':
        query = query.gte('due_date', tomorrow.toISOString());
        break;
      // 'all' = pas de filtre date
    }

    const { data, error } = await query;

    if (error) throw error;

    // Formater pour le frontend
    const formatted = (data || []).map(e => ({
      id: e.id,
      type: e.type,
      title: e.title,
      description: e.description,
      startDate: e.start_date,
      endDate: e.end_date,
      dueDate: e.due_date,
      allDay: e.all_day,
      status: e.status,
      completedAt: e.completed_at,
      prospectId: e.prospect_id,
      prospectName: e.prospect_name,
      priority: e.priority,
      createdAt: e.created_at,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('GET /api/planning error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { data: userData } = await adminClient
      .from('users')
      .select('organization_id')
      .eq('auth_id', user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'Pas d\'organisation' }, { status: 400 });
    }

    const body = await request.json();

    const { data, error } = await adminClient
      .from('crm_events')
      .insert({
        organization_id: userData.organization_id,
        type: body.type || 'task',
        title: body.title,
        description: body.description,
        start_date: body.start_date,
        end_date: body.end_date,
        due_date: body.due_date,
        all_day: body.all_day || false,
        priority: body.priority || 'medium',
        prospect_id: body.prospect_id,
        prospect_name: body.prospect_name,
        assigned_to: user.id,
        created_by: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('POST /api/planning error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
