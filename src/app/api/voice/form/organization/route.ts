import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';

export async function GET(request: NextRequest) {
  try {
    const result = await getCurrentUserAndOrganization();
    if (!result) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const { user, organization } = result;

    // Générer l'URL webhook sécurisée pour cette organisation
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const webhookUrl = `${baseUrl}/api/voice/ai-agent/webhook`;

    return NextResponse.json({
      id: organization.id,
      name: organization.name,
      webhookUrl: webhookUrl,
      webhookHeaders: {
        'Content-Type': 'application/json',
        'X-Organization-Id': organization.id
      },
      formUrl: `${baseUrl}/voice/form-test`,
      examplePayload: {
        source: 'external_form',
        prospect_data: {
          first_name: 'Jean',
          last_name: 'Dupont',
          email: 'jean.dupont@email.com',
          phone: '+33123456789',
          company: 'SARL Dupont',
          job_title: 'Directeur',
          organization_id: organization.id // Utiliser l'ID au lieu du slug
        },
        utm_params: {
          source: 'website',
          medium: 'form',
          campaign: 'lead_generation'
        },
        metadata: {
          form_version: '1.0',
          submitted_at: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Erreur API organization info:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}