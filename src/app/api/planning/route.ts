import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { getPlanningService } from '@/lib/services/factories/planning-factory';
import { PlanningFilters } from '@/lib/services/interfaces';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { user, organization } = context;
    const service = getPlanningService(organization, user.id);

    const filter = request.nextUrl.searchParams.get('filter') || 'all';
    const prospectId = request.nextUrl.searchParams.get('prospectId');

    const events = await service.getAll({
      filter: filter as PlanningFilters['filter'],
      prospectId: prospectId || undefined,
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('GET /api/planning error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { user, organization } = context;

    // Verifier que le mode CRM est actif pour la creation
    if (organization.data_mode === 'sheet') {
      return NextResponse.json(
        {
          error:
            "La creation de taches n'est pas disponible en mode Google Sheet. Les taches sont gerees via Google Calendar.",
        },
        { status: 400 }
      );
    }

    const service = getPlanningService(organization, user.id);
    const body = await request.json();

    const event = await service.create({
      type: body.type || 'task',
      title: body.title,
      description: body.description,
      startDate: body.start_date || body.startDate,
      endDate: body.end_date || body.endDate,
      dueDate: body.due_date || body.dueDate,
      allDay: body.all_day || body.allDay || false,
      priority: body.priority || 'medium',
      prospectId: body.prospect_id || body.prospectId,
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('POST /api/planning error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
