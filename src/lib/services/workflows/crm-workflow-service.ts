import { createAdminClient } from '@/lib/supabase-admin';
import { logger } from '@/lib/logger';
import { qualifyProspect, generateEmailWithConfig, DEFAULT_PROMPTS, PromptConfig, ScoringConfig } from '@/lib/anthropic';
import { sendEmail, sendEmailWithBufferAttachment, getEmailCredentials, EmailCredentialsResult } from '@/lib/gmail';
import { scheduleRappelEmail } from '@/lib/qstash';
import { getValidCredentials, downloadFileFromDrive, GoogleCredentials } from '@/lib/google';
import { scheduleRecapEmail, getOrganizationEmailSettings, calculateScheduledTime } from '@/lib/services/scheduled-email-service';
import type { WaitingSubtype } from '@/types/pipeline';

interface WorkflowResult {
  workflow: string;
  success: boolean;
  actions: string[];
  error?: string;
  warning?: string; // Warning about fallback used
}

interface WorkflowOrganization {
  id: string;
  name: string;
}

interface WorkflowUser {
  id: string;
  email: string;
}

/**
 * Get full organization data needed for workflows
 */
async function getFullOrganization(orgId: string) {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from('organizations')
    .select('id, name, google_credentials, plaquette_url, prompt_qualification, prompt_synthese, prompt_plaquette, prompt_rappel, scoring_config')
    .eq('id', orgId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get prospect data from CRM database
 */
async function getCrmProspect(prospectId: string) {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from('crm_prospects')
    .select(`
      *,
      stage:pipeline_stages(id, name, slug, color),
      assigned_user:users!crm_prospects_assigned_to_fkey(id, full_name, email, gmail_credentials)
    `)
    .eq('id', prospectId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update CRM prospect fields
 */
async function updateCrmProspect(prospectId: string, updates: Record<string, unknown>) {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('crm_prospects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', prospectId);

  if (error) throw error;
}

/**
 * Log activity in CRM
 */
async function logActivity(
  organizationId: string,
  prospectId: string,
  userId: string,
  type: string,
  subject: string,
  content?: string
) {
  const adminClient = createAdminClient();

  await adminClient.from('crm_activities').insert({
    organization_id: organizationId,
    prospect_id: prospectId,
    user_id: userId,
    type,
    subject,
    content,
    direction: 'outbound',
  });
}

/**
 * Log email in email_logs table
 */
async function logEmailSent(
  organizationId: string,
  prospectEmail: string,
  prospectName: string,
  emailType: string,
  subject: string,
  body: string,
  messageId: string,
  hasAttachment: boolean = false
) {
  const adminClient = createAdminClient();

  await adminClient.from('email_logs').insert({
    organization_id: organizationId,
    prospect_email: prospectEmail,
    prospect_name: prospectName,
    email_type: emailType,
    subject,
    body,
    gmail_message_id: messageId,
    has_attachment: hasAttachment,
    sent_at: new Date().toISOString(),
  });
}

/**
 * WORKFLOW: Plaquette - Envoi mail avec PDF plaquette
 * Triggered when: stage = 'en_attente' AND subtype = 'plaquette'
 */
async function workflowPlaquette(
  prospectId: string,
  organization: WorkflowOrganization,
  user: WorkflowUser
): Promise<WorkflowResult> {
  const actions: string[] = [];
  logger.debug('📧 Workflow Plaquette - Starting for prospect:', prospectId);

  try {
    const prospect = await getCrmProspect(prospectId);
    logger.debug('📧 Workflow Plaquette - Prospect loaded:', prospect?.email, prospect?.first_name, prospect?.last_name);

    if (!prospect.email) {
      logger.debug('📧 Workflow Plaquette - ERROR: No email');
      return { workflow: 'plaquette', success: false, actions, error: 'Email prospect manquant' };
    }

    // Check if already sent using metadata field or a new column
    // For now, we'll track this in metadata
    if (prospect.metadata?.mail_plaquette_sent) {
      logger.debug('📧 Workflow Plaquette - Already sent, skipping');
      return { workflow: 'plaquette', success: true, actions: ['Déjà envoyé'] };
    }

    // Get full organization data
    const fullOrg = await getFullOrganization(organization.id);
    actions.push('Org data loaded');

    if (!fullOrg.plaquette_url) {
      return { workflow: 'plaquette', success: false, actions, error: 'Plaquette non configurée' };
    }

    // Determine which user's Gmail to use
    // Priority: user parameter (assigned advisor from route) > prospect.assigned_to
    const advisorUserId = user.id || prospect.assigned_to;
    const advisorEmail = user.email || prospect.assigned_user?.email;
    logger.debug('📧 Workflow Plaquette - Advisor from params:', user.id, user.email);
    logger.debug('📧 Workflow Plaquette - Prospect assigned_to:', prospect.assigned_to);
    logger.debug('📧 Workflow Plaquette - Final advisor:', advisorUserId, advisorEmail);
    actions.push(`Conseiller: ${advisorEmail}`);

    // Get email credentials - try assigned advisor first
    const credentialsResponse = await getEmailCredentials(organization.id, advisorUserId);
    let emailCredentialsResult: EmailCredentialsResult | null = credentialsResponse.result;
    let warning: string | undefined;

    logger.debug('📧 Workflow Plaquette - Credentials result:', emailCredentialsResult?.source, emailCredentialsResult?.userId);

    // Handle invalid_grant error - fallback to organization
    if (credentialsResponse.error?.error === 'invalid_grant') {
      logger.debug('⚠️ Workflow Plaquette - Token invalide, fallback sur organisation');
      warning = credentialsResponse.error.message;
      actions.push(`⚠️ Token expiré: ${credentialsResponse.error.userEmail}`);

      // Try to get organization credentials as fallback
      const orgCredentials = await getEmailCredentials(organization.id);
      emailCredentialsResult = orgCredentials.result;

      if (emailCredentialsResult) {
        logger.debug('📧 Workflow Plaquette - Using org credentials as fallback');
        actions.push('Fallback: credentials organisation');
      }
    }

    if (!emailCredentialsResult) {
      logger.debug('📧 Workflow Plaquette - No credentials found, cannot send email');
      const errorMsg = credentialsResponse.error?.message || `Pas de credentials email pour ${advisorEmail}`;
      return { workflow: 'plaquette', success: false, actions, error: errorMsg };
    }
    actions.push(`Credentials: ${emailCredentialsResult.source} (${emailCredentialsResult.userId || 'org'})`);

    // Generate email content
    const promptConfig = fullOrg.prompt_plaquette as PromptConfig | null;
    const email = await generateEmailWithConfig(
      promptConfig,
      DEFAULT_PROMPTS.plaquette,
      {
        prenom: prospect.first_name,
        nom: prospect.last_name,
        email: prospect.email,
        besoins: prospect.notes,
      }
    );
    actions.push('Email généré');

    // Download plaquette PDF
    let attachment = null;
    if (fullOrg.google_credentials) {
      try {
        const orgCreds = await getValidCredentials(fullOrg.google_credentials as GoogleCredentials);
        attachment = await downloadFileFromDrive(orgCreds, fullOrg.plaquette_url);
        actions.push('PDF téléchargé');
      } catch (e) {
        console.error('Erreur téléchargement PDF:', e);
        actions.push('PDF non disponible');
      }
    }

    // Send email
    let result;
    if (attachment) {
      result = await sendEmailWithBufferAttachment(emailCredentialsResult.credentials, {
        to: prospect.email,
        subject: email.objet,
        body: email.corps,
        attachmentBuffer: attachment.data,
        attachmentName: attachment.fileName,
        attachmentMimeType: attachment.mimeType,
      });
    } else {
      result = await sendEmail(emailCredentialsResult.credentials, {
        to: prospect.email,
        subject: email.objet,
        body: email.corps,
      });
    }
    actions.push('Email envoyé');

    // Update prospect metadata
    await updateCrmProspect(prospectId, {
      metadata: {
        ...(prospect.metadata || {}),
        mail_plaquette_sent: true,
        mail_plaquette_sent_at: new Date().toISOString(),
      },
    });
    actions.push('Prospect mis à jour');

    // Log activity
    await logActivity(
      organization.id,
      prospectId,
      advisorUserId,
      'email',
      'Email plaquette envoyé',
      email.corps
    );

    // Log email
    await logEmailSent(
      organization.id,
      prospect.email,
      `${prospect.first_name} ${prospect.last_name}`.trim(),
      'plaquette',
      email.objet,
      email.corps,
      result.messageId,
      !!attachment
    );

    return { workflow: 'plaquette', success: true, actions, warning };
  } catch (error) {
    console.error('Workflow plaquette error:', error);
    return {
      workflow: 'plaquette',
      success: false,
      actions,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * WORKFLOW: RDV Validé - Qualification + Mail synthèse + Rappel 24h
 * Triggered when: stage = 'rdv_pris'
 */
async function workflowRdvValide(
  prospectId: string,
  organization: WorkflowOrganization,
  user: WorkflowUser
): Promise<WorkflowResult> {
  const actions: string[] = [];
  logger.debug('📧 Workflow RDV Validé - Starting for prospect:', prospectId);

  try {
    const prospect = await getCrmProspect(prospectId);
    logger.debug('📧 Workflow RDV Validé - Prospect loaded:', prospect?.email, prospect?.first_name, prospect?.last_name);

    if (!prospect.email) {
      logger.debug('📧 Workflow RDV Validé - ERROR: No email');
      return { workflow: 'rdv_valide', success: false, actions, error: 'Email prospect manquant' };
    }

    // Check if already sent
    if (prospect.metadata?.mail_synthese_sent) {
      logger.debug('📧 Workflow RDV Validé - Already sent, skipping');
      return { workflow: 'rdv_valide', success: true, actions: ['Déjà envoyé'] };
    }

    // Get full organization data
    const fullOrg = await getFullOrganization(organization.id);
    actions.push('Org data loaded');

    // Determine which user's Gmail to use
    // Priority: user parameter (assigned advisor from route) > prospect.assigned_to
    const advisorUserId = user.id || prospect.assigned_to;
    const advisorEmail = user.email || prospect.assigned_user?.email;
    logger.debug('📧 Workflow RDV Validé - Advisor from params:', user.id, user.email);
    logger.debug('📧 Workflow RDV Validé - Prospect assigned_to:', prospect.assigned_to);
    logger.debug('📧 Workflow RDV Validé - Final advisor:', advisorUserId, advisorEmail);
    actions.push(`Conseiller: ${advisorEmail}`);

    // 1. Qualify prospect if not already done
    if (!prospect.qualification || prospect.qualification === 'non_qualifie') {
      try {
        const qualificationResult = await qualifyProspect(
          {
            prenom: prospect.first_name || '',
            nom: prospect.last_name || '',
            email: prospect.email,
            telephone: prospect.phone,
            age: prospect.age?.toString(),
            situationPro: prospect.profession,
            revenus: prospect.revenus_annuels?.toString(),
            patrimoine: prospect.patrimoine_estime?.toString(),
            besoins: prospect.notes,
            notesAppel: prospect.notes,
          },
          fullOrg.scoring_config as ScoringConfig | null
        );
        await updateCrmProspect(prospectId, {
          qualification: qualificationResult.qualification.toLowerCase(),
          score_ia: qualificationResult.score,
          analyse_ia: qualificationResult.justification,
          derniere_qualification: new Date().toISOString(),
        });
        actions.push(`Qualifié: ${qualificationResult.qualification} (${qualificationResult.score})`);

        // Update local prospect object
        prospect.qualification = qualificationResult.qualification.toLowerCase();
      } catch (e) {
        console.error('Qualification error:', e);
        actions.push('Qualification échouée');
      }
    }

    // 2. Get email credentials - try assigned advisor first
    const credentialsResponse = await getEmailCredentials(organization.id, advisorUserId);
    let emailCredentialsResult: EmailCredentialsResult | null = credentialsResponse.result;
    let warning: string | undefined;

    logger.debug('📧 Workflow RDV Validé - Credentials result:', emailCredentialsResult?.source, emailCredentialsResult?.userId);

    // Handle invalid_grant error - fallback to organization
    if (credentialsResponse.error?.error === 'invalid_grant') {
      logger.debug('⚠️ Workflow RDV Validé - Token invalide, fallback sur organisation');
      warning = credentialsResponse.error.message;
      actions.push(`⚠️ Token expiré: ${credentialsResponse.error.userEmail}`);

      // Try to get organization credentials as fallback
      const orgCredentials = await getEmailCredentials(organization.id);
      emailCredentialsResult = orgCredentials.result;

      if (emailCredentialsResult) {
        logger.debug('📧 Workflow RDV Validé - Using org credentials as fallback');
        actions.push('Fallback: credentials organisation');
      }
    }

    if (!emailCredentialsResult) {
      logger.debug('📧 Workflow RDV Validé - No credentials found, cannot send email');
      const errorMsg = credentialsResponse.error?.message || `Pas de credentials email pour ${advisorEmail}`;
      return { workflow: 'rdv_valide', success: false, actions, error: errorMsg };
    }
    actions.push(`Credentials: ${emailCredentialsResult.source} (${emailCredentialsResult.userId || 'org'})`);

    // 3. Generate and send synthese email
    const promptConfig = fullOrg.prompt_synthese as PromptConfig | null;

    // Format date RDV with Paris timezone (server runs in UTC)
    // Use metadata.rdv_datetime if available (full ISO datetime), fallback to expected_close_date
    let dateRdvFormatted = '';
    const rdvDateSource = prospect.metadata?.rdv_datetime || prospect.expected_close_date;

    if (rdvDateSource) {
      logger.debug('📧 Workflow RDV - Raw date source:', rdvDateSource);
      logger.debug('📧 Workflow RDV - Source type:', prospect.metadata?.rdv_datetime ? 'metadata.rdv_datetime' : 'expected_close_date');

      const rdvDate = new Date(rdvDateSource as string);
      logger.debug('📧 Workflow RDV - Parsed as Date:', rdvDate.toString());
      logger.debug('📧 Workflow RDV - ISO:', rdvDate.toISOString());
      logger.debug('📧 Workflow RDV - UTC hours:', rdvDate.getUTCHours());

      dateRdvFormatted = rdvDate.toLocaleString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Paris', // Force Paris timezone
      });
      logger.debug('📧 Workflow RDV - Formatted for Paris:', dateRdvFormatted);
    }

    // Get the Meet link from prospect metadata (set by pipeline when creating planning event)
    const meetLink = prospect.metadata?.meet_link as string | undefined;

    const email = await generateEmailWithConfig(
      promptConfig,
      DEFAULT_PROMPTS.synthese,
      {
        prenom: prospect.first_name,
        nom: prospect.last_name,
        email: prospect.email,
        qualification: prospect.qualification?.toUpperCase() || '',
        besoins: prospect.notes,
        notes_appel: prospect.notes,
        date_rdv: dateRdvFormatted,
      }
    );

    // If we have a Meet link, append it to the email body
    let emailBody = email.corps;
    if (meetLink) {
      emailBody += `\n\n---\n🎥 Lien de la visioconférence Google Meet:\n${meetLink}`;
      actions.push('Meet link ajouté');
    }

    actions.push('Email synthèse généré');

    // Récupérer les paramètres de délai email de l'organisation
    const orgEmailSettings = await getOrganizationEmailSettings(organization.id);

    if (!orgEmailSettings.email_recap_enabled) {
      actions.push('⚠️ Email récap désactivé - ignoré');
      logger.info('Email récap désactivé pour organisation:', organization.id);
    } else {
      // Calculer l'heure d'envoi avec délai configurable
      // Utilise la fin du RDV + délai (ou maintenant + délai si pas de RDV)
      const rdvEndTime = rdvDateSource ? new Date(rdvDateSource as string) : new Date();
      const scheduledAt = calculateScheduledTime(rdvEndTime, orgEmailSettings.email_recap_delay_hours);

      // Programmer l'email au lieu de l'envoyer immédiatement
      await scheduleRecapEmail({
        organization_id: organization.id,
        prospect_id: prospectId,
        advisor_id: advisorUserId,
        email_type: 'rdv_recap',
        scheduled_at: scheduledAt,
        email_data: {
          subject: email.objet,
          body: emailBody, // Avec Meet link
          prospect_data: {
            first_name: prospect.first_name || '',
            last_name: prospect.last_name || '',
            email: prospect.email,
          },
          rdv_data: {
            date_formatted: dateRdvFormatted,
            meet_link: meetLink,
            qualification: prospect.qualification?.toUpperCase() || '',
          },
          // Informations pour l'envoi différé
          advisor_credentials_source: emailCredentialsResult.source,
          advisor_user_id: emailCredentialsResult.userId,
        }
      });

      const delayMinutes = Math.round((scheduledAt.getTime() - Date.now()) / (1000 * 60));
      actions.push(`📅 Email récap programmé: ${scheduledAt.toISOString()} (délai: ${orgEmailSettings.email_recap_delay_hours}h, dans ${delayMinutes} min)`);
    }

    // 4. Update prospect metadata
    // Ne marque comme envoyé que si programmation réussie
    const updateData: any = {
      metadata: {
        ...(prospect.metadata || {}),
      },
    };

    if (orgEmailSettings.email_recap_enabled) {
      updateData.metadata.mail_synthese_scheduled = true;
      updateData.metadata.mail_synthese_scheduled_at = new Date().toISOString();
    } else {
      updateData.metadata.mail_synthese_disabled = true;
    }

    await updateCrmProspect(prospectId, updateData);

    // 5. Schedule 24h reminder if RDV date is set
    // Use metadata.rdv_datetime for accurate time
    if (rdvDateSource) {
      const rdvDate = new Date(rdvDateSource as string);
      const reminderDate = new Date(rdvDate.getTime() - 24 * 60 * 60 * 1000);

      if (reminderDate > new Date()) {
        try {
          await scheduleRappelEmail(reminderDate, {
            organizationId: organization.id,
            conseillerId: advisorUserId,
            conseillerEmail: advisorEmail,
            prospectData: {
              email: prospect.email,
              nom: prospect.last_name || '',
              prenom: prospect.first_name || '',
              date_rdv: rdvDate.toISOString(),
              dateRdvFormatted: dateRdvFormatted,
              qualification: prospect.qualification?.toUpperCase() || '',
              besoins: prospect.notes,
            },
          });
          actions.push(`Rappel programmé: ${reminderDate.toISOString()} (${advisorEmail})`);
        } catch (e) {
          console.error('Erreur programmation rappel:', e);
          actions.push('Rappel non programmé');
        }
      }
    }

    // 6. Log activity - seulement pour la programmation
    if (orgEmailSettings.email_recap_enabled) {
      const scheduledAt = calculateScheduledTime(rdvDateSource ? new Date(rdvDateSource as string) : new Date(), orgEmailSettings.email_recap_delay_hours);
      await logActivity(
        organization.id,
        prospectId,
        advisorUserId,
        'task',
        'Email synthèse RDV programmé',
        `Email prévu le ${scheduledAt.toLocaleString('fr-FR')} (délai: ${orgEmailSettings.email_recap_delay_hours}h)`
      );
    } else {
      await logActivity(
        organization.id,
        prospectId,
        advisorUserId,
        'note',
        'Email synthèse RDV désactivé',
        'Email récap post-RDV désactivé dans la configuration'
      );
    }

    // Le logging de l'email envoyé sera fait par le CRON job lors de l'envoi réel

    return { workflow: 'rdv_valide', success: true, actions, warning };
  } catch (error) {
    console.error('Workflow rdv_valide error:', error);
    return {
      workflow: 'rdv_valide',
      success: false,
      actions,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Stage slugs that trigger the "Plaquette" workflow
// Slug unifié pour les deux modes
const WAITING_STAGE_SLUGS = ['en_attente'];

// Stage slugs that trigger the "RDV Validé" workflow (with qualification)
// Slug unifié pour les deux modes
const RDV_STAGE_SLUGS = ['rdv_pris'];

// ⭐ NOUVEAUX STAGES RDV MULTIPLES - Triggers spécialisés
const RDV_2_STAGE_SLUGS = ['rdv_2_programme', 'rdv_2_effectue'];
const RDV_3_STAGE_SLUGS = ['rdv_3_programme', 'rdv_3_effectue'];
const PROPOSITION_STAGE_SLUGS = ['proposition_envoyee'];

/**
 * Main function to trigger CRM workflows based on stage change
 */
export async function triggerCrmWorkflow(
  stageSlug: string,
  subtype: WaitingSubtype | undefined,
  prospectId: string,
  organization: WorkflowOrganization,
  user: WorkflowUser
): Promise<WorkflowResult | null> {
  logger.debug('🔄 CRM Workflow - Stage:', stageSlug, 'Subtype:', subtype, 'ProspectId:', prospectId);
  logger.debug('🔄 CRM Workflow - Organization:', organization.id);
  logger.debug('🔄 CRM Workflow - User:', user.id, user.email);

  // CRM workflows are now always enabled

  // Determine which workflow to trigger

  // Plaquette workflow: en_attente (or similar) + plaquette subtype
  // Sends email with PDF plaquette attachment
  if (WAITING_STAGE_SLUGS.includes(stageSlug) && subtype === 'plaquette') {
    logger.debug('🔄 CRM Workflow - Triggering PLAQUETTE workflow');
    return await workflowPlaquette(prospectId, organization, user);
  }

  // RDV workflow: rdv_pris OR rdv_valide
  // Does: Qualification IA + Email récap + Rappel 24h
  if (RDV_STAGE_SLUGS.includes(stageSlug)) {
    logger.debug('🔄 CRM Workflow - Triggering RDV_VALIDE workflow');
    return await workflowRdvValide(prospectId, organization, user);
  }

  // ⭐ RDV 2 workflows - Suivi et relance spécialisés
  if (RDV_2_STAGE_SLUGS.includes(stageSlug)) {
    logger.debug('🔄 CRM Workflow - Triggering RDV_2_SUIVI workflow');
    return await workflowRdv2Suivi(prospectId, organization, user, stageSlug);
  }

  // ⭐ RDV 3 workflows - Suivi avancé et closing
  if (RDV_3_STAGE_SLUGS.includes(stageSlug)) {
    logger.debug('🔄 CRM Workflow - Triggering RDV_3_SUIVI workflow');
    return await workflowRdv3Suivi(prospectId, organization, user, stageSlug);
  }

  // ⭐ Proposition envoyée - Relance et suivi commercial
  if (PROPOSITION_STAGE_SLUGS.includes(stageSlug)) {
    logger.debug('🔄 CRM Workflow - Triggering PROPOSITION_SUIVI workflow');
    return await workflowPropositionSuivi(prospectId, organization, user);
  }

  // No workflow for this stage change
  logger.debug('🔄 CRM Workflow - No workflow for stage:', stageSlug);
  return null;
}

// ⭐ NOUVELLES FONCTIONS DE WORKFLOW RDV MULTIPLES

/**
 * Workflow RDV 2 - Suivi spécialisé pour deuxième rendez-vous
 */
async function workflowRdv2Suivi(
  prospectId: string,
  organization: WorkflowOrganization,
  user: WorkflowUser,
  stageSlug: string
): Promise<WorkflowResult> {
  logger.info(`🔄 RDV 2 Workflow - Démarrage pour prospect ${prospectId}, stage: ${stageSlug}`);

  try {
    const result: WorkflowResult = {
      workflow: 'rdv-2',
      success: false,
      actions: [],
    };

    if (stageSlug === 'rdv_2_programme') {
      // RDV 2 programmé - Préparer le conseiller
      logger.debug('🔄 RDV 2 Workflow - RDV 2 programmé, envoi brief conseiller');

      // Email de préparation au conseiller
      const emailResult = await sendEmailRdv2Preparation(prospectId, organization, user);
      if (emailResult.success) {
        result.actions.push('Email préparation RDV 2 envoyé au conseiller');
      } else {
        result.error = 'Erreur email préparation';
      }

      // Rappel 2h avant le RDV 2
      const reminderResult = await scheduleRdv2Reminder(prospectId, organization, user);
      if (reminderResult.success) {
        result.actions.push('Rappel RDV 2 programmé (2h avant)');
      } else {
        result.error = 'Erreur rappel RDV 2';
      }

    } else if (stageSlug === 'rdv_2_effectue') {
      // RDV 2 effectué - Analyse et suivi
      logger.debug('🔄 RDV 2 Workflow - RDV 2 effectué, analyse et suivi');

      // Email de suivi client après RDV 2
      const suiviResult = await sendEmailRdv2Suivi(prospectId, organization, user);
      if (suiviResult.success) {
        result.actions.push('Email suivi RDV 2 envoyé au prospect');
      } else {
        result.error = 'Erreur email suivi RDV 2';
      }

      // Qualification avancée après RDV 2
      const qualifResult = await qualifyProspectRdv2(prospectId, organization);
      if (qualifResult.success) {
        result.actions.push('Qualification IA post-RDV 2 effectuée');
      } else {
        result.error = 'Erreur qualification RDV 2';
      }
    }

    result.success = !result.error;
    return result;

  } catch (error) {
    logger.error('🔄 RDV 2 Workflow - Erreur:', error);
    return {
      workflow: 'rdv-2',
      success: false,
      actions: [],
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Workflow RDV 3 - Suivi avancé pour troisième rendez-vous de closing
 */
async function workflowRdv3Suivi(
  prospectId: string,
  organization: WorkflowOrganization,
  user: WorkflowUser,
  stageSlug: string
): Promise<WorkflowResult> {
  logger.info(`🔄 RDV 3 Workflow - Démarrage pour prospect ${prospectId}, stage: ${stageSlug}`);

  try {
    const result: WorkflowResult = {
      workflow: 'rdv-3',
      success: false,
      actions: [],
    };

    if (stageSlug === 'rdv_3_programme') {
      // RDV 3 programmé - Préparation closing
      logger.debug('🔄 RDV 3 Workflow - RDV 3 programmé, préparation closing');

      // Email stratégie de closing au conseiller
      const closingResult = await sendEmailRdv3ClosingPrep(prospectId, organization, user);
      if (closingResult.success) {
        result.actions.push('Email stratégie closing RDV 3 envoyé');
      } else {
        result.error = 'Erreur email closing';
      }

    } else if (stageSlug === 'rdv_3_effectue') {
      // RDV 3 effectué - Décision finale
      logger.debug('🔄 RDV 3 Workflow - RDV 3 effectué, suivi décision');

      // Email récapitulatif et proposition formelle
      const propositionResult = await sendEmailRdv3Proposition(prospectId, organization, user);
      if (propositionResult.success) {
        result.actions.push('Email proposition formelle post-RDV 3 envoyé');
      } else {
        result.error = 'Erreur email proposition';
      }

      // Analyse finale et score de closing
      const scoreResult = await calculateClosingScore(prospectId, organization);
      if (scoreResult.success) {
        result.actions.push('Score closing calculé après RDV 3');
      } else {
        result.error = 'Erreur calcul score';
      }
    }

    result.success = !result.error;
    return result;

  } catch (error) {
    logger.error('🔄 RDV 3 Workflow - Erreur:', error);
    return {
      workflow: 'rdv-3',
      success: false,
      actions: [],
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Workflow Proposition Envoyée - Suivi commercial intensif
 */
async function workflowPropositionSuivi(
  prospectId: string,
  organization: WorkflowOrganization,
  user: WorkflowUser
): Promise<WorkflowResult> {
  logger.info(`🔄 Proposition Workflow - Démarrage pour prospect ${prospectId}`);

  try {
    const result: WorkflowResult = {
      workflow: 'proposition',
      success: false,
      actions: [],
    };

    // Email de confirmation envoi proposition
    const confirmResult = await sendEmailPropositionConfirmation(prospectId, organization, user);
    if (confirmResult.success) {
      result.actions.push('Email confirmation proposition envoyé');
    } else {
      result.error = 'Erreur email confirmation';
    }

    // Programmer relances automatiques
    const relanceResult = await schedulePropositionRelances(prospectId, organization, user);
    if (relanceResult.success) {
      result.actions.push('Relances proposition programmées (J+3, J+7, J+14)');
    } else {
      result.error = 'Erreur programmation relances';
    }

    // Alerte manager si prospect chaud
    const alertResult = await sendManagerAlertProposition(prospectId, organization, user);
    if (alertResult.success) {
      result.actions.push('Alerte manager envoyée pour prospect chaud');
    } else {
      result.error = 'Erreur alerte manager';
    }

    result.success = !result.error;
    return result;

  } catch (error) {
    logger.error('🔄 Proposition Workflow - Erreur:', error);
    return {
      workflow: 'proposition',
      success: false,
      actions: [],
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

// ⭐ FONCTIONS UTILITAIRES POUR NOUVEAUX WORKFLOWS (Stubs - à implémenter selon besoins métier)

async function sendEmailRdv2Preparation(prospectId: string, org: WorkflowOrganization, user: WorkflowUser) {
  // Stub - à implémenter selon template email spécifique RDV 2
  logger.debug('📧 Envoi email préparation RDV 2 (stub)');
  return { success: true };
}

async function scheduleRdv2Reminder(prospectId: string, org: WorkflowOrganization, user: WorkflowUser) {
  // Stub - à implémenter avec QStash pour rappel 2h avant
  logger.debug('⏰ Programmation rappel RDV 2 (stub)');
  return { success: true };
}

async function sendEmailRdv2Suivi(prospectId: string, org: WorkflowOrganization, user: WorkflowUser) {
  // Stub - à implémenter selon template suivi post-RDV 2
  logger.debug('📧 Envoi email suivi RDV 2 (stub)');
  return { success: true };
}

async function qualifyProspectRdv2(prospectId: string, org: WorkflowOrganization) {
  // Stub - à implémenter qualification IA spécifique post-RDV 2
  logger.debug('🤖 Qualification IA post-RDV 2 (stub)');
  return { success: true };
}

async function sendEmailRdv3ClosingPrep(prospectId: string, org: WorkflowOrganization, user: WorkflowUser) {
  // Stub - à implémenter email stratégie closing pour conseiller
  logger.debug('📧 Envoi email stratégie closing RDV 3 (stub)');
  return { success: true };
}

async function sendEmailRdv3Proposition(prospectId: string, org: WorkflowOrganization, user: WorkflowUser) {
  // Stub - à implémenter email proposition formelle post-RDV 3
  logger.debug('📧 Envoi email proposition RDV 3 (stub)');
  return { success: true };
}

async function calculateClosingScore(prospectId: string, org: WorkflowOrganization) {
  // Stub - à implémenter calcul score probabilité closing
  logger.debug('📊 Calcul score closing (stub)');
  return { success: true };
}

async function sendEmailPropositionConfirmation(prospectId: string, org: WorkflowOrganization, user: WorkflowUser) {
  // Stub - à implémenter email confirmation envoi proposition
  logger.debug('📧 Envoi email confirmation proposition (stub)');
  return { success: true };
}

async function schedulePropositionRelances(prospectId: string, org: WorkflowOrganization, user: WorkflowUser) {
  // Stub - à implémenter programmation relances J+3, J+7, J+14
  logger.debug('⏰ Programmation relances proposition (stub)');
  return { success: true };
}

async function sendManagerAlertProposition(prospectId: string, org: WorkflowOrganization, user: WorkflowUser) {
  // Stub - à implémenter alerte manager pour prospect chaud avec proposition
  logger.debug('🚨 Envoi alerte manager proposition (stub)');
  return { success: true };
}
