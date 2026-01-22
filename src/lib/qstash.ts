import { Client } from '@upstash/qstash';
import { logger } from '@/lib/logger';

function getQStashClient() {
  if (!process.env.QSTASH_TOKEN) {
    throw new Error('QSTASH_TOKEN environment variable is not set');
  }
  return new Client({
    token: process.env.QSTASH_TOKEN,
  });
}

export interface RappelPayload {
  organizationId: string;
  conseillerId?: string; // Optional: advisor's user ID for per-user Gmail
  conseillerEmail?: string; // Optional: advisor's email for per-user Gmail
  prospectData: {
    email: string;
    nom: string;
    prenom: string;
    date_rdv: string;
    dateRdvFormatted: string;
    qualification: string;
    besoins?: string;
  };
  rowNumber?: number;
}

export async function scheduleRappelEmail(
  scheduledFor: Date,
  payload: RappelPayload
) {
  const qstashClient = getQStashClient();
  const delaySeconds = Math.max(0, Math.floor((scheduledFor.getTime() - Date.now()) / 1000));

  logger.debug(`Scheduling rappel for ${scheduledFor.toISOString()}, delay: ${delaySeconds}s`);

  const result = await qstashClient.publishJSON({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/send-rappel`,
    body: payload,
    delay: delaySeconds,
  });

  logger.debug('QStash scheduled:', result.messageId);
  return result;
}
