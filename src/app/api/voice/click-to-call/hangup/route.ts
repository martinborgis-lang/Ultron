import { NextRequest, NextResponse } from 'next/server';
import { TwilioService } from '@/lib/services/twilio-service';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const result = await getCurrentUserAndOrganization();
  if (!result) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const { user, organization } = result;

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { callSid, outcome, notes } = body;

    if (!callSid) {
      return NextResponse.json({ error: 'Call SID requis' }, { status: 400 });
    }

    // Raccrochage de l'appel via Twilio
    await TwilioService.hangupCall(callSid);

    // Mise à jour de l'appel dans la base de données
    const supabase = await createClient();

    const updateData = {
      status: 'completed',
      ended_at: new Date().toISOString(),
      outcome: outcome || null,
      notes: notes || null,
      updated_at: new Date().toISOString()
    };

    const { data: callData } = await supabase
      .from('voice_calls')
      .update(updateData)
      .eq('twilio_call_sid', callSid)
      .eq('organization_id', organization.id)
      .select()
      .single();

    // Log de l'activité
    await supabase
      .from('activity_logs')
      .insert({
        organization_id: organization.id,
        user_id: user.id,
        action: 'call_ended',
        entity_type: 'prospect',
        entity_id: callData?.prospect_id,
        details: {
          call_sid: callSid,
          outcome: outcome,
          notes: notes,
          ended_by: 'user'
        }
      });

    // Si l'appel concerne un prospect et a un outcome, créer une activité CRM
    if (callData?.prospect_id && outcome) {
      await supabase
        .from('crm_activities')
        .insert({
          organization_id: organization.id,
          prospect_id: callData.prospect_id,
          user_id: user.id,
          type: 'call',
          direction: 'outbound',
          subject: `Appel ${outcome}`,
          content: notes || '',
          outcome: outcome,
          duration_minutes: callData.duration_seconds ? Math.round(callData.duration_seconds / 60) : null,
          metadata: {
            call_sid: callSid,
            twilio_call: true
          }
        });

      // Mettre à jour la dernière activité du prospect
      await supabase
        .from('crm_prospects')
        .update({
          last_activity_at: new Date().toISOString()
        })
        .eq('id', callData.prospect_id)
        .eq('organization_id', organization.id);
    }

    return NextResponse.json({
      success: true,
      callSid,
      status: 'completed',
      outcome,
      endedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur raccrochage appel:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors du raccrochage' },
      { status: 500 }
    );
  }
}