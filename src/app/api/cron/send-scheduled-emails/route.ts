import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendEmail, getEmailCredentials } from '@/lib/gmail';
import { logger } from '@/lib/logger';

/**
 * CRON Job pour envoyer les emails programmés
 * Endpoint: GET /api/cron/send-scheduled-emails
 * Sécurisé par token CRON_SECRET
 * Fréquence recommandée: toutes les 15 minutes
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Sécurité CRON - vérifier le token
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.warn('CRON: Tentative accès non autorisé');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('🤖 CRON: Démarrage envoi emails programmés');

    const adminClient = createAdminClient();

    // 2. Récupérer emails à envoyer (scheduled_at <= maintenant)
    const { data: pendingEmails, error: fetchError } = await adminClient
      .from('scheduled_emails')
      .select(`
        *,
        prospect:crm_prospects(first_name, last_name, email),
        advisor:users(id, full_name, email, gmail_credentials),
        organization:organizations(id, name, email_recap_enabled)
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(50) // Traiter par batches pour éviter les timeouts
      .order('scheduled_at', { ascending: true });

    if (fetchError) {
      logger.error('CRON: Erreur fetch emails programmés:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      logger.info('CRON: Aucun email programmé à envoyer');
      return NextResponse.json({
        message: 'Aucun email à envoyer',
        processed: 0,
        duration_ms: Date.now() - startTime
      });
    }

    logger.info(`CRON: ${pendingEmails.length} emails à traiter`);

    const results: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    // 3. Traiter chaque email programmé
    for (const emailTask of pendingEmails) {
      const taskStartTime = Date.now();

      try {
        logger.debug(`CRON: Traitement email ${emailTask.id} pour ${emailTask.prospect?.email}`);

        // Vérifier que l'organisation a toujours l'email recap activé
        if (!emailTask.organization?.email_recap_enabled) {
          logger.info(`CRON: Email récap désactivé pour org ${emailTask.organization_id}, annulation`);

          await adminClient
            .from('scheduled_emails')
            .update({
              status: 'cancelled',
              error_message: 'Email récap désactivé au niveau organisation',
              updated_at: new Date().toISOString()
            })
            .eq('id', emailTask.id);

          results.push({ id: emailTask.id, status: 'cancelled', reason: 'disabled_at_org_level' });
          continue;
        }

        // Vérifier que le prospect existe encore
        if (!emailTask.prospect?.email) {
          throw new Error('Prospect ou email prospect manquant');
        }

        // 4. Récupérer credentials Gmail du conseiller
        const credentialsResponse = await getEmailCredentials(
          emailTask.organization_id,
          emailTask.advisor_id
        );

        if (!credentialsResponse.result) {
          throw new Error(`Pas de credentials Gmail pour conseiller ${emailTask.advisor?.email}`);
        }

        // 5. Envoyer l'email avec l'adresse du conseiller
        const sendResult = await sendEmail(credentialsResponse.result.credentials, {
          to: emailTask.email_data.prospect_data.email,
          subject: emailTask.email_data.subject,
          body: emailTask.email_data.body
        });

        logger.info(`CRON: Email envoyé avec succès (${sendResult.messageId})`);

        // 6. Marquer comme envoyé et enrichir les métadonnées
        const sentAt = new Date().toISOString();
        await adminClient
          .from('scheduled_emails')
          .update({
            status: 'sent',
            sent_at: sentAt,
            email_data: {
              ...emailTask.email_data,
              gmail_message_id: sendResult.messageId,
              sent_by_cron: true,
              actual_send_time: sentAt,
              processing_duration_ms: Date.now() - taskStartTime
            }
          })
          .eq('id', emailTask.id);

        // 7. Logger l'email dans email_logs
        await adminClient.from('email_logs').insert({
          organization_id: emailTask.organization_id,
          prospect_email: emailTask.email_data.prospect_data.email,
          prospect_name: `${emailTask.email_data.prospect_data.first_name} ${emailTask.email_data.prospect_data.last_name}`.trim(),
          email_type: emailTask.email_type,
          subject: emailTask.email_data.subject,
          body: emailTask.email_data.body,
          gmail_message_id: sendResult.messageId,
          sent_at: sentAt,
          scheduled_email_id: emailTask.id // Lien avec l'email programmé
        });

        // 8. Mettre à jour les métadonnées du prospect
        if (emailTask.prospect_id && emailTask.email_type === 'rdv_recap') {
          await adminClient
            .from('crm_prospects')
            .update({
              metadata: {
                // Garder les métadonnées existantes et ajouter les nouvelles
                mail_synthese_sent: true,
                mail_synthese_sent_at: sentAt,
                mail_synthese_gmail_id: sendResult.messageId
              }
            })
            .eq('id', emailTask.prospect_id);
        }

        results.push({
          id: emailTask.id,
          status: 'sent',
          prospect_email: emailTask.prospect?.email,
          gmail_message_id: sendResult.messageId,
          duration_ms: Date.now() - taskStartTime
        });
        successCount++;

      } catch (err: any) {
        logger.error(`CRON: Erreur envoi email ${emailTask.id}:`, err.message);
        errorCount++;

        // Incrémenter le retry_count
        const newRetryCount = (emailTask.retry_count || 0) + 1;
        const maxRetries = emailTask.max_retries || 3;

        if (newRetryCount >= maxRetries) {
          // Maximum de tentatives atteint - marquer comme échoué définitivement
          await adminClient
            .from('scheduled_emails')
            .update({
              status: 'failed',
              error_message: `Échec définitif après ${newRetryCount} tentatives: ${err.message}`,
              retry_count: newRetryCount,
              updated_at: new Date().toISOString()
            })
            .eq('id', emailTask.id);

          results.push({
            id: emailTask.id,
            status: 'failed_permanently',
            error: err.message,
            attempts: newRetryCount
          });
        } else {
          // Programmer un nouveau retry dans 30 minutes
          const nextRetryAt = new Date(Date.now() + 30 * 60 * 1000);

          await adminClient
            .from('scheduled_emails')
            .update({
              error_message: `Tentative ${newRetryCount}/${maxRetries}: ${err.message}`,
              retry_count: newRetryCount,
              scheduled_at: nextRetryAt.toISOString(), // Reprogrammer
              updated_at: new Date().toISOString()
            })
            .eq('id', emailTask.id);

          results.push({
            id: emailTask.id,
            status: 'retry_scheduled',
            error: err.message,
            next_retry_at: nextRetryAt.toISOString(),
            attempt: newRetryCount
          });
        }
      }
    }

    const totalDuration = Date.now() - startTime;
    const avgDurationPerEmail = results.length > 0 ? totalDuration / results.length : 0;

    logger.info(`✅ CRON: Traitement terminé - ${successCount} succès, ${errorCount} erreurs en ${totalDuration}ms`);

    return NextResponse.json({
      success: true,
      message: `Traitement terminé: ${successCount} emails envoyés, ${errorCount} erreurs`,
      stats: {
        processed: results.length,
        sent: successCount,
        errors: errorCount,
        duration_ms: totalDuration,
        avg_duration_per_email_ms: Math.round(avgDurationPerEmail)
      },
      results: results
    });

  } catch (error: any) {
    logger.error('CRON: Erreur critique:', error);

    return NextResponse.json({
      error: 'Erreur critique du CRON job',
      message: error.message,
      duration_ms: Date.now() - startTime
    }, { status: 500 });
  }
}

/**
 * Endpoint de statut pour vérifier la santé du CRON
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'status') {
      const adminClient = createAdminClient();

      const { data: stats, error } = await adminClient
        .from('scheduled_emails')
        .select('status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Dernières 24h

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const statusCount = stats.reduce((acc: any, email) => {
        acc[email.status] = (acc[email.status] || 0) + 1;
        return acc;
      }, {});

      return NextResponse.json({
        status: 'healthy',
        last_24h_stats: statusCount,
        total_last_24h: stats.length
      });
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}