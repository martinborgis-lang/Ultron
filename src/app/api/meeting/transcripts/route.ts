import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import type { MeetingTranscript } from '@/types/meeting';

export const dynamic = 'force-dynamic';

/**
 * GET /api/meeting/transcripts
 * List meeting transcripts for the current user's organization
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const prospectId = searchParams.get('prospect_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const adminClient = createAdminClient();

    let query = adminClient
      .from('meeting_transcripts')
      .select(`
        id,
        prospect_id,
        user_id,
        meeting_date,
        duration_seconds,
        ai_summary,
        key_points,
        next_actions,
        pdf_url,
        google_meet_link,
        created_at,
        crm_prospects (
          id,
          first_name,
          last_name,
          email
        ),
        users (
          id,
          full_name,
          email
        )
      `)
      .eq('organization_id', context.organization.id)
      .order('meeting_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (prospectId) {
      query = query.eq('prospect_id', prospectId);
    }

    const { data: transcripts, error } = await query;

    if (error) {
      console.error('Error fetching transcripts:', error);
      return NextResponse.json({ error: 'Erreur de chargement' }, { status: 500 });
    }

    // Count total
    const { count } = await adminClient
      .from('meeting_transcripts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', context.organization.id);

    return NextResponse.json({
      transcripts: transcripts || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Meeting transcripts error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
