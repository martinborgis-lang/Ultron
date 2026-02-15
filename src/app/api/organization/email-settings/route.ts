import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { updateOrganizationEmailSettings, getOrganizationEmailSettings } from '@/lib/services/scheduled-email-service';

/**
 * GET /api/organization/email-settings
 * Récupère les paramètres email de l'organisation
 */
export async function GET() {
  try {
    const { organization } = await getCurrentUserAndOrganization();

    const settings = await getOrganizationEmailSettings(organization.id);

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Erreur récupération paramètres email org:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/organization/email-settings
 * Met à jour les paramètres email de l'organisation
 */
export async function PATCH(request: NextRequest) {
  try {
    const { organization } = await getCurrentUserAndOrganization();
    const body = await request.json();

    // Validation des données
    const validatedSettings: any = {};

    if (typeof body.email_recap_enabled === 'boolean') {
      validatedSettings.email_recap_enabled = body.email_recap_enabled;
    }

    if (typeof body.email_recap_delay_hours === 'number') {
      if (body.email_recap_delay_hours < 1 || body.email_recap_delay_hours > 168) {
        return NextResponse.json(
          { error: 'Le délai doit être entre 1h et 168h (7 jours)' },
          { status: 400 }
        );
      }
      validatedSettings.email_recap_delay_hours = body.email_recap_delay_hours;
    }

    if (Object.keys(validatedSettings).length === 0) {
      return NextResponse.json(
        { error: 'Aucun paramètre valide fourni' },
        { status: 400 }
      );
    }

    // Mettre à jour en base
    await updateOrganizationEmailSettings(organization.id, validatedSettings);

    // Retourner les nouveaux paramètres
    const updatedSettings = await getOrganizationEmailSettings(organization.id);

    return NextResponse.json({
      message: 'Paramètres email mis à jour avec succès',
      settings: updatedSettings
    });

  } catch (error: any) {
    console.error('Erreur mise à jour paramètres email org:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}