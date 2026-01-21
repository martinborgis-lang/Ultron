import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { AdminStatsService } from '@/lib/services/admin/admin-stats-service';
import { errorResponse, unauthorized, forbidden } from '@/lib/errors';
import type { AdminFilters } from '@/types/crm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return unauthorized();
    }

    if (context.user.role !== 'admin') {
      return forbidden();
    }

    const { searchParams } = new URL(request.url);
    const filters: AdminFilters = {
      period: (searchParams.get('period') || '30d') as AdminFilters['period'],
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      compare_with_previous: searchParams.get('compare_with_previous') === 'true',
      advisor_ids: searchParams.get('advisor_ids')?.split(',').filter(Boolean) || undefined
    };

    const statsService = new AdminStatsService(context.organization.id);
    const stats = await statsService.getFullStats(filters);

    return NextResponse.json(stats);

  } catch (error) {
    return errorResponse(error);
  }
}