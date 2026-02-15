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

    // Construction de la requête avec JOIN sur prospects
    let query = supabase
      .from('phone_calls')
      .select(`
        id,
        vapi_call_id,
        vapi_assistant_id,
        twilio_call_sid,
        prospect_id,
        to_number,
        from_number,
        status,
        outcome,
        duration_seconds,
        started_at,
        ended_at,
        scheduled_call_at,
        transcript,
        ai_analysis,
        source,
        processing_notes,
        error_message,
        created_at,
        updated_at,
        crm_prospects:prospect_id (
          id,
          first_name,
          last_name,
          email,
          phone,
          qualification,
          score_ia,
          analyse_ia
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

    // Transformation des données pour inclure les infos prospect
    const formattedCalls = calls?.map((call: any) => ({
      ...call,
      // Infos prospect depuis le JOIN
      prospect_name: call.crm_prospects
        ? `${call.crm_prospects.first_name || ''} ${call.crm_prospects.last_name || ''}`.trim()
        : 'Prospect inconnu',
      qualification_score: call.crm_prospects?.score_ia || 0,
      qualification: call.crm_prospects?.qualification || 'non_qualifie',
      prospect_analysis: call.crm_prospects?.analyse_ia || call.ai_analysis
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