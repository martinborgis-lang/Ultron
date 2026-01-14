import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { getProspectService } from '@/lib/services/factories/prospect-factory';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const service = getProspectService(context.organization);
    const stats = await service.getStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('GET /api/prospects/unified/stats error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
