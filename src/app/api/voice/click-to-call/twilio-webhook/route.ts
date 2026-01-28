import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TranscriptionService } from '@/lib/services/transcription-service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extraction des données du webhook Twilio
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const callDuration = formData.get('CallDuration') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;

    if (!callSid) {
      return NextResponse.json({ error: 'CallSid manquant' }, { status: 400 });
    }

    console.log('Twilio Webhook:', { callSid, callStatus, callDuration, from, to });

    const supabase = await createClient();

    // Mise à jour du statut de l'appel dans la base de données
    const updateData: any = {
      status: callStatus,
      updated_at: new Date().toISOString()
    };

    if (callDuration) {
      updateData.duration_seconds = parseInt(callDuration);
    }

    if (recordingUrl) {
      updateData.recording_url = recordingUrl;
    }

    if (callStatus === 'completed') {
      updateData.ended_at = new Date().toISOString();
    } else if (callStatus === 'in-progress') {
      updateData.started_at = new Date().toISOString();
    }

    const { data: callData, error } = await supabase
      .from('voice_calls')
      .update(updateData)
      .eq('twilio_call_sid', callSid)
      .select()
      .single();

    if (error) {
      console.error('Erreur mise à jour appel:', error);
      return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 });
    }

    // Si l'appel est terminé et qu'il y a un enregistrement, traiter la transcription
    if (callStatus === 'completed' && recordingUrl && callData) {
      try {
        await processCallTranscription(callData, recordingUrl);
      } catch (transcriptionError) {
        console.error('Erreur transcription:', transcriptionError);
        // Ne pas faire échouer le webhook si la transcription échoue
      }
    }

    return NextResponse.json({ status: 'success' });

  } catch (error) {
    console.error('Erreur webhook Twilio:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

async function processCallTranscription(callData: any, recordingUrl: string) {
  try {
    const supabase = await createClient();

    // Marquer le traitement comme démarré
    await supabase
      .from('voice_calls')
      .update({
        transcription_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', callData.id);

    // Transcription avec Deepgram
    const transcriptionResult = await TranscriptionService.transcribeFromUrl(recordingUrl, {
      language: 'fr',
      diarize: true,
      punctuate: true
    });

    // Analyse IA avec Claude
    const aiAnalysis = await TranscriptionService.generateAISummary(
      transcriptionResult.transcript,
      callData.prospect_name,
      callData.duration_seconds
    );

    // Analyse du sentiment
    const sentiment = await TranscriptionService.analyzeSentiment(transcriptionResult.transcript);

    // Sauvegarde des résultats
    await supabase
      .from('voice_calls')
      .update({
        transcript: transcriptionResult.transcript,
        transcript_confidence: transcriptionResult.confidence,
        ai_summary: aiAnalysis.summary,
        ai_key_points: aiAnalysis.keyPoints,
        ai_next_actions: aiAnalysis.nextActions,
        ai_objections: aiAnalysis.objections,
        ai_outcome: aiAnalysis.outcome,
        sentiment_overall: sentiment.overall,
        sentiment_score: sentiment.score,
        transcription_status: 'completed',
        transcription_processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', callData.id);

    // Si c'est lié à un prospect, créer une activité avec l'analyse IA
    if (callData.prospect_id) {
      await supabase
        .from('crm_activities')
        .insert({
          organization_id: callData.organization_id,
          prospect_id: callData.prospect_id,
          user_id: callData.user_id,
          type: 'call',
          direction: 'outbound',
          subject: `Appel analysé - ${aiAnalysis.outcome}`,
          content: `${aiAnalysis.summary}\n\nPoints clés:\n${aiAnalysis.keyPoints.join('\n- ')}\n\nProchaines actions:\n${aiAnalysis.nextActions.join('\n- ')}`,
          outcome: aiAnalysis.outcome,
          duration_minutes: Math.round(callData.duration_seconds / 60),
          metadata: {
            call_sid: callData.twilio_call_sid,
            ai_processed: true,
            sentiment: sentiment.overall,
            transcript_available: true
          }
        });

      // Mise à jour de la qualification du prospect si nécessaire
      if (aiAnalysis.outcome && ['rdv_pris', 'pas_interesse', 'callback_demande'].includes(aiAnalysis.outcome)) {
        const stageMapping: { [key: string]: string } = {
          'rdv_pris': 'rdv_pris',
          'pas_interesse': 'perdu',
          'callback_demande': 'callback'
        };

        const newStage = stageMapping[aiAnalysis.outcome];
        if (newStage) {
          await supabase
            .from('crm_prospects')
            .update({
              stage_slug: newStage,
              last_activity_at: new Date().toISOString()
            })
            .eq('id', callData.prospect_id)
            .eq('organization_id', callData.organization_id);
        }
      }
    }

    console.log('Transcription terminée avec succès pour l\'appel:', callData.twilio_call_sid);

  } catch (error) {
    console.error('Erreur traitement transcription:', error);

    // Marquer l'échec de la transcription
    const supabase = await createClient();
    await supabase
      .from('voice_calls')
      .update({
        transcription_status: 'failed',
        transcription_error: error instanceof Error ? error.message : 'Erreur inconnue',
        updated_at: new Date().toISOString()
      })
      .eq('id', callData.id);

    throw error;
  }
}