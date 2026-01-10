import { createClient } from '@/lib/supabase/server';
import { getValidCredentials, GoogleCredentials, Prospect } from '@/lib/google';
import { generateEmail, buildUserPrompt, DEFAULT_PROMPTS } from '@/lib/anthropic';
import { sendEmail } from '@/lib/gmail';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Vercel Cron secret verification
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;
  return authHeader === expectedToken;
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron authentication
    if (process.env.CRON_SECRET && !verifyCronAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Get all pending scheduled emails that are due
    const now = new Date();
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .limit(50); // Process in batches

    if (fetchError) {
      throw new Error(`Failed to fetch scheduled emails: ${fetchError.message}`);
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No pending emails to process',
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const scheduledEmail of pendingEmails) {
      try {
        // Get organization credentials
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id, google_credentials, prompt_rappel')
          .eq('id', scheduledEmail.organization_id)
          .single();

        if (orgError || !org?.google_credentials) {
          throw new Error('Organization not found or no credentials');
        }

        const prospect = scheduledEmail.prospect_data as Prospect;

        if (!prospect.email) {
          throw new Error('Prospect has no email');
        }

        // Get valid credentials
        const credentials = await getValidCredentials(org.google_credentials as GoogleCredentials);

        // Update credentials if refreshed
        if (credentials !== org.google_credentials) {
          await supabase
            .from('organizations')
            .update({ google_credentials: credentials })
            .eq('id', org.id);
        }

        // Get prompt
        const systemPrompt = org.prompt_rappel || DEFAULT_PROMPTS.rappel;
        const userPrompt = buildUserPrompt(prospect);

        // Generate email
        const email = await generateEmail(systemPrompt, userPrompt);

        // Send email
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
          email_type: 'rappel',
          subject: email.objet,
          body: email.corps,
          gmail_message_id: result.messageId,
          sent_at: new Date().toISOString(),
        });

        // Mark as sent
        await supabase
          .from('scheduled_emails')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', scheduledEmail.id);

        results.success++;
      } catch (emailError) {
        const errorMsg = emailError instanceof Error ? emailError.message : 'Unknown error';
        results.errors.push(`Email ${scheduledEmail.id}: ${errorMsg}`);

        // Mark as failed
        await supabase
          .from('scheduled_emails')
          .update({
            status: 'failed',
            error_message: errorMsg,
          })
          .eq('id', scheduledEmail.id);

        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: pendingEmails.length,
      results,
    });
  } catch (error) {
    console.error('Rappel cron error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to process reminder emails', details: errorMessage },
      { status: 500 }
    );
  }
}
