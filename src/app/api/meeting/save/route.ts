import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { corsHeaders } from '@/lib/cors';
import { generateTranscriptHtml, generateTranscriptText } from '@/lib/pdf-generator';
import type { TranscriptSegment, ObjectionDetected, SaveMeetingRequest, SaveMeetingResponse } from '@/types/meeting';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic();

// Handle preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

const SUMMARY_SYSTEM_PROMPT = `Tu es un assistant spécialisé dans l'analyse de conversations commerciales pour conseillers en gestion de patrimoine (CGP).

Analyse le transcript de cette réunion et fournis:
1. Un résumé concis (2-3 paragraphes)
2. Les points clés de la conversation (5-7 bullet points)
3. Les objections détectées avec les réponses suggérées
4. Les prochaines actions à entreprendre

Réponds TOUJOURS en JSON valide avec cette structure:
{
  "summary": "Résumé de la réunion...",
  "keyPoints": ["Point 1", "Point 2", ...],
  "objections": [
    {
      "timestamp": 120,
      "objection": "Description de l'objection",
      "suggested_response": "Réponse suggérée",
      "category": "price|trust|timing|competition|need|other"
    }
  ],
  "nextActions": ["Action 1", "Action 2", ...]
}`;

/**
 * POST /api/meeting/save
 * Save meeting transcript and generate AI analysis
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token and get user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401, headers: corsHeaders() }
      );
    }

    // Get user's organization
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('id, organization_id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404, headers: corsHeaders() }
      );
    }

    const body: SaveMeetingRequest = await request.json();
    const { prospect_id, google_meet_link, transcript_segments, duration_seconds } = body;

    if (!transcript_segments || transcript_segments.length === 0) {
      return NextResponse.json(
        { error: 'Transcript vide' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Generate full transcript text
    const transcriptText = generateTranscriptText(transcript_segments);

    // Get AI analysis
    let aiAnalysis: {
      summary: string;
      keyPoints: string[];
      objections: ObjectionDetected[];
      nextActions: string[];
    } = {
      summary: '',
      keyPoints: [],
      objections: [],
      nextActions: [],
    };

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: SUMMARY_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Voici le transcript de la réunion:\n\n${transcriptText}\n\nAnalyse cette conversation.`,
          },
        ],
      });

      const textContent = response.content.find(c => c.type === 'text');
      if (textContent && textContent.type === 'text') {
        try {
          aiAnalysis = JSON.parse(textContent.text);
        } catch {
          console.error('Failed to parse AI analysis JSON');
        }
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      // Continue without AI analysis
    }

    // Get prospect name if available
    let prospectName = 'Prospect';
    if (prospect_id) {
      const { data: prospect } = await adminClient
        .from('crm_prospects')
        .select('first_name, last_name')
        .eq('id', prospect_id)
        .single();

      if (prospect) {
        prospectName = `${prospect.first_name || ''} ${prospect.last_name || ''}`.trim() || 'Prospect';
      }
    }

    // Generate PDF HTML
    const pdfHtml = generateTranscriptHtml({
      prospectName,
      meetingDate: new Date(),
      duration: duration_seconds,
      segments: transcript_segments,
      summary: aiAnalysis.summary,
      keyPoints: aiAnalysis.keyPoints,
      objections: aiAnalysis.objections,
      nextActions: aiAnalysis.nextActions,
    });

    // Store HTML in Supabase Storage (can be converted to PDF client-side or via a service)
    let pdfUrl: string | null = null;
    try {
      const fileName = `transcripts/${userData.organization_id}/${Date.now()}-${prospect_id || 'unknown'}.html`;

      const { error: uploadError } = await adminClient.storage
        .from('meeting-transcripts')
        .upload(fileName, pdfHtml, {
          contentType: 'text/html',
          upsert: false,
        });

      if (!uploadError) {
        const { data: urlData } = adminClient.storage
          .from('meeting-transcripts')
          .getPublicUrl(fileName);

        pdfUrl = urlData.publicUrl;
      }
    } catch (error) {
      console.error('PDF upload error:', error);
      // Continue without PDF URL
    }

    // Save to database
    const { data: meeting, error: insertError } = await adminClient
      .from('meeting_transcripts')
      .insert({
        organization_id: userData.organization_id,
        prospect_id: prospect_id || null,
        user_id: userData.id,
        meeting_date: new Date().toISOString(),
        duration_seconds,
        transcript_text: transcriptText,
        transcript_json: transcript_segments,
        ai_summary: aiAnalysis.summary || null,
        key_points: aiAnalysis.keyPoints.length > 0 ? aiAnalysis.keyPoints : null,
        objections_detected: aiAnalysis.objections.length > 0 ? aiAnalysis.objections : null,
        next_actions: aiAnalysis.nextActions.length > 0 ? aiAnalysis.nextActions : null,
        pdf_url: pdfUrl,
        google_meet_link: google_meet_link || null,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde' },
        { status: 500, headers: corsHeaders() }
      );
    }

    // Log activity if prospect is linked
    if (prospect_id) {
      await adminClient.from('crm_activities').insert({
        organization_id: userData.organization_id,
        prospect_id,
        user_id: userData.id,
        type: 'meeting',
        subject: 'Réunion enregistrée',
        content: aiAnalysis.summary || `Réunion de ${Math.floor(duration_seconds / 60)} minutes`,
        duration_minutes: Math.ceil(duration_seconds / 60),
        metadata: { meeting_id: meeting.id },
      });
    }

    const response: SaveMeetingResponse = {
      id: meeting.id,
      ai_summary: aiAnalysis.summary,
      key_points: aiAnalysis.keyPoints,
      objections_detected: aiAnalysis.objections,
      next_actions: aiAnalysis.nextActions,
      pdf_url: pdfUrl,
    };

    return NextResponse.json(response, { headers: corsHeaders() });
  } catch (error) {
    console.error('Meeting save error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
