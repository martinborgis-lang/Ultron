import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase-admin';
import { getEmailCredentials, sendEmail } from '@/lib/gmail';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ScheduledEmailPayload {
  organization_id: string;
  prospect_id: string | null;
  advisor_id: string;
  email_type: string;
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
  scheduled_at: string;
}

async function handleScheduledEmail(request: NextRequest) {
  try {
    const payload: ScheduledEmailPayload = await request.json();
    const { organization_id, prospect_id, advisor_id, email_type, email_data, scheduled_at } = payload;

    logger.debug('=== ENVOI EMAIL PROGRAMMÉ via QStash ===');
    logger.debug('Type email:', email_type);
    logger.debug('Organization:', organization_id);
    logger.debug('Prospect:', prospect_id);
    logger.debug('Advisor:', advisor_id);
    logger.debug('Programmé pour:', scheduled_at);

    const supabase = createAdminClient();

    // Récupérer l'organisation
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, google_credentials, email_recap_enabled')
      .eq('id', organization_id)
      .single();

    if (orgError || !org) {
      logger.error('Organisation non trouvée:', organization_id);
      return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 404 });
    }

    // Vérifier si les emails récap sont toujours activés
    if (!org.email_recap_enabled) {
      logger.info('Emails récap désactivés pour organisation:', org.name);
      return NextResponse.json({
        success: true,
        message: 'Email récap désactivé - ignoré',
        skipped: true
      });
    }

    // Récupérer les infos du conseiller (pour Gmail)
    const { data: advisor, error: advisorError } = await supabase
      .from('users')
      .select('id, email, full_name, gmail_credentials')
      .eq('id', advisor_id)
      .single();

    if (advisorError || !advisor) {
      logger.error('Conseiller non trouvé:', advisor_id);
      return NextResponse.json({ error: 'Conseiller non trouvé' }, { status: 404 });
    }

    logger.debug('Conseiller trouvé:', advisor.email);

    // Récupérer les credentials Gmail (conseiller d'abord, puis org en fallback)
    const emailCredentialsResponse = await getEmailCredentials(organization_id, advisor_id);

    if (!emailCredentialsResponse.result) {
      logger.error('Aucun credentials Gmail disponible');
      return NextResponse.json({ error: 'Aucun credentials Gmail disponible' }, { status: 500 });
    }

    const emailCredentialsResult = emailCredentialsResponse.result;
    logger.debug('Credentials Gmail récupérés:', emailCredentialsResult.source);

    // Envoyer l'email
    try {
      const emailResult = await sendEmail(emailCredentialsResult.credentials, {
        to: email_data.prospect_data.email,
        subject: email_data.subject,
        body: email_data.body,
      });

      logger.info('✅ Email récap envoyé avec succès');

      // Enregistrer dans les logs d'email
      await supabase
        .from('email_logs')
        .insert({
          organization_id: organization_id,
          prospect_id: prospect_id,
          user_id: advisor_id,
          email_type: email_type,
          recipient: email_data.prospect_data.email,
          subject: email_data.subject,
          status: 'sent',
          gmail_message_id: emailResult.messageId,
          sent_at: new Date().toISOString(),
        });

      // Enregistrer une activité CRM si prospect_id existe
      if (prospect_id) {
        await supabase
          .from('crm_activities')
          .insert({
            organization_id: organization_id,
            prospect_id: prospect_id,
            user_id: advisor_id,
            type: 'email',
            direction: 'outbound',
            subject: email_data.subject,
            content: `Email récap post-RDV envoyé (${email_type})`,
            email_status: 'sent',
            metadata: {
              email_type: email_type,
              scheduled_at: scheduled_at,
              sent_via: 'qstash_scheduled',
            },
          });
      }

      return NextResponse.json({
        success: true,
        message: 'Email récap envoyé avec succès',
        messageId: emailResult.messageId,
        recipient: email_data.prospect_data.email,
      });

    } catch (emailError: any) {
      logger.error('❌ Erreur envoi email:', emailError);
      return NextResponse.json({
        error: 'Erreur envoi email',
        details: emailError.message || 'Erreur inconnue'
      }, { status: 500 });
    }

  } catch (error: any) {
    logger.error('=== ERREUR WEBHOOK SCHEDULED EMAIL ===', error);
    return NextResponse.json({
      error: 'Erreur traitement email programmé',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return handleScheduledEmail(request);
}