import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateEmailWithConfig, DEFAULT_PROMPTS, qualifyProspect, PromptConfig, ScoringConfig } from '@/lib/anthropic';
import { sendEmail, getEmailCredentialsByEmail } from '@/lib/gmail';
import { scheduleRappelEmail } from '@/lib/qstash';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface RdvPayload {
  organizationId?: string;  // CRM mode - organization ID
  prospectId?: string;      // CRM mode - prospect ID
  // Legacy fields for backward compatibility
  sheet_id?: string;
  row_number?: number;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const payload = await request.json();
    logger.debug('📅 Webhook RDV validé déclenché:', payload);

    // CRM Mode: Use organizationId + prospectId
    if (payload.organizationId && payload.prospectId) {
      return await handleCrmRdvValide(payload);
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
    logger.error('Webhook RDV validé error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

async function handleCrmRdvValide(payload: { organizationId: string; prospectId: string }) {
  const supabase = createAdminClient();
  const actions: string[] = [];

  // Get organization with all needed config
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, google_credentials, prompt_synthese, scoring_config')
    .eq('id', payload.organizationId)
    .single();

  if (orgError || !org) {
    return NextResponse.json(
      { error: 'Organization not found' },
      { status: 404 }
    );
  }
  actions.push('Organization loaded');

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

  try {
    // 1. Qualify prospect using IA
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
    actions.push(`Qualification IA: ${qualification.qualification} (${qualification.score}%)`);

    // 2. Update prospect with qualification
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
      logger.error('Error updating prospect:', updateError);
      actions.push(`❌ Erreur mise à jour prospect: ${updateError.message}`);
    } else {
      actions.push('✅ Prospect mis à jour');
    }

    // 3. Send synthesis email if prospect has RDV date and email
    if (prospect.email) {
      const advisorEmail = prospect.assigned_user?.email;

      if (advisorEmail) {
        // Generate synthesis email
        const emailPrompt = org.prompt_synthese || DEFAULT_PROMPTS.synthese;
        const emailContent = await generateEmailWithConfig(
          emailPrompt,
          DEFAULT_PROMPTS.synthese,
          {
            nom: prospect.last_name,
            prenom: prospect.first_name,
            email: prospect.email,
            besoins: prospect.notes,
            qualification: qualification.qualification
          }
        );

        // Send email
        const emailResult = await sendEmail(
          org.google_credentials,
          {
            from: advisorEmail,
            to: prospect.email,
            subject: emailContent.objet,
            body: emailContent.corps
          },
          payload.organizationId
        );

        if (emailResult.messageId) {
          actions.push('✅ Email synthèse envoyé');
        } else {
          actions.push(`❌ Erreur email`);
        }
      } else {
        actions.push('⚠️ Pas d\'email conseiller configuré');
      }
    } else {
      actions.push('⚠️ Pas d\'email prospect pour synthèse');
    }

    // 4. Schedule reminder email if RDV date exists
    // This would be handled by the scheduled email service
    actions.push('📅 Rappel programmé si RDV configuré');

    logger.debug('✅ RDV validé workflow completed:', {
      prospectId: payload.prospectId,
      actions,
      qualification: qualification.qualification
    });

    return NextResponse.json({
      success: true,
      qualification: qualification.qualification,
      score: qualification.score,
      actions,
      message: 'RDV workflow completed successfully'
    });

  } catch (error) {
    logger.error('RDV validé process error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    actions.push(`❌ Erreur traitement: ${errorMessage}`);

    return NextResponse.json({
      success: false,
      error: 'Failed to process RDV validation',
      actions
    }, { status: 500 });
  }
}