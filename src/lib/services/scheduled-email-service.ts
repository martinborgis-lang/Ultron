import { createAdminClient } from '@/lib/supabase-admin';
import { logger } from '@/lib/logger';
import { Client } from '@upstash/qstash';

function getQStashClient() {
  if (!process.env.QSTASH_TOKEN) {
    throw new Error('QSTASH_TOKEN environment variable is not set');
  }
  return new Client({
    token: process.env.QSTASH_TOKEN,
  });
}

export interface ScheduledEmailData {
  organization_id: string;
  prospect_id: string | null;
  advisor_id: string;
  email_type: string;
  scheduled_at: Date;
  email_data: {
    subject: string;
    body: string;
    prospect_data: {
      first_name: string;
      last_name: string;
      email: string;
    };
    rdv_data?: {
      date_formatted: string;
      meet_link?: string;
      qualification?: string;
    };
    [key: string]: any;
  };
}

export interface OrganizationEmailSettings {
  email_recap_enabled: boolean;
  email_recap_delay_hours: number;
}

/**
 * Récupère les paramètres email d'une organisation
 */
export async function getOrganizationEmailSettings(organizationId: string): Promise<OrganizationEmailSettings> {
  const adminClient = createAdminClient();

  const { data: org, error } = await adminClient
    .from('organizations')
    .select('email_recap_enabled, email_recap_delay_hours')
    .eq('id', organizationId)
    .single();

  if (error) {
    logger.error('Erreur récupération paramètres org:', error);
    throw error;
  }

  return {
    email_recap_enabled: org.email_recap_enabled ?? true,
    email_recap_delay_hours: org.email_recap_delay_hours ?? 2,
  };
}

/**
 * Programme un email récapitulatif avec QStash (délai configurable)
 */
export async function scheduleRecapEmail(data: ScheduledEmailData): Promise<any> {
  const qstashClient = getQStashClient();
  const delaySeconds = Math.max(0, Math.floor((data.scheduled_at.getTime() - Date.now()) / 1000));

  logger.debug('📅 Programmation email récap via QStash:', {
    prospect_id: data.prospect_id,
    email_type: data.email_type,
    scheduled_at: data.scheduled_at.toISOString(),
    delay_seconds: delaySeconds,
    delay_minutes: Math.round(delaySeconds / 60)
  });

  // Payload pour QStash
  const payload = {
    organization_id: data.organization_id,
    prospect_id: data.prospect_id,
    advisor_id: data.advisor_id,
    email_type: data.email_type,
    email_data: data.email_data,
    scheduled_at: data.scheduled_at.toISOString(),
  };

  // Programmer via QStash
  const result = await qstashClient.publishJSON({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/send-scheduled-email`,
    body: payload,
    delay: delaySeconds,
  });

  logger.info('✅ Email programmé via QStash:', result.messageId);
  return { messageId: result.messageId, scheduled_at: data.scheduled_at };
}

/**
 * Calcule l'heure d'envoi programmée pour un email récap post-RDV
 */
export function calculateScheduledTime(rdvEndTime: Date, delayHours: number): Date {
  const scheduledAt = new Date(rdvEndTime.getTime() + delayHours * 60 * 60 * 1000);

  logger.debug('⏰ Calcul heure programmée:', {
    rdv_end: rdvEndTime.toISOString(),
    delay_hours: delayHours,
    scheduled_at: scheduledAt.toISOString(),
  });

  return scheduledAt;
}

/**
 * Annule un email programmé (si pas encore envoyé)
 */
export async function cancelScheduledEmail(emailId: string, reason?: string): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('scheduled_emails')
    .update({
      status: 'cancelled',
      error_message: reason || 'Annulé manuellement',
      updated_at: new Date().toISOString(),
    })
    .eq('id', emailId)
    .eq('status', 'pending'); // Only cancel pending emails

  if (error) {
    logger.error('Erreur annulation email:', error);
    throw error;
  }

  logger.info('❌ Email programmé annulé:', emailId);
}

/**
 * Récupère les emails programmés pour une organisation
 */
export async function getScheduledEmailsForOrg(organizationId: string, status?: string) {
  const adminClient = createAdminClient();

  let query = adminClient
    .from('scheduled_emails')
    .select(`
      *,
      prospect:crm_prospects(first_name, last_name, email),
      advisor:users(full_name, email)
    `)
    .eq('organization_id', organizationId)
    .order('scheduled_at', { ascending: true });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Erreur récupération emails programmés:', error);
    throw error;
  }

  return data;
}

/**
 * Récupère les statistiques des emails programmés pour le dashboard
 */
export async function getScheduledEmailsStats(organizationId: string) {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from('scheduled_emails')
    .select('email_type, status')
    .eq('organization_id', organizationId);

  if (error) {
    logger.error('Erreur stats emails programmés:', error);
    throw error;
  }

  // Groupe les résultats par type et status
  const stats = data.reduce((acc: any, email) => {
    const key = `${email.email_type}_${email.status}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    total: data.length,
    pending: data.filter(e => e.status === 'pending').length,
    sent: data.filter(e => e.status === 'sent').length,
    failed: data.filter(e => e.status === 'failed').length,
    cancelled: data.filter(e => e.status === 'cancelled').length,
    by_type: stats,
  };
}

/**
 * Met à jour les paramètres email d'une organisation
 */
export async function updateOrganizationEmailSettings(
  organizationId: string,
  settings: Partial<OrganizationEmailSettings>
): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('organizations')
    .update(settings)
    .eq('id', organizationId);

  if (error) {
    logger.error('Erreur mise à jour paramètres email org:', error);
    throw error;
  }

  logger.info('✅ Paramètres email organisation mis à jour:', organizationId);
}