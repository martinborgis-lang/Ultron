import { logger } from '@/lib/logger';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { CrmProspectService } from '@/lib/services/crm/prospect-service';
import PaginationHelper, { COMMON_SORT_FIELDS } from '@/lib/pagination/pagination-helper';
import type { ProspectData } from '@/lib/services/interfaces';

// Transformer pour convertir ProspectData vers le format Unified Frontend
function transformToUnifiedFormat(prospect: ProspectData) {
  return {
    id: prospect.id,
    firstName: prospect.firstName,
    lastName: prospect.lastName,
    email: prospect.email,
    phone: prospect.phone,
    stage: prospect.stage,
    qualification: prospect.qualification,
    scoreIa: prospect.scoreIa,
    dateRdv: prospect.dateRdv,
    patrimoineEstime: prospect.patrimoine, // Mapping patrimoine -> patrimoineEstime
    revenusAnnuels: prospect.revenusMensuels ? prospect.revenusMensuels * 12 : undefined, // Conversion revenusMensuels -> revenusAnnuels
    age: prospect.age,
    createdAt: prospect.createdAt,
  };
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { organization } = context;
    const service = new CrmProspectService(organization.id);

    // ✅ PAGINATION : Parse des paramètres standardisés
    const paginationParams = PaginationHelper.parseParams(request.nextUrl.searchParams);

    // Validation du champ de tri pour la sécurité
    const safeSort = PaginationHelper.validateSortField(
      paginationParams.sort || 'created_at',
      [...COMMON_SORT_FIELDS.PROSPECTS]
    );

    // Paramètres de filtrage existants
    const stage = request.nextUrl.searchParams.get('stage') || undefined;
    const qualification = request.nextUrl.searchParams.get('qualification') || undefined;
    const search = request.nextUrl.searchParams.get('search') || undefined;

    // Récupérer les prospects avec pagination
    const filters = {
      stage,
      qualification,
      search,
      // Ajouter les paramètres de pagination aux filtres
      limit: paginationParams.limit,
      offset: paginationParams.offset,
      sort: safeSort,
      order: paginationParams.order
    };

    const prospects = await service.getAll(filters);

    // ✅ TRANSFORMATION : Convertir au format unified frontend
    let transformedProspects: any[] = [];
    if (Array.isArray(prospects)) {
      transformedProspects = prospects.map(transformToUnifiedFormat);
    }

    // ✅ PAGINATION : Pour le mode CRM, pagination en mémoire pour compatibilité
    if (Array.isArray(prospects)) {
      const paginatedResult = PaginationHelper.paginateInMemory(transformedProspects, paginationParams);

      return NextResponse.json({
        ...paginatedResult,
        meta: {
          dataMode: 'crm',
          filters: { stage, qualification, search }
        }
      });
    }

    // Si le service retourne déjà un format avec total/count (futur)
    // On transforme les données même dans ce cas
    if (prospects && typeof prospects === 'object' && 'data' in prospects && Array.isArray((prospects as any).data)) {
      const prospectsWithData = prospects as { data: ProspectData[]; [key: string]: any };
      return NextResponse.json({
        ...prospectsWithData,
        data: prospectsWithData.data.map(transformToUnifiedFormat)
      });
    }

    return NextResponse.json(transformedProspects);

  } catch (error) {
    logger.error('GET /api/prospects/unified error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      logger.debug('🔧 API unified POST - No auth context');
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { organization, user } = context;
    const body = await request.json();

    logger.debug('🔧 API unified POST - Request received:', {
      organizationId: organization.id,
      organizationName: organization.name,
      dataMode: 'crm',
      userId: user.id,
      body,
    });

    const service = new CrmProspectService(organization.id);
    logger.debug('🔧 API unified POST - Service type: CrmProspectService');

    const prospect = await service.create(body);
    logger.debug('🔧 API unified POST - Prospect created:', prospect);

    return NextResponse.json(prospect, { status: 201 });
  } catch (error: any) {
    logger.error('🔧 API unified POST - Error:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
