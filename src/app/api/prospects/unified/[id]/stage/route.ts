import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { CrmProspectService } from '@/lib/services/crm/prospect-service';
import { WaitingSubtype } from '@/types/pipeline';
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

    const service = new CrmProspectService(organization.id);

    // 1. Update the stage
    const prospect = await service.updateStage(id, stageSlug, body.subtype);

    // 2. Determine which advisor's email to use for sending emails
    // Priority: body.assignedTo > prospect.assignedTo > prospect.emailConseiller > user.email
    let advisorEmail = user.email;
    let advisorId = user.id;

    logger.debug('📧 Stage route - body.assignedTo:', body.assignedTo);
    logger.debug('📧 Stage route - prospect.assignedTo:', prospect.assignedTo);
    logger.debug('📧 Stage route - prospect.emailConseiller:', prospect.emailConseiller);
    logger.debug('📧 Stage route - current user:', user.id, user.email);

    // If assignedTo is provided in request body, use that advisor
    if (body.assignedTo) {
      const assignedAdvisorEmail = await getAdvisorEmail(body.assignedTo, organization.id);
      logger.debug('📧 Stage route - Looked up advisor email for', body.assignedTo, ':', assignedAdvisorEmail);
      if (assignedAdvisorEmail) {
        advisorEmail = assignedAdvisorEmail;
        advisorId = body.assignedTo;
        logger.debug('📧 Using assigned advisor from request:', advisorId, advisorEmail);
      }
    }
    // If prospect has an assigned advisor, use their email
    else if (prospect.assignedTo) {
      const prospectAdvisorEmail = await getAdvisorEmail(prospect.assignedTo, organization.id);
      logger.debug('📧 Stage route - Looked up prospect advisor email:', prospectAdvisorEmail);
      if (prospectAdvisorEmail) {
        advisorEmail = prospectAdvisorEmail;
        advisorId = prospect.assignedTo;
        logger.debug('📧 Using prospect assigned advisor:', advisorId, advisorEmail);
      }
    }
    // Fallback to emailConseiller field (from Sheet column Z)
    else if (prospect.emailConseiller) {
      advisorEmail = prospect.emailConseiller;
      logger.debug('📧 Using prospect emailConseiller:', advisorEmail);
    }
    else {
      logger.debug('📧 Using current user as fallback:', advisorId, advisorEmail);
    }

    logger.debug('📧 Stage route - FINAL advisor to use:', advisorId, advisorEmail);

    // 3. Trigger CRM workflow with assigned advisor
    const workflowResult = await triggerCrmWorkflow(
      stageSlug,
      body.subtype,
      id,
      organization,
      { id: advisorId, email: advisorEmail }
    );

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
