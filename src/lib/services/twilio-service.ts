import twilio from 'twilio';
import jwt from 'jsonwebtoken';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
const TWILIO_API_SECRET = process.env.TWILIO_API_SECRET;
const TWILIO_TWIML_APP_SID = process.env.TWILIO_TWIML_APP_SID;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const client = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null;

export interface TwilioCall {
  sid: string;
  from: string;
  to: string;
  status: string;
  duration?: number;
  recordingUrl?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface CallTokenOptions {
  identity: string;
  clientName?: string;
  allowIncoming?: boolean;
  allowOutgoing?: boolean;
}

export class TwilioService {
  /**
   * Génère un token JWT pour Twilio Voice WebRTC
   */
  static generateToken(options: CallTokenOptions): string {
    if (!TWILIO_API_KEY || !TWILIO_API_SECRET || !TWILIO_TWIML_APP_SID) {
      throw new Error('Missing Twilio API credentials for token generation');
    }

    const { identity, clientName = 'ultron-web-client', allowIncoming = true, allowOutgoing = true } = options;

    // Claims pour le token
    const grants = {
      voice: {
        outgoing: allowOutgoing ? { application_sid: TWILIO_TWIML_APP_SID } : undefined,
        incoming: allowIncoming ? { allow: true } : undefined
      }
    };

    // Génération du token avec une validité de 1 heure
    const token = jwt.sign(
      {
        iss: TWILIO_API_KEY,
        sub: TWILIO_ACCOUNT_SID,
        nbf: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 heure
        grants,
        identity
      },
      TWILIO_API_SECRET,
      { algorithm: 'HS256' }
    );

    return token;
  }

  /**
   * Initie un appel sortant via Twilio
   */
  static async makeCall(params: {
    to: string;
    from?: string;
    callerId?: string;
    record?: boolean;
    webhookUrl?: string;
  }): Promise<TwilioCall> {
    if (!client) {
      throw new Error('Missing Twilio credentials');
    }

    const { to, from = TWILIO_PHONE_NUMBER, callerId, record = true, webhookUrl } = params;

    if (!from) {
      throw new Error('No Twilio phone number configured');
    }

    try {
      const call = await client.calls.create({
        to,
        from,
        twiml: `
          <Response>
            <Say voice="alice" language="fr-FR">Connexion en cours, veuillez patienter.</Say>
            <Dial callerId="${callerId || from}" record="${record ? 'record-from-answer' : 'do-not-record'}">
              <Client>ultron-web-client</Client>
            </Dial>
          </Response>
        `,
        statusCallback: webhookUrl,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST',
        record: record,
        recordingStatusCallback: webhookUrl + '/recording',
        recordingStatusCallbackEvent: ['completed']
      });

      return {
        sid: call.sid,
        from: call.from || from,
        to: call.to || to,
        status: call.status || 'initiated',
        startTime: call.dateCreated
      };
    } catch (error) {
      console.error('Error making call:', error);
      throw new Error(`Failed to make call: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Raccroche un appel en cours
   */
  static async hangupCall(callSid: string): Promise<void> {
    if (!client) {
      throw new Error('Missing Twilio credentials');
    }

    try {
      await client.calls(callSid).update({ status: 'completed' });
    } catch (error) {
      console.error('Error hanging up call:', error);
      throw new Error(`Failed to hangup call: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Récupère les détails d'un appel
   */
  static async getCall(callSid: string): Promise<TwilioCall> {
    if (!client) {
      throw new Error('Missing Twilio credentials');
    }

    try {
      const call = await client.calls(callSid).fetch();
      return {
        sid: call.sid,
        from: call.from || '',
        to: call.to || '',
        status: call.status || 'unknown',
        duration: call.duration ? parseInt(call.duration) : undefined,
        startTime: call.startTime || undefined,
        endTime: call.endTime || undefined
      };
    } catch (error) {
      console.error('Error fetching call:', error);
      throw new Error(`Failed to fetch call: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Récupère l'historique des appels pour une organisation
   */
  static async getCallHistory(params: {
    limit?: number;
    offset?: number;
    dateFrom?: Date;
    dateTo?: Date;
  } = {}): Promise<TwilioCall[]> {
    if (!client) {
      throw new Error('Missing Twilio credentials');
    }

    const { limit = 50, dateFrom, dateTo } = params;

    try {
      const calls = await client.calls.list({
        limit,
        startTimeAfter: dateFrom,
        startTimeBefore: dateTo
      });

      return calls.map(call => ({
        sid: call.sid,
        from: call.from || '',
        to: call.to || '',
        status: call.status || 'unknown',
        duration: call.duration ? parseInt(call.duration) : undefined,
        startTime: call.startTime || undefined,
        endTime: call.endTime || undefined
      }));
    } catch (error) {
      console.error('Error fetching call history:', error);
      throw new Error(`Failed to fetch call history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Récupère l'enregistrement d'un appel
   */
  static async getCallRecording(callSid: string): Promise<string | null> {
    if (!client) {
      throw new Error('Missing Twilio credentials');
    }

    try {
      const recordings = await client.recordings.list({ callSid, limit: 1 });

      if (recordings.length === 0) {
        return null;
      }

      const recording = recordings[0];
      return `https://api.twilio.com${recording.uri?.replace('.json', '.mp3')}`;
    } catch (error) {
      console.error('Error fetching call recording:', error);
      return null;
    }
  }

  /**
   * Télécharge l'enregistrement audio d'un appel
   */
  static async downloadRecording(recordingUri: string): Promise<Buffer> {
    try {
      const response = await fetch(`https://api.twilio.com${recordingUri}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error('Error downloading recording:', error);
      throw new Error(`Failed to download recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Génère le TwiML pour un appel entrant
   */
  static generateTwiML(params: {
    action?: 'connect' | 'voicemail' | 'forward';
    clientIdentity?: string;
    forwardNumber?: string;
    record?: boolean;
  }): string {
    const { action = 'connect', clientIdentity = 'ultron-web-client', forwardNumber, record = true } = params;

    switch (action) {
      case 'connect':
        return `
          <Response>
            <Say voice="alice" language="fr-FR">Connexion en cours avec votre conseiller.</Say>
            <Dial record="${record ? 'record-from-answer' : 'do-not-record'}" timeout="30">
              <Client>${clientIdentity}</Client>
            </Dial>
            <Say voice="alice" language="fr-FR">Votre conseiller n'est pas disponible. Veuillez laisser un message après le signal sonore.</Say>
            <Record timeout="60" transcribe="true" />
          </Response>
        `;

      case 'forward':
        return `
          <Response>
            <Dial record="${record ? 'record-from-answer' : 'do-not-record'}">
              <Number>${forwardNumber}</Number>
            </Dial>
          </Response>
        `;

      case 'voicemail':
        return `
          <Response>
            <Say voice="alice" language="fr-FR">Bonjour, vous êtes bien chez Ultron. Veuillez laisser votre message après le signal sonore.</Say>
            <Record timeout="60" transcribe="true" />
            <Say voice="alice" language="fr-FR">Merci pour votre message. Nous vous rappellerons dans les plus brefs délais.</Say>
          </Response>
        `;

      default:
        return `
          <Response>
            <Say voice="alice" language="fr-FR">Service temporairement indisponible.</Say>
            <Hangup />
          </Response>
        `;
    }
  }
}