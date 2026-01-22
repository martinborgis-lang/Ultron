import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { createAdminClient } from '@/lib/supabase-admin';
import { getEmailCredentialsByEmail } from '@/lib/gmail';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const memberId = params.id;
    const adminClient = createAdminClient();

    // Vérifier que l'utilisateur peut tester cette connexion
    // (soit c'est lui-même, soit il est admin)
    const { data: targetMember } = await adminClient
      .from('users')
      .select('id, email, organization_id')
      .eq('id', memberId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 });
    }

    // Vérifier les permissions
    const canTest = (
      targetMember.id === context.user.id || // C'est l'utilisateur lui-même
      (context.user.role === 'admin' && targetMember.organization_id === context.organization.id) // Admin de la même org
    );

    if (!canTest) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Tester la connexion Gmail
    logger.info(`Test connexion Gmail pour membre ${memberId} (${targetMember.email})`);

    try {
      const credentialsResponse = await getEmailCredentialsByEmail(
        context.organization.id,
        targetMember.email
      );

      if (!credentialsResponse.result) {
        return NextResponse.json({
          success: false,
          error: 'Gmail non configuré',
          details: credentialsResponse.error?.message || 'Aucune configuration Gmail trouvée',
          status: 'not_configured'
        });
      }

      // Test simple : essayer de récupérer le profil Gmail
      const { credentials } = credentialsResponse.result;

      const testResponse = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
        },
      });

      if (testResponse.status === 401) {
        // Token expiré ou invalide
        return NextResponse.json({
          success: false,
          error: 'Token Gmail expiré',
          details: 'Les credentials Gmail ont expiré et doivent être renouvelés',
          status: 'expired'
        });
      }

      if (!testResponse.ok) {
        return NextResponse.json({
          success: false,
          error: 'Erreur Gmail API',
          details: `Erreur ${testResponse.status}: ${testResponse.statusText}`,
          status: 'api_error'
        });
      }

      const profile = await testResponse.json();

      return NextResponse.json({
        success: true,
        message: 'Connexion Gmail OK',
        details: {
          email: profile.emailAddress,
          messagesTotal: profile.messagesTotal || 0,
          threadsTotal: profile.threadsTotal || 0
        },
        status: 'connected'
      });

    } catch (testError) {
      logger.error('Erreur test Gmail:', testError);

      return NextResponse.json({
        success: false,
        error: 'Erreur lors du test',
        details: testError instanceof Error ? testError.message : 'Erreur inconnue',
        status: 'error'
      });
    }

  } catch (error) {
    logger.error('Erreur API test Gmail:', error);
    return NextResponse.json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}