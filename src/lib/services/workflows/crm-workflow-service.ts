import { createAdminClient } from '@/lib/supabase-admin';
import { qualifyProspect, generateEmailWithConfig, DEFAULT_PROMPTS, PromptConfig, ScoringConfig } from '@/lib/anthropic';
import { sendEmail, sendEmailWithBufferAttachment, getEmailCredentials, EmailCredentialsResult } from '@/lib/gmail';
import { scheduleRappelEmail } from '@/lib/qstash';
import { getValidCredentials, downloadFileFromDrive, GoogleCredentials } from '@/lib/google';
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
  data_mode: string;
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
    .select('id, name, data_mode, google_credentials, plaquette_url, prompt_qualification, prompt_synthese, prompt_plaquette, prompt_rappel, scoring_config')
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
  console.log('📧 Workflow Plaquette - Starting for prospect:', prospectId);

  try {
    const prospect = await getCrmProspect(prospectId);
    console.log('📧 Workflow Plaquette - Prospect loaded:', prospect?.email, prospect?.first_name, prospect?.last_name);

    if (!prospect.email) {
      console.log('📧 Workflow Plaquette - ERROR: No email');
      return { workflow: 'plaquette', success: false, actions, error: 'Email prospect manquant' };
    }

    // Check if already sent using metadata field or a new column
    // For now, we'll track this in metadata
    if (prospect.metadata?.mail_plaquette_sent) {
      console.log('📧 Workflow Plaquette - Already sent, skipping');
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
    console.log('📧 Workflow Plaquette - Advisor from params:', user.id, user.email);
    console.log('📧 Workflow Plaquette - Prospect assigned_to:', prospect.assigned_to);
    console.log('📧 Workflow Plaquette - Final advisor:', advisorUserId, advisorEmail);
    actions.push(`Conseiller: ${advisorEmail}`);

    // Get email credentials - try assigned advisor first
    let credentialsResponse = await getEmailCredentials(organization.id, advisorUserId);
    let emailCredentialsResult: EmailCredentialsResult | null = credentialsResponse.result;
    let warning: string | undefined;

    console.log('📧 Workflow Plaquette - Credentials result:', emailCredentialsResult?.source, emailCredentialsResult?.userId);

    // Handle invalid_grant error - fallback to organization
    if (credentialsResponse.error?.error === 'invalid_grant') {
      console.log('⚠️ Workflow Plaquette - Token invalide, fallback sur organisation');
      warning = credentialsResponse.error.message;
      actions.push(`⚠️ Token expiré: ${credentialsResponse.error.userEmail}`);

      // Try to get organization credentials as fallback
      const orgCredentials = await getEmailCredentials(organization.id);
      emailCredentialsResult = orgCredentials.result;

      if (emailCredentialsResult) {
        console.log('📧 Workflow Plaquette - Using org credentials as fallback');
        actions.push('Fallback: credentials organisation');
      }
    }

    if (!emailCredentialsResult) {
      console.log('📧 Workflow Plaquette - No credentials found, cannot send email');
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
  console.log('📧 Workflow RDV Validé - Starting for prospect:', prospectId);

  try {
    const prospect = await getCrmProspect(prospectId);
    console.log('📧 Workflow RDV Validé - Prospect loaded:', prospect?.email, prospect?.first_name, prospect?.last_name);

    if (!prospect.email) {
      console.log('📧 Workflow RDV Validé - ERROR: No email');
      return { workflow: 'rdv_valide', success: false, actions, error: 'Email prospect manquant' };
    }

    // Check if already sent
    if (prospect.metadata?.mail_synthese_sent) {
      console.log('📧 Workflow RDV Validé - Already sent, skipping');
      return { workflow: 'rdv_valide', success: true, actions: ['Déjà envoyé'] };
    }

    // Get full organization data
    const fullOrg = await getFullOrganization(organization.id);
    actions.push('Org data loaded');

    // Determine which user's Gmail to use
    // Priority: user parameter (assigned advisor from route) > prospect.assigned_to
    const advisorUserId = user.id || prospect.assigned_to;
    const advisorEmail = user.email || prospect.assigned_user?.email;
    console.log('📧 Workflow RDV Validé - Advisor from params:', user.id, user.email);
    console.log('📧 Workflow RDV Validé - Prospect assigned_to:', prospect.assigned_to);
    console.log('📧 Workflow RDV Validé - Final advisor:', advisorUserId, advisorEmail);
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
    let credentialsResponse = await getEmailCredentials(organization.id, advisorUserId);
    let emailCredentialsResult: EmailCredentialsResult | null = credentialsResponse.result;
    let warning: string | undefined;

    console.log('📧 Workflow RDV Validé - Credentials result:', emailCredentialsResult?.source, emailCredentialsResult?.userId);

    // Handle invalid_grant error - fallback to organization
    if (credentialsResponse.error?.error === 'invalid_grant') {
      console.log('⚠️ Workflow RDV Validé - Token invalide, fallback sur organisation');
      warning = credentialsResponse.error.message;
      actions.push(`⚠️ Token expiré: ${credentialsResponse.error.userEmail}`);

      // Try to get organization credentials as fallback
      const orgCredentials = await getEmailCredentials(organization.id);
      emailCredentialsResult = orgCredentials.result;

      if (emailCredentialsResult) {
        console.log('📧 Workflow RDV Validé - Using org credentials as fallback');
        actions.push('Fallback: credentials organisation');
      }
    }

    if (!emailCredentialsResult) {
      console.log('📧 Workflow RDV Validé - No credentials found, cannot send email');
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
      console.log('📧 Workflow RDV - Raw date source:', rdvDateSource);
      console.log('📧 Workflow RDV - Source type:', prospect.metadata?.rdv_datetime ? 'metadata.rdv_datetime' : 'expected_close_date');

      const rdvDate = new Date(rdvDateSource as string);
      console.log('📧 Workflow RDV - Parsed as Date:', rdvDate.toString());
      console.log('📧 Workflow RDV - ISO:', rdvDate.toISOString());
      console.log('📧 Workflow RDV - UTC hours:', rdvDate.getUTCHours());

      dateRdvFormatted = rdvDate.toLocaleString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Paris', // Force Paris timezone
      });
      console.log('📧 Workflow RDV - Formatted for Paris:', dateRdvFormatted);
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

    const result = await sendEmail(emailCredentialsResult.credentials, {
      to: prospect.email,
      subject: email.objet,
      body: emailBody, // Use modified body with Meet link
    });
    actions.push('Email synthèse envoyé');

    // 4. Update prospect metadata
    await updateCrmProspect(prospectId, {
      metadata: {
        ...(prospect.metadata || {}),
        mail_synthese_sent: true,
        mail_synthese_sent_at: new Date().toISOString(),
      },
    });

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

    // 6. Log activity
    await logActivity(
      organization.id,
      prospectId,
      advisorUserId,
      'email',
      'Email synthèse RDV envoyé',
      emailBody
    );

    // Log email
    await logEmailSent(
      organization.id,
      prospect.email,
      `${prospect.first_name} ${prospect.last_name}`.trim(),
      'synthese',
      email.objet,
      emailBody,
      result.messageId
    );

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
  console.log('🔄 CRM Workflow - Stage:', stageSlug, 'Subtype:', subtype, 'ProspectId:', prospectId);
  console.log('🔄 CRM Workflow - Organization:', organization.id, 'Mode:', organization.data_mode);
  console.log('🔄 CRM Workflow - User:', user.id, user.email);

  // Only trigger for CRM mode
  if (organization.data_mode !== 'crm') {
    console.log('🔄 CRM Workflow - Skipping: not CRM mode');
    return null;
  }

  // Determine which workflow to trigger

  // Plaquette workflow: en_attente (or similar) + plaquette subtype
  // Sends email with PDF plaquette attachment
  if (WAITING_STAGE_SLUGS.includes(stageSlug) && subtype === 'plaquette') {
    console.log('🔄 CRM Workflow - Triggering PLAQUETTE workflow');
    return await workflowPlaquette(prospectId, organization, user);
  }

  // RDV workflow: rdv_pris OR rdv_valide
  // Does: Qualification IA + Email récap + Rappel 24h
  if (RDV_STAGE_SLUGS.includes(stageSlug)) {
    console.log('🔄 CRM Workflow - Triggering RDV_VALIDE workflow');
    return await workflowRdvValide(prospectId, organization, user);
  }

  // No workflow for this stage change
  console.log('🔄 CRM Workflow - No workflow for stage:', stageSlug);
  return null;
}
