import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';

export const dynamic = 'force-dynamic';

/**
 * GET /api/meeting/transcripts/[id]
 * Get a single meeting transcript with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const adminClient = createAdminClient();

    const { data: transcript, error } = await adminClient
      .from('meeting_transcripts')
      .select(`
        *,
        crm_prospects (
          id,
          first_name,
          last_name,
          email,
          phone,
          qualification,
          score_ia
        ),
        users (
          id,
          full_name,
          email
        )
      `)
      .eq('id', id)
      .eq('organization_id', context.organization.id)
      .single();

    if (error || !transcript) {
      return NextResponse.json({ error: 'Transcript non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error('Meeting transcript error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/meeting/transcripts/[id]
 * Delete a meeting transcript
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from('meeting_transcripts')
      .delete()
      .eq('id', id)
      .eq('organization_id', context.organization.id);

    if (error) {
      console.error('Error deleting transcript:', error);
      return NextResponse.json({ error: 'Erreur de suppression' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Meeting transcript delete error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
