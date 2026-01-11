import { createAdminClient } from '@/lib/supabase/admin';
import { getValidCredentials, GoogleCredentials, updateGoogleSheetCells } from '@/lib/google';
import { generateEmail, buildUserPrompt, DEFAULT_PROMPTS } from '@/lib/anthropic';
import { sendEmail } from '@/lib/gmail';
import { NextRequest, NextResponse } from 'next/server';
import type { RappelPayload } from '@/lib/qstash';

export const dynamic = 'force-dynamic';

async function handleRappel(request: NextRequest) {
  try {
    const payload: RappelPayload = await request.json();
    const { organizationId, prospectData, rowNumber } = payload;

    console.log('=== ENVOI RAPPEL 24H via QStash ===');
    console.log('Prospect:', prospectData.email);
    console.log('Organization:', organizationId);

    const supabase = createAdminClient();

    // Get organization with credentials
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, google_credentials, google_sheet_id, prompt_rappel')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      console.error('Organization not found:', orgError);
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (!org.google_credentials) {
      console.error('No Google credentials configured');
      return NextResponse.json({ error: 'No Google credentials' }, { status: 400 });
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

    // Get prompt
    const systemPrompt = org.prompt_rappel || DEFAULT_PROMPTS.rappel;
    const userPrompt = buildUserPrompt({
      prenom: prospectData.prenom,
      nom: prospectData.nom,
      email: prospectData.email,
      qualificationIA: prospectData.qualification,
      dateRdv: prospectData.dateRdvFormatted || prospectData.date_rdv,
    });

    // Generate email with Claude
    const email = await generateEmail(systemPrompt, userPrompt);
    console.log('Email generated:', email.objet);

    // Send email via Gmail
    const result = await sendEmail(credentials, {
      to: prospectData.email,
      subject: email.objet,
      body: email.corps,
    });

    console.log('Email sent, messageId:', result.messageId);

    // Update column Y (Mail Rappel = Oui) if row_number is available
    if (rowNumber && org.google_sheet_id) {
      await updateGoogleSheetCells(credentials, org.google_sheet_id, [
        { range: `Y${rowNumber}`, value: 'Oui' },
      ]);
      console.log(`Updated Sheet row ${rowNumber} column Y = Oui`);
    }

    // Log email sent
    await supabase.from('email_logs').insert({
      organization_id: org.id,
      prospect_email: prospectData.email,
      prospect_name: `${prospectData.prenom} ${prospectData.nom}`.trim(),
      email_type: 'rappel',
      subject: email.objet,
      body: email.corps,
      gmail_message_id: result.messageId,
      sent_at: new Date().toISOString(),
    });

    console.log('Rappel envoye a', prospectData.email);

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Erreur envoi rappel:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to send rappel email', details: errorMessage },
      { status: 500 }
    );
  }
}

// Verify QStash signature in production
export async function POST(request: NextRequest) {
  // In production, verify QStash signature
  if (process.env.NODE_ENV === 'production' && process.env.QSTASH_CURRENT_SIGNING_KEY) {
    const signature = request.headers.get('upstash-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Dynamic import to avoid build-time errors
    const { Receiver } = await import('@upstash/qstash');

    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY as string,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY as string,
    });

    const body = await request.text();
    const isValid = await receiver.verify({
      signature,
      body,
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Create a new request with the body for the handler
    const newRequest = new NextRequest(request.url, {
      method: request.method,
      headers: request.headers,
      body: body,
    });

    return handleRappel(newRequest);
  }

  // In development, skip signature verification
  return handleRappel(request);
}
