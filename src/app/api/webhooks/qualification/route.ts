import { createClient } from '@/lib/supabase/server';
import { getValidCredentials, GoogleCredentials, Prospect } from '@/lib/google';
import { generateEmail, buildUserPrompt, DEFAULT_PROMPTS } from '@/lib/anthropic';
import { sendEmail } from '@/lib/gmail';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface WebhookPayload {
  sheet_id: string;
  prospect: Prospect;
}

export async function POST(request: NextRequest) {
  try {
    const payload: WebhookPayload = await request.json();

    if (!payload.sheet_id || !payload.prospect) {
      return NextResponse.json(
        { error: 'Missing sheet_id or prospect data' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

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

    const prospect = payload.prospect;

    if (!prospect.email) {
      return NextResponse.json(
        { error: 'Prospect has no email address' },
        { status: 400 }
      );
    }

    // Get valid credentials (refresh if needed)
    const credentials = await getValidCredentials(org.google_credentials as GoogleCredentials);

    // Update credentials if refreshed
    if (credentials !== org.google_credentials) {
      await supabase
        .from('organizations')
        .update({ google_credentials: credentials })
        .eq('id', org.id);
    }

    // Get prompt (custom or default)
    const systemPrompt = org.prompt_qualification || DEFAULT_PROMPTS.qualification;
    const userPrompt = buildUserPrompt(prospect);

    // Generate email with Claude
    const email = await generateEmail(systemPrompt, userPrompt);

    // Send email via Gmail
    const result = await sendEmail(credentials, {
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
