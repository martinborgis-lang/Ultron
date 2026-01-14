import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { getPlanningService } from '@/lib/services/factories/planning-factory';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { user, organization } = context;
    const service = getPlanningService(organization, user.id);

    const event = await service.getById(id);

    if (!event) {
      return NextResponse.json({ error: 'Evenement non trouve' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('GET /api/planning/[id] error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
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
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { user, organization } = context;
    const service = getPlanningService(organization, user.id);
    const body = await request.json();

    const event = await service.update(id, {
      title: body.title,
      description: body.description,
      type: body.type,
      startDate: body.startDate || body.start_date,
      endDate: body.endDate || body.end_date,
      dueDate: body.dueDate || body.due_date,
      allDay: body.allDay || body.all_day,
      priority: body.priority,
      status: body.status,
      completedAt: body.completedAt || body.completed_at,
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('PATCH /api/planning/[id] error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { user, organization } = context;
    const service = getPlanningService(organization, user.id);

    await service.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/planning/[id] error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
