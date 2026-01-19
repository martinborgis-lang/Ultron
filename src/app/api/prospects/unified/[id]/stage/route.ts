import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { getProspectService } from '@/lib/services/factories/prospect-factory';
import { mapStageToSheetStatus, WaitingSubtype } from '@/types/pipeline';
import { triggerCrmWorkflow } from '@/lib/services/workflows/crm-workflow-service';
import { createAdminClient } from '@/lib/supabase-admin';
import type { ProspectData } from '@/lib/services/interfaces';

export const dynamic = 'force-dynamic';

interface StageUpdateBody {
  stage?: string;
  stage_slug?: string;
  subtype?: WaitingSubtype;
  assignedTo?: string; // ID du conseiller assigné (pour les emails)
}

interface WorkflowResult {
  endpoint?: string;
  workflow?: string;
  status?: number;
  success?: boolean;
  result?: unknown;
  error?: string;
  actions?: string[];
}

/**
 * Get advisor info (email) from user ID
 */
async function getAdvisorEmail(userId: string, organizationId: string): Promise<string | null> {
  const adminClient = createAdminClient();
  const { data: user } = await adminClient
    .from('users')
    .select('email')
    .eq('id', userId)
    .eq('organization_id', organizationId)
    .single();
  return user?.email || null;
}

/**
 * Trigger workflow for Sheet mode
 * Calls the webhook directly since Apps Script onEdit doesn't fire for API changes
 */
async function triggerSheetWorkflow(
  stageSlug: string,
  subtype: WaitingSubtype | undefined,
  prospect: ProspectData,
  organization: { id: string; google_sheet_id?: string },
  advisorEmail: string
): Promise<WorkflowResult | null> {
  // Determine which webhook to call based on the new status
  const sheetStatus = mapStageToSheetStatus(stageSlug, subtype);

  let webhookEndpoint: string | null = null;

  if (sheetStatus === 'À rappeler - Plaquette') {
    // Check if mail not already sent
    if (!prospect.mailPlaquetteEnvoye) {
      webhookEndpoint = '/api/webhooks/plaquette';
    }
  } else if (sheetStatus === 'RDV Validé') {
    // Check if mail not already sent
    if (!prospect.mailSyntheseEnvoye) {
      webhookEndpoint = '/api/webhooks/rdv-valide';
    }
  }

  if (!webhookEndpoint) {
    console.log('📧 No workflow to trigger for status:', sheetStatus);
    return null;
  }

  console.log('📧 Triggering Sheet workflow:', webhookEndpoint, 'for status:', sheetStatus);
  console.log('📧 Using advisor email:', advisorEmail);

  // Build payload matching Apps Script format
  const payload = {
    sheet_id: organization.google_sheet_id,
    row_number: prospect.rowNumber,
    conseiller_email: advisorEmail,
    data: {
      id: prospect.id,
      date_lead: prospect.createdAt,
      nom: prospect.lastName,
      prenom: prospect.firstName,
      email: prospect.email,
      telephone: prospect.phone,
      source: prospect.source,
      age: prospect.age?.toString(),
      situation_pro: prospect.situationPro,
      revenus: prospect.revenusMensuels?.toString(),
      patrimoine: prospect.patrimoine?.toString(),
      besoins: prospect.besoins,
      notes_appel: prospect.notesAppel,
      statut: sheetStatus,
      date_rdv: prospect.dateRdv,
      rappel_souhaite: prospect.rappelSouhaite,
      qualification: prospect.qualification,
      score: prospect.scoreIa?.toString(),
      priorite: null,
      justification: prospect.justificationIa,
      conseiller_email: advisorEmail,
    },
  };

  try {
    // Call webhook internally (same server)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ultron-murex.vercel.app';
    const response = await fetch(`${baseUrl}${webhookEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('📧 Workflow response:', response.status, result);

    return { endpoint: webhookEndpoint, status: response.status, result };
  } catch (error) {
    console.error('📧 Workflow error:', error);
    return { endpoint: webhookEndpoint, status: 500, error: String(error) };
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { organization, user } = context;
    const body: StageUpdateBody = await request.json();

    // Accept both 'stage' and 'stage_slug' for flexibility
    const stageSlug = body.stage_slug || body.stage;

    if (!stageSlug) {
      return NextResponse.json({ error: 'stage ou stage_slug requis' }, { status: 400 });
    }

    const service = getProspectService(organization);

    // 1. Update the stage
    const prospect = await service.updateStage(id, stageSlug, body.subtype);

    // 2. Determine which advisor's email to use for sending emails
    // Priority: body.assignedTo > prospect.assignedTo > prospect.emailConseiller > user.email
    let advisorEmail = user.email;
    let advisorId = user.id;

    // If assignedTo is provided in request body, use that advisor
    if (body.assignedTo) {
      const assignedAdvisorEmail = await getAdvisorEmail(body.assignedTo, organization.id);
      if (assignedAdvisorEmail) {
        advisorEmail = assignedAdvisorEmail;
        advisorId = body.assignedTo;
        console.log('📧 Using assigned advisor from request:', advisorEmail);
      }
    }
    // If prospect has an assigned advisor, use their email
    else if (prospect.assignedTo) {
      const prospectAdvisorEmail = await getAdvisorEmail(prospect.assignedTo, organization.id);
      if (prospectAdvisorEmail) {
        advisorEmail = prospectAdvisorEmail;
        advisorId = prospect.assignedTo;
        console.log('📧 Using prospect assigned advisor:', advisorEmail);
      }
    }
    // Fallback to emailConseiller field (from Sheet column Z)
    else if (prospect.emailConseiller) {
      advisorEmail = prospect.emailConseiller;
      console.log('📧 Using prospect emailConseiller:', advisorEmail);
    }

    // 3. Trigger workflows based on mode
    let workflowResult: WorkflowResult | null = null;

    if (organization.data_mode === 'sheet') {
      // Sheet mode: call webhook directly (since Apps Script onEdit won't fire)
      workflowResult = await triggerSheetWorkflow(
        stageSlug,
        body.subtype,
        prospect,
        organization,
        advisorEmail
      );
    } else {
      // CRM mode: trigger internal workflow with assigned advisor
      workflowResult = await triggerCrmWorkflow(
        stageSlug,
        body.subtype,
        id,
        organization,
        { id: advisorId, email: advisorEmail }
      );
    }

    return NextResponse.json({
      ...prospect,
      _workflow: workflowResult,
    });
  } catch (error: unknown) {
    console.error('PATCH /api/prospects/unified/[id]/stage error:', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
