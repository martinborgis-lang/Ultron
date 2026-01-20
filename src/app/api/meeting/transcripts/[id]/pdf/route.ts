import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { generateTranscriptPdf } from '@/lib/pdf-generator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/meeting/transcripts/[id]/pdf
 * Generate and return PDF for a meeting transcript
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

    // Get transcript with all details
    const { data: transcript, error } = await adminClient
      .from('meeting_transcripts')
      .select(`
        *,
        crm_prospects (
          id,
          first_name,
          last_name
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

    // Get organization name
    const { data: organization } = await adminClient
      .from('organizations')
      .select('name')
      .eq('id', context.organization.id)
      .single();

    const organizationName = organization?.name || 'Organisation';
    const advisorName = transcript.users?.full_name || transcript.users?.email || 'Conseiller';
    const prospectName = transcript.crm_prospects
      ? `${transcript.crm_prospects.first_name || ''} ${transcript.crm_prospects.last_name || ''}`.trim() || 'Prospect'
      : 'Prospect';

    // Generate PDF
    const pdfBuffer = generateTranscriptPdf({
      organizationName,
      advisorName,
      prospectName,
      meetingDate: new Date(transcript.meeting_date),
      duration: transcript.duration_seconds || 0,
      segments: transcript.transcript_json || [],
      summary: transcript.ai_summary || undefined,
      keyPoints: transcript.key_points || undefined,
      objections: transcript.objections_detected || undefined,
      nextActions: transcript.next_actions || undefined,
    });

    // Return PDF as download
    const fileName = `reunion-${prospectName.replace(/\s+/g, '-')}-${new Date(transcript.meeting_date).toISOString().split('T')[0]}.pdf`;

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Erreur génération PDF' }, { status: 500 });
  }
}
