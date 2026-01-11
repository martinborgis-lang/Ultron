import { createAdminClient } from '@/lib/supabase/admin';
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

    const supabase = createAdminClient();

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
    console.log('=== CREATION RAPPEL 24H ===');
    const dateRdvStr = prospect.dateRdv;
    console.log('Date RDV brute:', dateRdvStr);
    console.log('Organization ID:', org.id);

    let rappelResult: { scheduled: boolean; scheduledFor: string | null; error: string | null } = {
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
        console.log('Date RDV parsee:', rdvDate.toISOString());

        // Schedule reminder exactly 24h before RDV
        const scheduledFor = new Date(rdvDate.getTime() - 24 * 60 * 60 * 1000);
        console.log('Rappel programme pour:', scheduledFor.toISOString());

        // Only schedule if reminder is in the future
        if (scheduledFor > new Date()) {
          // Include row_number and formatted date in prospect_data
          const prospectWithRow = {
            ...prospect,
            row_number: payload.row_number,
            dateRdvFormatted: rdvDate.toLocaleString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
          };

          console.log('Inserting scheduled_email...');
          const { data: insertData, error: scheduleError } = await supabase
            .from('scheduled_emails')
            .insert({
              organization_id: org.id,
              prospect_data: prospectWithRow,
              email_type: 'rappel',
              scheduled_for: scheduledFor.toISOString(),
              status: 'pending',
            })
            .select()
            .single();

          if (scheduleError) {
            console.error('Erreur creation scheduled_email:', JSON.stringify(scheduleError));
            rappelResult.error = scheduleError.message;
          } else {
            console.log('Rappel 24h programme avec succes, ID:', insertData?.id);
            rappelResult.scheduled = true;
            rappelResult.scheduledFor = scheduledFor.toISOString();
          }
        } else {
          console.log('Rappel non programme: date deja passee');
          rappelResult.error = 'Date already passed';
        }
      } else {
        console.log('Impossible de parser la date RDV:', dateRdvStr);
        rappelResult.error = 'Cannot parse date';
      }
    } else {
      console.log('Pas de date RDV, rappel non programme');
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
