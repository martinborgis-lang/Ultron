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

    const body = await request.json();
    const { prospectId, saleData } = body;

    // Validation des données de vente
    if (!prospectId || !saleData) {
      return NextResponse.json({
        error: 'Données manquantes: prospectId et saleData requis'
      }, { status: 400 });
    }

    const { productId, versementInitial, versementMensuel, fraisTaux, fraisSur } = saleData;

    if (!productId || versementInitial == null || versementMensuel == null) {
      return NextResponse.json({
        error: 'Données de vente incomplètes: productId, versementInitial et versementMensuel requis'
      }, { status: 400 });
    }

    if (versementInitial < 0 || versementMensuel < 0) {
      return NextResponse.json({
        error: 'Les montants doivent être positifs'
      }, { status: 400 });
    }

    if (fraisTaux && (fraisTaux < 0 || fraisTaux > 1)) {
      return NextResponse.json({
        error: 'Le taux de frais doit être entre 0 et 1 (0% à 100%)'
      }, { status: 400 });
    }

    // Enregistrer la vente avec calcul automatique des commissions
    const result = await CommissionService.recordSale(prospectId, saleData);

    return NextResponse.json({
      message: 'Vente enregistrée avec succès',
      prospect: result.prospect,
      commissions: result.commissions
    });

  } catch (error: any) {
    console.error('Erreur API record sale:', error);
    return NextResponse.json({
      error: error.message || 'Erreur serveur'
    }, { status: 500 });
  }
}