import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// PATCH : Mettre à jour une tâche
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();

    // Si on complète la tâche, enregistrer la date
    if (body.is_completed === true) {
      body.completed_at = new Date().toISOString();
    } else if (body.is_completed === false) {
      body.completed_at = null;
    }

    const { data, error } = await supabase
      .from('crm_tasks')
      .update(body)
      .eq('id', id)
      .select(`
        *,
        prospect:crm_prospects(id, first_name, last_name, company)
      `)
      .single();

    if (error) throw error;

    // Si tâche complétée et liée à un prospect, créer une activité
    if (body.is_completed && data.prospect_id) {
      const { data: userData } = await supabase
        .from('users')
        .select('id, organization_id')
        .eq('auth_id', user.id)
        .single();

      await supabase.from('crm_activities').insert({
        organization_id: userData?.organization_id,
        prospect_id: data.prospect_id,
        user_id: userData?.id,
        type: 'task_completed',
        subject: `Tâche complétée: ${data.title}`,
      });
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE : Supprimer une tâche
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { error } = await supabase
      .from('crm_tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
