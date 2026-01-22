import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { generateEmail, buildUserPrompt, DEFAULT_PROMPTS } from '@/lib/anthropic';
import { sendEmail, getEmailCredentials } from '@/lib/gmail';
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
}

interface WebhookPayload {
  sheet_id: string;
  row_number?: number;
  conseiller_id?: string; // Optional: advisor's user ID for per-user Gmail
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
      .select('id, google_credentials, prompt_qualification')
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

    const prospect = mapToProspect(payload.data);

    if (!prospect.email) {
      return NextResponse.json(
        { error: 'Prospect has no email address' },
        { status: 400 }
      );
    }

    // Get email credentials (advisor's Gmail or fallback to org)
    const credentialsResponse = await getEmailCredentials(org.id, payload.conseiller_id);

    // Handle invalid_grant - fallback to org credentials
    let emailCredentialsResult = credentialsResponse.result;
    if (credentialsResponse.error?.error === 'invalid_grant') {
      logger.debug('⚠️ Token invalide, fallback sur organisation:', credentialsResponse.error.message);
      const orgCredentials = await getEmailCredentials(org.id);
      emailCredentialsResult = orgCredentials.result;
    }

    if (!emailCredentialsResult) {
      const errorMsg = credentialsResponse.error?.message || 'No email credentials available';
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }
    const emailCredentials = emailCredentialsResult.credentials;
    logger.debug('Using email credentials from:', emailCredentialsResult.source, emailCredentialsResult.userId || 'org');

    // Get prompt (custom or default)
    const systemPrompt = org.prompt_qualification || DEFAULT_PROMPTS.qualification;
    const userPrompt = buildUserPrompt(prospect);

    // Generate email with Claude
    const email = await generateEmail(systemPrompt, userPrompt);

    // Send email via Gmail (using advisor's Gmail or org fallback)
    const result = await sendEmail(emailCredentials, {
      to: prospect.email,
      subject: email.objet,
      body: email.corps,
    });

    // Log email sent
    await supabase.from('email_logs').insert({
      organization_id: org.id,
      prospect_email: prospect.email,
      prospect_name: `${prospect.prenom} ${prospect.nom}`.trim(),
      email_type: 'qualification',
      subject: email.objet,
      body: email.corps,
      gmail_message_id: result.messageId,
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      email: {
        to: prospect.email,
        subject: email.objet,
      },
    });
  } catch (error) {
    console.error('Qualification webhook error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to process qualification email', details: errorMessage },
      { status: 500 }
    );
  }
}
