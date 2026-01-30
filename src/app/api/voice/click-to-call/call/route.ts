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
    const { prospectId, phoneNumber, prospectName } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Numéro de téléphone requis' }, { status: 400 });
    }

    // Formatage du numéro de téléphone français
    let formattedPhone = phoneNumber.replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+33' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+33' + formattedPhone;
    }

    // URL webhook pour les callbacks Twilio
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const webhookUrl = `${baseUrl}/api/voice/click-to-call/twilio-webhook`;

    // Initiation de l'appel
    const call = await TwilioService.makeCall({
      to: formattedPhone,
      callerId: `${organization.id}-${user.id}`,
      record: true,
      webhookUrl
    });

    // Sauvegarde dans la base de données
    const supabase = await createClient();

    const callRecord = await supabase
      .from('voice_calls')
      .insert({
        organization_id: organization.id,
        user_id: user.id,
        prospect_id: prospectId || null,
        twilio_call_sid: call.sid,
        phone_number: formattedPhone,
        prospect_name: prospectName || null,
        direction: 'outbound',
        status: 'initiated',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (callRecord.error) {
      console.error('Erreur sauvegarde appel:', callRecord.error);
      // Continue même si la sauvegarde échoue
    }

    // Log de l'activité
    await supabase
      .from('activity_logs')
      .insert({
        organization_id: organization.id,
        user_id: user.id,
        action: 'call_initiated',
        entity_type: 'prospect',
        entity_id: prospectId,
        details: {
          call_sid: call.sid,
          phone_number: formattedPhone,
          prospect_name: prospectName
        }
      });

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      to: formattedPhone,
      prospectName,
      callRecordId: callRecord.data?.id
    });

  } catch (error) {
    console.error('Erreur initiation appel:', error);

    // Log détaillé pour le debug
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }

    let errorMessage = 'Erreur lors de l\'initiation de l\'appel';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Erreurs spécifiques Twilio
      if (error.message.includes('Missing Twilio credentials')) {
        errorMessage = 'Configuration Twilio manquante - contactez l\'administrateur';
        statusCode = 503;
      } else if (error.message.includes('Failed to make call')) {
        errorMessage = 'Erreur lors de l\'appel - vérifiez le numéro de téléphone';
        statusCode = 400;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: statusCode }
    );
  }
}

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
    const callSid = searchParams.get('callSid');

    if (!callSid) {
      return NextResponse.json({ error: 'Call SID requis' }, { status: 400 });
    }

    // Récupération du statut de l'appel depuis Twilio
    const call = await TwilioService.getCall(callSid);

    // Mise à jour dans la base de données
    const supabase = await createClient();

    await supabase
      .from('voice_calls')
      .update({
        status: call.status,
        duration_seconds: call.duration,
        started_at: call.startTime?.toISOString(),
        ended_at: call.endTime?.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('twilio_call_sid', callSid)
      .eq('organization_id', organization.id);

    return NextResponse.json({
      callSid: call.sid,
      status: call.status,
      duration: call.duration,
      startTime: call.startTime,
      endTime: call.endTime
    });

  } catch (error) {
    console.error('Erreur récupération statut appel:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du statut' },
      { status: 500 }
    );
  }
}