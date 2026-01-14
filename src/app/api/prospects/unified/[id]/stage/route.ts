import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { getProspectService } from '@/lib/services/factories/prospect-factory';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { stage } = await request.json();

    if (!stage) {
      return NextResponse.json({ error: 'Stage requis' }, { status: 400 });
    }

    const service = getProspectService(context.organization);
    const prospect = await service.updateStage(id, stage);

    return NextResponse.json(prospect);
  } catch (error: any) {
    console.error('PATCH /api/prospects/unified/[id]/stage error:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
