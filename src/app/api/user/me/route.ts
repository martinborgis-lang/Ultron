import { NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Retourner les infos de l'utilisateur avec le rôle
    return NextResponse.json({
      user: {
        id: context.user.id,
        email: context.user.email,
        role: context.user.role,
      },
      organization: {
        id: context.organization.id,
        name: context.organization.name,
        data_mode: context.organization.data_mode,
      }
    });

  } catch (error) {
    console.error('Erreur API user/me:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}