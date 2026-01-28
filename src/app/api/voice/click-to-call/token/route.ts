import { NextRequest, NextResponse } from 'next/server';
import { TwilioService } from '@/lib/services/twilio-service';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';

export async function GET(request: NextRequest) {
  try {
    const { user, organization } = await getCurrentUserAndOrganization();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Génération d'un token Twilio pour l'utilisateur
    const token = TwilioService.generateToken({
      identity: `${organization.id}-${user.id}`,
      clientName: `ultron-${user.id}`,
      allowIncoming: true,
      allowOutgoing: true
    });

    return NextResponse.json({
      token,
      identity: `${organization.id}-${user.id}`,
      organization: organization.name,
      userName: user.full_name || user.email
    });

  } catch (error) {
    console.error('Erreur génération token Twilio:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du token' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, organization } = await getCurrentUserAndOrganization();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { refreshToken = false } = body;

    if (refreshToken) {
      // Génération d'un nouveau token
      const token = TwilioService.generateToken({
        identity: `${organization.id}-${user.id}`,
        clientName: `ultron-${user.id}`,
        allowIncoming: true,
        allowOutgoing: true
      });

      return NextResponse.json({
        token,
        identity: `${organization.id}-${user.id}`,
        refreshedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ error: 'Action non valide' }, { status: 400 });

  } catch (error) {
    console.error('Erreur refresh token Twilio:', error);
    return NextResponse.json(
      { error: 'Erreur lors du rafraîchissement du token' },
      { status: 500 }
    );
  }
}