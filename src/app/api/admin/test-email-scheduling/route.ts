import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { scheduleRecapEmail, getOrganizationEmailSettings } from '@/lib/services/scheduled-email-service';

/**
 * POST /api/admin/test-email-scheduling
 * Endpoint de test pour programmer un email récap factice
 * Utilisable pour tester le système sans créer un vrai RDV
 */
export async function POST(request: NextRequest) {
  try {
    const userOrg = await getCurrentUserAndOrganization();

    if (!userOrg) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { user, organization } = userOrg;

    // Vérifier les permissions (admin seulement pour les tests)
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { delay_minutes = 1, test_email, prospect_data } = body;

    // Valider l'email de test
    if (!test_email || !test_email.includes('@')) {
      return NextResponse.json(
        { error: 'Email de test requis et valide' },
        { status: 400 }
      );
    }

    // Récupérer les paramètres org
    const orgSettings = await getOrganizationEmailSettings(organization.id);

    if (!orgSettings.email_recap_enabled) {
      return NextResponse.json({
        warning: 'Les emails récap sont désactivés pour cette organisation',
        settings: orgSettings
      });
    }

    // Calculer l'heure d'envoi (dans X minutes pour test rapide)
    const scheduledAt = new Date(Date.now() + delay_minutes * 60 * 1000);

    // Données de test pour le prospect
    const testProspectData = {
      first_name: prospect_data?.first_name || 'Test',
      last_name: prospect_data?.last_name || 'Prospect',
      email: test_email,
      ...prospect_data
    };

    // Programmer l'email de test
    const scheduledEmail = await scheduleRecapEmail({
      organization_id: organization.id,
      prospect_id: null, // Email de test sans prospect réel
      advisor_id: user.id,
      email_type: 'rdv_recap_test',
      scheduled_at: scheduledAt,
      email_data: {
        subject: '[TEST] Récapitulatif de votre rendez-vous',
        body: `Bonjour ${testProspectData.first_name},

Ceci est un email de TEST du système de récapitulatif automatique post-RDV d'Ultron.

✅ Configuration actuelle:
- Délai configuré: ${orgSettings.email_recap_delay_hours}h
- Email programmé pour: ${scheduledAt.toLocaleString('fr-FR')}
- Organisation: ${organization.name}
- Conseiller: ${user.email}

🔧 Informations techniques:
- ID email programmé: ${new Date().getTime()}
- Date de programmation: ${new Date().toISOString()}
- Mode test: emails traités toutes les 15min par le CRON job

Si vous recevez cet email, le système fonctionne parfaitement !

---
Ultron - Assistant IA pour Gestionnaires de Patrimoine
        `,
        prospect_data: testProspectData,
        rdv_data: {
          date_formatted: 'Test - ' + new Date().toLocaleString('fr-FR'),
          qualification: 'TEST',
        },
        test_mode: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Email de test programmé avec succès',
      scheduled_email: {
        id: scheduledEmail.id,
        scheduled_at: scheduledAt.toISOString(),
        delay_minutes,
        test_email,
      },
      organization_settings: orgSettings,
      instructions: `L'email sera envoyé à ${test_email} dans ${delay_minutes} minute(s). Le CRON job vérifie les emails à envoyer toutes les 15 minutes.`
    });

  } catch (error: any) {
    console.error('Erreur test email scheduling:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/test-email-scheduling
 * Récupère le statut des emails de test programmés
 */
export async function GET() {
  try {
    const userOrg = await getCurrentUserAndOrganization();

    if (!userOrg) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { user, organization } = userOrg;

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    // Récupérer les emails de test des dernières 24h
    const { createAdminClient } = await import('@/lib/supabase-admin');
    const adminClient = createAdminClient();

    const { data: testEmails, error } = await adminClient
      .from('email_logs')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('email_type', 'rdv_recap_test')
      .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('sent_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      test_emails: testEmails || [],
      cron_info: {
        frequency: 'Toutes les 15 minutes',
        next_possible_execution: 'Dans 0-15 minutes selon l\'heure de programmation',
        endpoint: '/api/cron/send-scheduled-emails'
      }
    });

  } catch (error: any) {
    console.error('Erreur récupération tests:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}