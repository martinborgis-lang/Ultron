import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extraction des données du webhook d'enregistrement Twilio
    const callSid = formData.get('CallSid') as string;
    const recordingSid = formData.get('RecordingSid') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;
    const recordingStatus = formData.get('RecordingStatus') as string;
    const recordingDuration = formData.get('RecordingDuration') as string;
    const recordingChannels = formData.get('RecordingChannels') as string;

    if (!callSid || !recordingSid) {
      return NextResponse.json({ error: 'CallSid et RecordingSid requis' }, { status: 400 });
    }

    console.log('Recording Webhook:', {
      callSid,
      recordingSid,
      recordingUrl,
      recordingStatus,
      recordingDuration
    });

    const supabase = createClient();

    // Mise à jour de l'appel avec les informations d'enregistrement
    const updateData: any = {
      recording_sid: recordingSid,
      recording_status: recordingStatus,
      updated_at: new Date().toISOString()
    };

    if (recordingUrl) {
      updateData.recording_url = recordingUrl;
    }

    if (recordingDuration) {
      updateData.recording_duration_seconds = parseInt(recordingDuration);
    }

    if (recordingChannels) {
      updateData.recording_channels = parseInt(recordingChannels);
    }

    const { data: callData, error } = await supabase
      .from('voice_calls')
      .update(updateData)
      .eq('twilio_call_sid', callSid)
      .select()
      .single();

    if (error) {
      console.error('Erreur mise à jour enregistrement:', error);
      return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 });
    }

    // Si l'enregistrement est prêt, déclencher la transcription
    if (recordingStatus === 'completed' && recordingUrl) {
      // Note: La transcription est déjà gérée dans le webhook principal
      // Ici on pourrait ajouter des traitements supplémentaires spécifiques à l'enregistrement

      console.log(`Enregistrement prêt pour l'appel ${callSid}: ${recordingUrl}`);

      // Log de l'activité
      if (callData?.organization_id && callData?.user_id) {
        await supabase
          .from('activity_logs')
          .insert({
            organization_id: callData.organization_id,
            user_id: callData.user_id,
            action: 'recording_ready',
            entity_type: 'call',
            entity_id: callData.id,
            details: {
              call_sid: callSid,
              recording_sid: recordingSid,
              recording_url: recordingUrl,
              duration: recordingDuration
            }
          });
      }
    }

    return NextResponse.json({ status: 'success' });

  } catch (error) {
    console.error('Erreur webhook enregistrement:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}