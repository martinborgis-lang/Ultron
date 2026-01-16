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

    const { organization } = context;
    const service = getProspectService(organization);

    const stage = request.nextUrl.searchParams.get('stage') || undefined;
    const qualification = request.nextUrl.searchParams.get('qualification') || undefined;
    const search = request.nextUrl.searchParams.get('search') || undefined;

    const prospects = await service.getAll({ stage, qualification, search });

    return NextResponse.json(prospects);
  } catch (error) {
    console.error('GET /api/prospects/unified error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      console.log('🔧 API unified POST - No auth context');
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { organization, user } = context;
    const body = await request.json();

    console.log('🔧 API unified POST - Request received:', {
      organizationId: organization.id,
      organizationName: organization.name,
      dataMode: organization.data_mode,
      userId: user.id,
      body,
    });

    const service = getProspectService(organization);
    console.log('🔧 API unified POST - Service type:', organization.data_mode === 'sheet' ? 'SheetProspectService' : 'CrmProspectService');

    const prospect = await service.create(body);
    console.log('🔧 API unified POST - Prospect created:', prospect);

    return NextResponse.json(prospect, { status: 201 });
  } catch (error: any) {
    console.error('🔧 API unified POST - Error:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
