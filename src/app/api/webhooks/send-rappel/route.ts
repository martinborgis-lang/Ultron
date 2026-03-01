import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateEmailWithConfig, DEFAULT_PROMPTS, PromptConfig } from '@/lib/anthropic';
import { sendEmail, getEmailCredentialsByEmail } from '@/lib/gmail';
import { NextRequest, NextResponse } from 'next/server';
import type { RappelPayload } from '@/lib/qstash';

export const dynamic = 'force-dynamic';

interface CrmRappelPayload {
  organizationId: string;   // CRM mode - organization ID
  prospectId?: string;      // CRM mode - prospect ID (if available)
  conseillerId?: string;    // Optional: advisor's user ID for per-user Gmail
  conseillerEmail?: string; // Optional: advisor's email for per-user Gmail
  prospectData?: {          // Prospect data for reminder
    email: string;
    nom: string;
    prenom: string;
    date_rdv: string;
    dateRdvFormatted: string;
    qualification: string;
    besoins?: string;
  };
  // Legacy fields for backward compatibility
  sheet_id?: string;
  rowNumber?: number;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as CrmRappelPayload;
    logger.debug('📅 Webhook send-rappel déclenché:', payload);

    // CRM Mode: Use organizationId
    if (payload.organizationId) {
      return await handleCrmRappel(payload);
    }

    // Legacy QStash payload format
    if (payload.organizationId && payload.prospectData) {
      return await handleCrmRappel(payload);
    }

    // Legacy mode no longer supported
    if (payload.sheet_id) {
      return NextResponse.json(
        { error: 'Google Sheets mode deprecated - Use CRM mode with organizationId' },
        { status: 410 }
      );
    }

    return NextResponse.json(
      { error: 'Missing required fields: organizationId' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('Webhook send-rappel error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

async function handleCrmRappel(payload: CrmRappelPayload) {
  const supabase = createAdminClient();
  const actions: string[] = [];

  // Get organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, google_credentials, prompt_rappel')
    .eq('id', payload.organizationId)
    .single();

  if (orgError || !org) {
    return NextResponse.json(
      { error: 'Organization not found' },
      { status: 404 }
    );
  }
  actions.push('Organization loaded');

  let prospectData: any;

  // Get prospect data - either from prospectId or from payload.prospectData
  if (payload.prospectId) {
    const { data: prospect, error: prospectError } = await supabase
      .from('crm_prospects')
      .select('*, assigned_user:assigned_to(id, email)')
      .eq('id', payload.prospectId)
      .eq('organization_id', payload.organizationId)
      .single();

    if (prospectError || !prospect) {
      return NextResponse.json(
        { error: 'Prospect not found' },
        { status: 404 }
      );
    }

    prospectData = {
      email: prospect.email,
      nom: prospect.last_name,
      prenom: prospect.first_name,
      qualification: prospect.qualification,
      besoins: prospect.notes,
      assigned_user: prospect.assigned_user
    };
    actions.push('Prospect loaded from CRM');
  } else if (payload.prospectData) {
    // Use data from QStash payload
    prospectData = payload.prospectData;
    actions.push('Prospect data from QStash payload');
  } else {
    return NextResponse.json(
      { error: 'No prospect data available' },
      { status: 400 }
    );
  }

  if (!prospectData.email) {
    return NextResponse.json(
      { error: 'Prospect email not available' },
      { status: 400 }
    );
  }

  try {
    // Determine which email to use for sending
    let senderEmail = payload.conseillerEmail;
    if (!senderEmail && prospectData.assigned_user?.email) {
      senderEmail = prospectData.assigned_user.email;
    }

    if (!senderEmail) {
      return NextResponse.json(
        { error: 'No sender email available (conseiller or assigned user)' },
        { status: 400 }
      );
    }

    // Generate reminder email content
    const emailPrompt = org.prompt_rappel || DEFAULT_PROMPTS.rappel;
    const emailContent = await generateEmailWithConfig(
      emailPrompt,
      DEFAULT_PROMPTS.rappel,
      {
        nom: prospectData.nom,
        prenom: prospectData.prenom,
        email: prospectData.email,
        qualification: prospectData.qualification,
        besoins: prospectData.besoins,
        date_rdv: prospectData.date_rdv
      }
    );
    actions.push('Email content generated');

    // Send reminder email
    const emailResult = await sendEmail(
      org.google_credentials,
      {
        from: senderEmail,
        to: prospectData.email,
        subject: emailContent.objet,
        body: emailContent.corps
      },
      payload.organizationId
    );

    if (emailResult.messageId) {
      actions.push('✅ Email rappel envoyé');

      // Update prospect if we have prospectId
      if (payload.prospectId) {
        await supabase
          .from('crm_prospects')
          .update({
            metadata: {
              mail_rappel_sent: true,
              mail_rappel_sent_at: new Date().toISOString()
            }
          })
          .eq('id', payload.prospectId);

        actions.push('✅ Prospect updated - rappel marked as sent');
      }
    } else {
      actions.push(`❌ Erreur email`);
      return NextResponse.json({
        success: false,
        error: 'Failed to send reminder email',
        actions
      }, { status: 500 });
    }

    logger.debug('✅ Rappel workflow completed:', {
      prospectId: payload.prospectId,
      prospectEmail: prospectData.email,
      actions
    });

    return NextResponse.json({
      success: true,
      actions,
      message: 'Reminder email sent successfully'
    });

  } catch (error) {
    logger.error('Rappel process error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    actions.push(`❌ Erreur traitement: ${errorMessage}`);

    return NextResponse.json({
      success: false,
      error: 'Failed to send reminder email',
      actions
    }, { status: 500 });
  }
}