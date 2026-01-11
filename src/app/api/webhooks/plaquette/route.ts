import { createAdminClient } from '@/lib/supabase/admin';
import { getValidCredentials, GoogleCredentials, downloadFileFromDrive, updateGoogleSheetCells } from '@/lib/google';
import { generateEmail, buildUserPrompt, DEFAULT_PROMPTS } from '@/lib/anthropic';
import { sendEmailWithBufferAttachment } from '@/lib/gmail';
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
  plaquette_url?: string;
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
      .select('id, google_credentials, google_sheet_id, prompt_plaquette, plaquette_url')
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
    const plaquetteId = payload.plaquette_url || org.plaquette_url;

    if (!prospect.email) {
      return NextResponse.json(
        { error: 'Prospect has no email address' },
        { status: 400 }
      );
    }

    if (!plaquetteId) {
      return NextResponse.json(
        { error: 'No plaquette configured. Please configure it in Settings.' },
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

    // Download plaquette from Google Drive
    console.log('Downloading plaquette from Drive, fileId:', plaquetteId);
    const plaquetteFile = await downloadFileFromDrive(credentials, plaquetteId);
    console.log('Plaquette downloaded:', plaquetteFile.fileName, plaquetteFile.mimeType);

    // Get prompt (custom or default)
    const systemPrompt = org.prompt_plaquette || DEFAULT_PROMPTS.plaquette;
    const userPrompt = buildUserPrompt(prospect);

    // Generate email with Claude
    const email = await generateEmail(systemPrompt, userPrompt);

    // Send email with attachment via Gmail
    const result = await sendEmailWithBufferAttachment(credentials, {
      to: prospect.email,
      subject: email.objet,
      body: email.corps,
      attachmentBuffer: plaquetteFile.data,
      attachmentName: plaquetteFile.fileName,
      attachmentMimeType: plaquetteFile.mimeType,
    });

    // Update column W (Mail Plaquette Envoyé = Oui)
    if (payload.row_number) {
      await updateGoogleSheetCells(credentials, org.google_sheet_id, [
        { range: `W${payload.row_number}`, value: 'Oui' },
      ]);
    }

    // Log email sent
    await supabase.from('email_logs').insert({
      organization_id: org.id,
      prospect_email: prospect.email,
      prospect_name: `${prospect.prenom} ${prospect.nom}`.trim(),
      email_type: 'plaquette',
      subject: email.objet,
      body: email.corps,
      gmail_message_id: result.messageId,
      has_attachment: true,
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
    console.error('Plaquette webhook error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to process plaquette email', details: errorMessage },
      { status: 500 }
    );
  }
}
