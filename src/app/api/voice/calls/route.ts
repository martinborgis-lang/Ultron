import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const result = await getCurrentUserAndOrganization();
  if (!result) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const { user, organization } = result;

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const outcome = searchParams.get('outcome');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const supabase = await createClient();

    // Construction de la requête
    let query = supabase
      .from('voice_calls')
      .select(`
        id,
        twilio_call_sid,
        prospect_id,
        prospect_name,
        phone_number,
        direction,
        status,
        outcome,
        duration_seconds,
        recording_url,
        transcript,
        ai_summary,
        ai_key_points,
        ai_next_actions,
        ai_objections,
        ai_outcome,
        sentiment_overall,
        sentiment_score,
        notes,
        created_at,
        started_at,
        ended_at,
        user_id,
        users:user_id (
          full_name,
          email
        )
      `)
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false });

    // Filtres
    if (status) {
      query = query.eq('status', status);
    }

    if (outcome) {
      query = query.eq('outcome', outcome);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Pagination
    if (limit > 0) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data: calls, error } = await query;

    if (error) {
      console.error('Erreur récupération appels:', error);
      return NextResponse.json({ error: 'Erreur récupération des données' }, { status: 500 });
    }

    // Transformation des données pour inclure le nom d'utilisateur
    const formattedCalls = calls?.map(call => ({
      ...call,
      user_name: (call as any).users?.full_name || (call as any).users?.email
    })) || [];

    return NextResponse.json({
      calls: formattedCalls,
      total: formattedCalls.length,
      limit,
      offset
    });

  } catch (error) {
    console.error('Erreur API calls:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}