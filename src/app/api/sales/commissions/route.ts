import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { CommissionService } from '@/lib/services/commission-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const stats = await CommissionService.getCommissionStats(
      context.organization.id,
      startDate || undefined,
      endDate || undefined
    );

    return NextResponse.json(stats);

  } catch (error: any) {
    console.error('Erreur API commission stats:', error);
    return NextResponse.json({
      error: error.message || 'Erreur serveur'
    }, { status: 500 });
  }
}