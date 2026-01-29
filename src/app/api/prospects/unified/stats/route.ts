import { logger } from '@/lib/logger';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { CrmProspectService } from '@/lib/services/crm/prospect-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const service = new CrmProspectService(context.organization.id);
    const stats = await service.getStats();

    return NextResponse.json(stats);
  } catch (error) {
    logger.error('GET /api/prospects/unified/stats error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
