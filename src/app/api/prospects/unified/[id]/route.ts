import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { getProspectService } from '@/lib/services/factories/prospect-factory';

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

    const service = getProspectService(context.organization);
    const prospect = await service.getById(id);

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect non trouve' }, { status: 404 });
    }

    return NextResponse.json(prospect);
  } catch (error) {
    console.error('GET /api/prospects/unified/[id] error:', error);
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

    const service = getProspectService(context.organization);
    const body = await request.json();

    const prospect = await service.update(id, body);
    return NextResponse.json(prospect);
  } catch (error: any) {
    console.error('PATCH /api/prospects/unified/[id] error:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
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

    const service = getProspectService(context.organization);
    await service.delete(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/prospects/unified/[id] error:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
