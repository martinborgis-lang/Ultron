import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/admin';
import { getValidCredentials, GoogleCredentials, downloadFileFromDrive } from '@/lib/google';
import { generateEmailWithConfig, DEFAULT_PROMPTS, PromptConfig } from '@/lib/anthropic';
import { sendEmailWithBufferAttachment, getEmailCredentialsByEmail } from '@/lib/gmail';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface PlaquettePayload {
  organizationId?: string;  // CRM mode - organization ID
  prospectId?: string;      // CRM mode - prospect ID
  // Legacy fields for backward compatibility
  sheet_id?: string;
  row_number?: number;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    logger.debug('📄 Webhook plaquette déclenché:', payload);

    // CRM Mode: Use organizationId + prospectId
    if (payload.organizationId && payload.prospectId) {
      return await handleCrmPlaquette(payload);
    }

    // Legacy mode no longer supported
    if (payload.sheet_id) {
      return NextResponse.json(
        { error: 'Google Sheets mode deprecated - Use CRM mode with organizationId + prospectId' },
        { status: 410 }
      );
    }

    return NextResponse.json(
      { error: 'Missing required fields: organizationId and prospectId' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('Webhook plaquette error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

async function handleCrmPlaquette(payload: { organizationId: string; prospectId: string }) {
  const supabase = createAdminClient();
  const actions: string[] = [];

  // Get organization with plaquette configuration
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, google_credentials, plaquette_url, prompt_plaquette')
    .eq('id', payload.organizationId)
    .single();

  if (orgError || !org) {
    return NextResponse.json(
      { error: 'Organization not found' },
      { status: 404 }
    );
  }
  actions.push('Organization loaded');

  if (!org.plaquette_url) {
    return NextResponse.json(
      { error: 'Plaquette not configured for this organization' },
      { status: 400 }
    );
  }

  // Get prospect from CRM
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
  actions.push('Prospect loaded');

  if (!prospect.email) {
    return NextResponse.json(
      { error: 'Prospect email not available' },
      { status: 400 }
    );
  }

  try {
    // Check if plaquette already sent
    if (prospect.metadata?.mail_plaquette_sent) {
      return NextResponse.json({
        success: true,
        message: 'Plaquette already sent',
        actions: [...actions, 'Already sent - skipped']
      });
    }

    // Get Google credentials for downloading plaquette
    if (!org.google_credentials) {
      return NextResponse.json(
        { error: 'Google credentials not configured' },
        { status: 400 }
      );
    }

    const credentials = await getValidCredentials(org.google_credentials as GoogleCredentials);
    if (!credentials) {
      return NextResponse.json(
        { error: 'Invalid Google credentials' },
        { status: 400 }
      );
    }
    actions.push('Google credentials validated');

    // Download plaquette from Google Drive
    const plaquetteFile = await downloadFileFromDrive(credentials, org.plaquette_url);
    actions.push('Plaquette downloaded');

    // Generate email content
    const emailPrompt = org.prompt_plaquette || DEFAULT_PROMPTS.plaquette;
    const emailContent = await generateEmailWithConfig(
      emailPrompt,
      DEFAULT_PROMPTS.plaquette,
      {
        nom: prospect.last_name,
        prenom: prospect.first_name,
        email: prospect.email,
        besoins: prospect.notes,
        qualification: prospect.qualification
      }
    );
    actions.push('Email content generated');

    // Get advisor email for sending
    const advisorEmail = prospect.assigned_user?.email;
    if (!advisorEmail) {
      return NextResponse.json(
        { error: 'Assigned advisor email not found' },
        { status: 400 }
      );
    }

    // Send email with plaquette attachment
    const emailResult = await sendEmailWithBufferAttachment(
      org.google_credentials,
      {
        from: advisorEmail,
        to: prospect.email,
        subject: emailContent.objet,
        body: emailContent.corps,
        attachmentBuffer: plaquetteFile.data,
        attachmentName: plaquetteFile.fileName || 'plaquette.pdf',
        attachmentMimeType: plaquetteFile.mimeType || 'application/pdf'
      },
      payload.organizationId
    );

    if (emailResult.messageId) {
      actions.push('✅ Email plaquette envoyé');

      // Update prospect to mark plaquette as sent
      await supabase
        .from('crm_prospects')
        .update({
          metadata: {
            ...prospect.metadata,
            mail_plaquette_sent: true,
            mail_plaquette_sent_at: new Date().toISOString()
          }
        })
        .eq('id', payload.prospectId);

      actions.push('✅ Prospect updated - plaquette marked as sent');
    } else {
      actions.push(`❌ Erreur email`);
      return NextResponse.json({
        success: false,
        error: 'Failed to send email',
        actions
      }, { status: 500 });
    }

    logger.debug('✅ Plaquette workflow completed:', {
      prospectId: payload.prospectId,
      actions
    });

    return NextResponse.json({
      success: true,
      actions,
      message: 'Plaquette sent successfully'
    });

  } catch (error) {
    logger.error('Plaquette process error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    actions.push(`❌ Erreur traitement: ${errorMessage}`);

    return NextResponse.json({
      success: false,
      error: 'Failed to send plaquette',
      actions
    }, { status: 500 });
  }
}