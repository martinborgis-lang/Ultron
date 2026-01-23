import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { CommissionService, type SaleData } from '@/lib/services/commission-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const saleData: SaleData = await request.json();

    // Validation des données
    if (!saleData.productId || saleData.versementInitial == null || saleData.versementMensuel == null) {
      return NextResponse.json({
        error: 'Données manquantes: productId, versementInitial et versementMensuel requis'
      }, { status: 400 });
    }

    if (saleData.versementInitial < 0 || saleData.versementMensuel < 0) {
      return NextResponse.json({
        error: 'Les montants doivent être positifs'
      }, { status: 400 });
    }

    if (saleData.fraisTaux && (saleData.fraisTaux < 0 || saleData.fraisTaux > 1)) {
      return NextResponse.json({
        error: 'Le taux de frais doit être entre 0 et 1 (0% à 100%)'
      }, { status: 400 });
    }

    const calculation = await CommissionService.calculateCommissions(saleData);

    return NextResponse.json({
      calculation
    });

  } catch (error: any) {
    console.error('Erreur API calculate commissions:', error);
    return NextResponse.json({
      error: error.message || 'Erreur serveur'
    }, { status: 500 });
  }
}