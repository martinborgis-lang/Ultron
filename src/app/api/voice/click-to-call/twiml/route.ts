import { NextRequest, NextResponse } from 'next/server';
import { TwilioService } from '@/lib/services/twilio-service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const callStatus = formData.get('CallStatus') as string;

    console.log('TwiML Request:', { callSid, from, to, callStatus });

    // Génération du TwiML selon le contexte
    let twiml: string;

    if (callStatus === 'ringing') {
      // Appel en cours de sonnerie
      twiml = TwilioService.generateTwiML({
        action: 'connect',
        record: true
      });
    } else {
      // Appel établi ou autres statuts
      twiml = TwilioService.generateTwiML({
        action: 'connect',
        clientIdentity: 'ultron-web-client',
        record: true
      });
    }

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    });

  } catch (error) {
    console.error('Erreur TwiML:', error);

    // TwiML d'erreur de fallback
    const errorTwiml = `
      <Response>
        <Say voice="alice" language="fr-FR">Une erreur technique est survenue. Veuillez rappeler ultérieurement.</Say>
        <Hangup />
      </Response>
    `;

    return new NextResponse(errorTwiml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'connect';

    let twiml: string;

    switch (action) {
      case 'voicemail':
        twiml = TwilioService.generateTwiML({
          action: 'voicemail',
          record: true
        });
        break;

      case 'forward':
        const forwardNumber = searchParams.get('forwardNumber');
        twiml = TwilioService.generateTwiML({
          action: 'forward',
          forwardNumber: forwardNumber || undefined,
          record: true
        });
        break;

      default:
        twiml = TwilioService.generateTwiML({
          action: 'connect',
          record: true
        });
    }

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    });

  } catch (error) {
    console.error('Erreur TwiML GET:', error);

    const errorTwiml = `
      <Response>
        <Say voice="alice" language="fr-FR">Service temporairement indisponible.</Say>
        <Hangup />
      </Response>
    `;

    return new NextResponse(errorTwiml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}