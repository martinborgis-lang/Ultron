import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET : Détail d'un prospect
export async function GET(
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

    const { data, error } = await supabase
      .from('crm_prospects')
      .select(`
        *,
        stage:pipeline_stages(id, name, slug, color, position, is_won, is_lost),
        assigned_user:users!crm_prospects_assigned_to_fkey(id, full_name, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Prospect non trouvé' }, { status: 404 });
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error fetching prospect:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH : Mettre à jour un prospect
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

    const { data: userData } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('auth_id', user.id)
      .single();

    const body = await request.json();

    // Récupérer l'ancien prospect pour comparer les changements
    const { data: oldProspect } = await supabase
      .from('crm_prospects')
      .select('stage_slug, qualification')
      .eq('id', id)
      .single();

    // Si le stage change, mettre à jour stage_id aussi
    if (body.stage_slug && body.stage_slug !== oldProspect?.stage_slug) {
      const { data: newStage } = await supabase
        .from('pipeline_stages')
        .select('id, slug, is_won, is_lost')
        .eq('organization_id', userData?.organization_id)
        .eq('slug', body.stage_slug)
        .single();

      if (newStage) {
        body.stage_id = newStage.id;

        // Si gagné ou perdu, mettre à jour les dates
        if (newStage.is_won) {
          body.won_date = new Date().toISOString();
        } else if (newStage.is_lost) {
          body.lost_date = new Date().toISOString();
        }
      }
    }

    body.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('crm_prospects')
      .update(body)
      .eq('id', id)
      .select(`
        *,
        stage:pipeline_stages(id, name, slug, color),
        assigned_user:users!crm_prospects_assigned_to_fkey(id, full_name, email)
      `)
      .single();

    if (error) throw error;

    // Créer une activité si le stage a changé
    if (body.stage_slug && body.stage_slug !== oldProspect?.stage_slug) {
      await supabase.from('crm_activities').insert({
        organization_id: userData?.organization_id,
        prospect_id: id,
        user_id: userData?.id,
        type: 'stage_change',
        subject: `Stage changé vers "${body.stage_slug}"`,
        metadata: {
          old_stage: oldProspect?.stage_slug,
          new_stage: body.stage_slug
        }
      });
    }

    // Créer une activité si la qualification a changé
    if (body.qualification && body.qualification !== oldProspect?.qualification) {
      await supabase.from('crm_activities').insert({
        organization_id: userData?.organization_id,
        prospect_id: id,
        user_id: userData?.id,
        type: 'qualification',
        subject: `Qualification: ${body.qualification}`,
        metadata: {
          old_qualification: oldProspect?.qualification,
          new_qualification: body.qualification
        }
      });
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error updating prospect:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE : Supprimer un prospect
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
      .from('crm_prospects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error deleting prospect:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
