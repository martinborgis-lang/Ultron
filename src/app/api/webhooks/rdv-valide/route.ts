import { createClient } from '@/lib/supabase/server';
import { getValidCredentials, GoogleCredentials, updateGoogleSheetCells } from '@/lib/google';
import { generateEmail, buildUserPrompt, DEFAULT_PROMPTS, qualifyProspect } from '@/lib/anthropic';
import { sendEmail } from '@/lib/gmail';
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

    const supabase = await createClient();

    // Find organization by sheet_id
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, google_credentials, google_sheet_id, prompt_synthese')
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

    // Get valid credentials (refresh if needed)
    let credentials = await getValidCredentials(org.google_credentials as GoogleCredentials);

    // Update credentials if refreshed
    if (credentials !== org.google_credentials) {
      await supabase
        .from('organizations')
        .update({ google_credentials: credentials })
        .eq('id', org.id);
    }

    // Step 1: Qualify prospect if not already qualified
    let qualificationResult = null;
    if (!prospect.qualificationIA || prospect.qualificationIA.trim() === '') {
      console.log('Qualifying prospect before sending email...');

      qualificationResult = await qualifyProspect({
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
      });

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
        await updateGoogleSheetCells(credentials, org.google_sheet_id, [
          { range: `Q${rowNum}`, value: qualificationResult.qualification },
          { range: `R${rowNum}`, value: qualificationResult.score.toString() },
          { range: `S${rowNum}`, value: qualificationResult.priorite },
          { range: `T${rowNum}`, value: qualificationResult.justification },
        ]);
        console.log(`Updated Sheet row ${rowNum} with qualification: ${qualificationResult.qualification}`);
      }
    }

    // Step 3: Generate synthesis email with Claude (using qualification for tone)
    const systemPrompt = org.prompt_synthese || DEFAULT_PROMPTS.synthese;
    const userPrompt = buildUserPrompt({
      prenom: prospect.prenom,
      nom: prospect.nom,
      email: prospect.email,
      telephone: prospect.telephone,
      qualificationIA: prospect.qualificationIA,
      scoreIA: prospect.scoreIA,
      noteConseiller: prospect.notesAppel,
      dateRdv: prospect.dateRdv,
    });

    const email = await generateEmail(systemPrompt, userPrompt);
    console.log('Email generated:', JSON.stringify(email));

    // Step 4: Send email via Gmail
    const result = await sendEmail(credentials, {
      to: prospect.email,
      subject: email.objet,
      body: email.corps,
    });

    // Step 5: Update column X (Mail Synthèse = Oui)
    if (payload.row_number) {
      await updateGoogleSheetCells(credentials, org.google_sheet_id, [
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

    // Step 7: Schedule 24h reminder email
    if (prospect.dateRdv) {
      const parts = prospect.dateRdv.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts.map(Number);
        const rdvDate = new Date(year, month - 1, day);

        const reminderDate = new Date(rdvDate);
        reminderDate.setDate(reminderDate.getDate() - 1);
        reminderDate.setHours(9, 0, 0, 0);

        if (reminderDate > new Date()) {
          await supabase.from('scheduled_emails').insert({
            organization_id: org.id,
            prospect_data: prospect,
            email_type: 'rappel',
            scheduled_for: reminderDate.toISOString(),
            status: 'pending',
          });
        }
      }
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
