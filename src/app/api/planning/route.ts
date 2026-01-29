import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { CrmPlanningService } from '@/lib/services/crm/planning-service';
import { PlanningFilters } from '@/lib/services/interfaces';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { user, organization } = context;
    const service = new CrmPlanningService(organization.id, user.id);

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

    // Mode CRM uniquement - création de tâches disponible

    const service = new CrmPlanningService(organization.id, user.id);
    const body = await request.json();

    // Cast to any to allow additional properties for Google Meet
    const eventData: any = {
      type: body.type || 'task',
      title: body.title,
      description: body.description,
      startDate: body.start_date || body.startDate,
      endDate: body.end_date || body.endDate,
      dueDate: body.due_date || body.dueDate,
      allDay: body.all_day || body.allDay || false,
      priority: body.priority || 'medium',
      prospectId: body.prospect_id || body.prospectId,
      addGoogleMeet: body.addGoogleMeet || body.add_google_meet || false,
      attendeeEmail: body.attendeeEmail || body.attendee_email,
      meetLink: body.meet_link || body.meetLink,
    };

    const event = await service.create(eventData);

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('POST /api/planning error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
