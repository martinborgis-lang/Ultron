import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { generateEmailWithConfig, DEFAULT_PROMPTS, qualifyProspect } from '@/lib/anthropic';
import { sendEmail, getEmailCredentials } from '@/lib/gmail';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface WebhookPayload {
  organizationId?: string;  // CRM mode - organization ID
  prospectId?: string;      // CRM mode - prospect ID
  // Legacy fields for backward compatibility
  sheet_id?: string;
  row_number?: number;
}

export async function POST(request: NextRequest) {
  const now = new Date().toISOString();
  const startTime = Date.now();

  try {
    const payload = await request.json();
    logger.debug(`[${now}] 📨 Webhook qualification déclenché:`, {
      payload,
      url: request.url
    });

    // CRM Mode: Use organizationId + prospectId
    if (payload.organizationId && payload.prospectId) {
      return await handleCrmQualification(payload);
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
    logger.error('Webhook qualification error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

async function handleCrmQualification(payload: { organizationId: string; prospectId: string }) {
  const supabase = createAdminClient();

  // Get organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, prompt_qualification, scoring_config')
    .eq('id', payload.organizationId)
    .single();

  if (orgError || !org) {
    return NextResponse.json(
      { error: 'Organization not found' },
      { status: 404 }
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

  try {
    // Qualify prospect using IA
    const qualificationData = {
      prenom: prospect.first_name || '',
      nom: prospect.last_name || '',
      email: prospect.email || '',
      telephone: prospect.phone,
      age: prospect.age?.toString(),
      situationPro: prospect.profession,
      revenus: prospect.revenus_annuels?.toString(),
      patrimoine: prospect.patrimoine_estime?.toString(),
      besoins: prospect.notes || '',
      notesAppel: prospect.notes || ''
    };

    const qualification = await qualifyProspect(
      qualificationData,
      org.scoring_config
    );

    // Update prospect with qualification
    const { error: updateError } = await supabase
      .from('crm_prospects')
      .update({
        qualification: qualification.qualification,
        score_ia: qualification.score,
        analyse_ia: qualification.justification,
        derniere_qualification: new Date().toISOString()
      })
      .eq('id', payload.prospectId);

    if (updateError) {
      logger.error('Error updating prospect qualification:', updateError);
      return NextResponse.json(
        { error: 'Failed to update prospect' },
        { status: 500 }
      );
    }

    logger.debug('✅ Prospect qualified successfully:', {
      prospectId: payload.prospectId,
      qualification: qualification.qualification,
      score: qualification.score
    });

    return NextResponse.json({
      success: true,
      qualification: qualification.qualification,
      score: qualification.score,
      message: 'Prospect qualified successfully'
    });

  } catch (error) {
    logger.error('Qualification process error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to qualify prospect: ${errorMessage}` },
      { status: 500 }
    );
  }
}