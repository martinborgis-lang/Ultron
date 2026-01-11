import { createAdminClient } from '@/lib/supabase/admin';
import { getValidCredentials, GoogleCredentials, updateGoogleSheetCells } from '@/lib/google';
import { generateEmail, buildUserPrompt, DEFAULT_PROMPTS } from '@/lib/anthropic';
import { sendEmail } from '@/lib/gmail';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ProspectData {
  id?: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  dateRdv?: string;
  qualificationIA?: string;
  scoreIA?: string;
  besoins?: string;
  notesAppel?: string;
  row_number?: number;
}

interface ScheduledEmail {
  id: string;
  organization_id: string;
  prospect_data: ProspectData;
  email_type: string;
  scheduled_for: string;
  status: string;
}

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

    const supabase = createAdminClient();
    const now = new Date();

    // Get all pending scheduled emails that are due
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .limit(50);

    if (fetchError) {
      throw new Error(`Failed to fetch scheduled emails: ${fetchError.message}`);
    }

    console.log(`CRON rappel-24h: ${pendingEmails?.length || 0} rappels en attente`);

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
      skipped: 0,
      errors: [] as string[],
    };

    for (const scheduledEmail of pendingEmails as ScheduledEmail[]) {
      // Mark as "processing" immediately (anti-duplicate protection)
      const { error: updateError, count } = await supabase
        .from('scheduled_emails')
        .update({ status: 'processing' })
        .eq('id', scheduledEmail.id)
        .eq('status', 'pending'); // Double check - only update if still pending

      // If already taken by another process, skip
      if (updateError || count === 0) {
        console.log(`Rappel ${scheduledEmail.id} deja en cours de traitement`);
        results.skipped++;
        continue;
      }

      try {
        const prospect = scheduledEmail.prospect_data;
        console.log(`Traitement rappel pour ${prospect.email}`);

        if (!prospect.email) {
          throw new Error('Prospect has no email');
        }

        // Get organization credentials
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id, google_credentials, google_sheet_id, prompt_rappel')
          .eq('id', scheduledEmail.organization_id)
          .single();

        if (orgError || !org?.google_credentials) {
          throw new Error('Organization not found or no credentials');
        }

        // Get valid credentials
        let credentials = await getValidCredentials(org.google_credentials as GoogleCredentials);

        // Update credentials if refreshed
        if (credentials !== org.google_credentials) {
          await supabase
            .from('organizations')
            .update({ google_credentials: credentials })
            .eq('id', org.id);
        }

        // Get prompt
        const systemPrompt = org.prompt_rappel || DEFAULT_PROMPTS.rappel;
        const userPrompt = buildUserPrompt({
          prenom: prospect.prenom,
          nom: prospect.nom,
          email: prospect.email,
          telephone: prospect.telephone,
          qualificationIA: prospect.qualificationIA,
          scoreIA: prospect.scoreIA,
          dateRdv: prospect.dateRdv,
        });

        // Generate email
        const email = await generateEmail(systemPrompt, userPrompt);

        // Send email
        const result = await sendEmail(credentials, {
          to: prospect.email,
          subject: email.objet,
          body: email.corps,
        });

        // Update column Y (Mail Rappel = Oui) if row_number is available
        if (prospect.row_number && org.google_sheet_id) {
          await updateGoogleSheetCells(credentials, org.google_sheet_id, [
            { range: `Y${prospect.row_number}`, value: 'Oui' },
          ]);
          console.log(`Updated Sheet row ${prospect.row_number} column Y = Oui`);
        }

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

        console.log(`Rappel envoye a ${prospect.email}`);
        results.success++;

      } catch (emailError) {
        const errorMsg = emailError instanceof Error ? emailError.message : 'Unknown error';
        console.error(`Erreur rappel ${scheduledEmail.id}:`, errorMsg);
        results.errors.push(`Email ${scheduledEmail.id}: ${errorMsg}`);

        // Mark as error
        await supabase
          .from('scheduled_emails')
          .update({
            status: 'error',
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
