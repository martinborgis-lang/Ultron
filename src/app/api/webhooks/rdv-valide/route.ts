import { logger } from '@/lib/logger';

import { createAdminClient } from '@/lib/supabase/admin';
import { getValidCredentials, GoogleCredentials, updateGoogleSheetCells } from '@/lib/google';
import { generateEmailWithConfig, DEFAULT_PROMPTS, qualifyProspect, PromptConfig, ScoringConfig } from '@/lib/anthropic';
import { sendEmail, getEmailCredentialsByEmail } from '@/lib/gmail';
import { scheduleRappelEmail } from '@/lib/qstash';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface WebhookData {
  id?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  age?: string;
  situation_pro?: string;
  revenus?: string;
  patrimoine?: string;
  besoins?: string;
  notes_appel?: string;
  statut?: string;
  date_rdv?: string;
  qualification?: string;
  score?: string;
  priorite?: string;
  conseiller_email?: string;
}

interface WebhookPayload {
  sheet_id: string;
  row_number?: number;
  conseiller_id?: string; // Optional: advisor's user ID for per-user Gmail
  conseiller_email?: string; // Optional: advisor's email (from Apps Script column Z)
  data: WebhookData;
}

function mapToProspect(data: WebhookData) {
  return {
    id: data.id || '',
    nom: data.nom || '',
    prenom: data.prenom || '',
    email: data.email || '',
    telephone: data.telephone || '',
    age: data.age || '',
    situationPro: data.situation_pro || '',
    revenus: data.revenus || '',
    patrimoine: data.patrimoine || '',
    besoins: data.besoins || '',
    notesAppel: data.notes_appel || '',
    statutAppel: data.statut || '',
    dateRdv: data.date_rdv || '',
    qualificationIA: data.qualification || '',
    scoreIA: data.score || '',
    prioriteIA: data.priorite || '',
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload: WebhookPayload = await request.json();

    if (!payload.sheet_id || !payload.data) {
      return NextResponse.json(
        { error: 'Missing sheet_id or data' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Find organization by sheet_id
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, google_credentials, google_sheet_id, prompt_synthese, scoring_config')
      .eq('google_sheet_id', payload.sheet_id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found for this sheet_id' },
        { status: 404 }
      );
    }

    if (!org.google_credentials) {
      return NextResponse.json(
        { error: 'Google credentials not configured' },
        { status: 400 }
      );
    }

    let prospect = mapToProspect(payload.data);

    if (!prospect.email) {
      return NextResponse.json(
        { error: 'Prospect has no email address' },
        { status: 400 }
      );
    }

    // Get valid credentials for Sheet operations (always org-level)
    const sheetCredentials = await getValidCredentials(org.google_credentials as GoogleCredentials);

    // Update org credentials if refreshed
    if (sheetCredentials !== org.google_credentials) {
      await supabase
        .from('organizations')
        .update({ google_credentials: sheetCredentials })
        .eq('id', org.id);
    }

    // Get email credentials (advisor's Gmail by email, or fallback to org)
    const conseillerEmail = payload.conseiller_email || payload.data?.conseiller_email;
    const credentialsResponse = await getEmailCredentialsByEmail(org.id, conseillerEmail);

    // Handle invalid_grant - fallback to org credentials
    let emailCredentialsResult = credentialsResponse.result;
    if (credentialsResponse.error?.error === 'invalid_grant') {
      logger.debug('⚠️ Token invalide, fallback sur organisation:', credentialsResponse.error.message);
      const orgCredentials = await getEmailCredentialsByEmail(org.id);
      emailCredentialsResult = orgCredentials.result;
    }

    if (!emailCredentialsResult) {
      const errorMsg = credentialsResponse.error?.message || 'No email credentials available';
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }
    const emailCredentials = emailCredentialsResult.credentials;
    logger.debug('Using email credentials from:', emailCredentialsResult.source, emailCredentialsResult.userId || 'org');

    // Step 1: Qualify prospect if not already qualified
    let qualificationResult = null;
    if (!prospect.qualificationIA || prospect.qualificationIA.trim() === '') {
      logger.debug('Qualifying prospect before sending email...');

      qualificationResult = await qualifyProspect(
        {
          prenom: prospect.prenom,
          nom: prospect.nom,
          email: prospect.email,
          telephone: prospect.telephone,
          age: prospect.age,
          situationPro: prospect.situationPro,
          revenus: prospect.revenus,
          patrimoine: prospect.patrimoine,
          besoins: prospect.besoins,
          notesAppel: prospect.notesAppel,
        },
        org.scoring_config as ScoringConfig | null
      );

      // Update prospect object with new qualification
      prospect = {
        ...prospect,
        qualificationIA: qualificationResult.qualification,
        scoreIA: qualificationResult.score.toString(),
        prioriteIA: qualificationResult.priorite,
      };

      // Step 2: Update Google Sheet columns Q, R, S, T (row_number is 1-indexed)
      if (payload.row_number) {
        const rowNum = payload.row_number;
        await updateGoogleSheetCells(sheetCredentials, org.google_sheet_id, [
          { range: `Q${rowNum}`, value: qualificationResult.qualification },
          { range: `R${rowNum}`, value: qualificationResult.score.toString() },
          { range: `S${rowNum}`, value: qualificationResult.priorite },
          { range: `T${rowNum}`, value: qualificationResult.justification },
        ]);
        logger.debug(`Updated Sheet row ${rowNum} with qualification: ${qualificationResult.qualification}`);
      }
    }

    // Step 3: Generate synthesis email with Claude (using qualification for tone)
    const promptConfig = org.prompt_synthese as PromptConfig | null;
    const email = await generateEmailWithConfig(
      promptConfig,
      DEFAULT_PROMPTS.synthese,
      {
        prenom: prospect.prenom,
        nom: prospect.nom,
        email: prospect.email,
        qualification: prospect.qualificationIA,
        besoins: prospect.besoins,
        notes_appel: prospect.notesAppel,
        date_rdv: prospect.dateRdv,
      }
    );
    logger.debug('Email generated:', JSON.stringify(email));

    // Step 4: Send email via Gmail (using advisor's Gmail or org fallback)
    const result = await sendEmail(emailCredentials, {
      to: prospect.email,
      subject: email.objet,
      body: email.corps,
    });

    // Step 5: Update column X (Mail Synthèse = Oui)
    if (payload.row_number) {
      await updateGoogleSheetCells(sheetCredentials, org.google_sheet_id, [
        { range: `X${payload.row_number}`, value: 'Oui' },
      ]);
    }

    // Step 6: Log email sent
    await supabase.from('email_logs').insert({
      organization_id: org.id,
      prospect_email: prospect.email,
      prospect_name: `${prospect.prenom} ${prospect.nom}`.trim(),
      email_type: 'synthese',
      subject: email.objet,
      body: email.corps,
      gmail_message_id: result.messageId,
      sent_at: new Date().toISOString(),
    });

    // Step 7: Schedule 24h reminder email via QStash
    logger.debug('=== PROGRAMMATION RAPPEL 24H via QStash ===');
    const dateRdvStr = prospect.dateRdv;
    logger.debug('Date RDV brute:', dateRdvStr);
    logger.debug('Organization ID:', org.id);

    const rappelResult: { scheduled: boolean; scheduledFor: string | null; error: string | null; messageId?: string } = {
      scheduled: false,
      scheduledFor: null,
      error: null,
    };

    if (dateRdvStr && dateRdvStr.trim() !== '') {
      let rdvDate: Date | null = null;

      // Parse date - format français "DD/MM/YYYY HH:mm" or "DD/MM/YYYY"
      if (dateRdvStr.includes('/')) {
        const [datePart, timePart] = dateRdvStr.split(' ');
        const dateParts = datePart.split('/');

        if (dateParts.length === 3) {
          const [day, month, year] = dateParts.map(Number);
          const [hours, minutes] = (timePart || '09:00').split(':').map(Number);
          rdvDate = new Date(year, month - 1, day, hours || 9, minutes || 0);
        }
      } else {
        // Try ISO format
        rdvDate = new Date(dateRdvStr);
      }

      if (rdvDate && !isNaN(rdvDate.getTime())) {
        logger.debug('Date RDV parsee:', rdvDate.toISOString());

        // Schedule reminder exactly 24h before RDV
        const scheduledFor = new Date(rdvDate.getTime() - 24 * 60 * 60 * 1000);
        logger.debug('Rappel programme pour:', scheduledFor.toISOString());

        // Only schedule if reminder is in the future
        if (scheduledFor > new Date()) {
          try {
            // Schedule via QStash (include conseiller_email for per-advisor Gmail)
            const qstashResult = await scheduleRappelEmail(scheduledFor, {
              organizationId: org.id,
              conseillerId: payload.conseiller_id,
              conseillerEmail: conseillerEmail,
              prospectData: {
                email: prospect.email,
                nom: prospect.nom,
                prenom: prospect.prenom,
                date_rdv: rdvDate.toISOString(),
                dateRdvFormatted: rdvDate.toLocaleString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Europe/Paris', // Force Paris timezone
                }),
                qualification: prospect.qualificationIA,
                besoins: prospect.besoins,
              },
              rowNumber: payload.row_number,
            });

            logger.debug('Rappel programme via QStash, messageId:', qstashResult.messageId);
            rappelResult.scheduled = true;
            rappelResult.scheduledFor = scheduledFor.toISOString();
            rappelResult.messageId = qstashResult.messageId;
          } catch (qstashError) {
            console.error('Erreur programmation QStash:', qstashError);
            rappelResult.error = qstashError instanceof Error ? qstashError.message : 'QStash error';
          }
        } else {
          logger.debug('Rappel non programme: date deja passee');
          rappelResult.error = 'Date already passed';
        }
      } else {
        logger.debug('Impossible de parser la date RDV:', dateRdvStr);
        rappelResult.error = 'Cannot parse date';
      }
    } else {
      logger.debug('Pas de date RDV, rappel non programme');
      rappelResult.error = 'No date_rdv provided';
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      qualified: qualificationResult !== null,
      qualification: prospect.qualificationIA,
      email: {
        to: prospect.email,
        subject: email.objet,
      },
      emailSentFrom: emailCredentialsResult.source === 'user' ? conseillerEmail : 'organization',
      rappel: rappelResult,
    });
  } catch (error) {
    console.error('RDV validation webhook error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to process RDV validation email', details: errorMessage },
      { status: 500 }
    );
  }
}
