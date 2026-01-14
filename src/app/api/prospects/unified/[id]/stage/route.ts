import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { getProspectService } from '@/lib/services/factories/prospect-factory';
import type { WaitingSubtype } from '@/types/pipeline';

export const dynamic = 'force-dynamic';

interface StageUpdateBody {
  stage?: string;
  stage_slug?: string;
  subtype?: WaitingSubtype;
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

    const body: StageUpdateBody = await request.json();

    // Accept both 'stage' and 'stage_slug' for flexibility
    const stageSlug = body.stage_slug || body.stage;

    if (!stageSlug) {
      return NextResponse.json({ error: 'stage ou stage_slug requis' }, { status: 400 });
    }

    const service = getProspectService(context.organization);
    const prospect = await service.updateStage(id, stageSlug, body.subtype);

    return NextResponse.json(prospect);
  } catch (error: unknown) {
    console.error('PATCH /api/prospects/unified/[id]/stage error:', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
