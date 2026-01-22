import { logger } from '@/lib/logger';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase-admin';
import {
  getValidCredentials,
  updateGoogleSheetCells,
  GoogleCredentials,
} from '@/lib/google';
import { mapStageToSheetStatus, WaitingSubtype } from '@/types/pipeline';

export const dynamic = 'force-dynamic';

interface UpdateStatusBody {
  row_number: number;
  stage_slug: string;
  subtype?: WaitingSubtype;
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Get user's organization
    const adminClient = createAdminClient();
    const { data: user } = await adminClient
      .from('users')
      .select('organization_id')
      .eq('auth_id', authUser.id)
      .single();

    if (!user?.organization_id) {
      return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 404 });
    }

    // Get organization with credentials
    const { data: org } = await adminClient
      .from('organizations')
      .select('id, data_mode, google_credentials, google_sheet_id')
      .eq('id', user.organization_id)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 404 });
    }

    // Verify Sheet mode
    if (org.data_mode !== 'sheet') {
      return NextResponse.json(
        { error: 'Cette API est uniquement disponible en mode Sheet' },
        { status: 400 }
      );
    }

    // Check Google credentials
    if (!org.google_credentials) {
      return NextResponse.json(
        { error: 'Google non connecté', connected: false },
        { status: 400 }
      );
    }

    if (!org.google_sheet_id) {
      return NextResponse.json(
        { error: 'Aucun ID de Google Sheet configuré', configured: false },
        { status: 400 }
      );
    }

    // Parse request body
    const body: UpdateStatusBody = await request.json();
    const { row_number, stage_slug, subtype } = body;

    if (!row_number || row_number < 2) {
      return NextResponse.json(
        { error: 'row_number invalide (doit être >= 2)' },
        { status: 400 }
      );
    }

    if (!stage_slug) {
      return NextResponse.json({ error: 'stage_slug requis' }, { status: 400 });
    }

    // Get valid credentials (refresh if needed)
    const credentials = await getValidCredentials(org.google_credentials as GoogleCredentials);

    // Compare access_token to detect if credentials were refreshed
    const originalCredentials = org.google_credentials as GoogleCredentials;
    if (credentials.access_token !== originalCredentials.access_token) {
      logger.debug('🔄 Google credentials refreshed, saving new tokens');
      await adminClient
        .from('organizations')
        .update({ google_credentials: credentials })
        .eq('id', org.id);
    }

    // Convert stage to Sheet status
    const newStatus = mapStageToSheetStatus(stage_slug, subtype);

    // Prepare updates
    const updates: { range: string; value: string }[] = [
      { range: `N${row_number}`, value: newStatus },
    ];

    // If "en_attente" with "rappel_differe", also set column P = "Oui"
    // This triggers Apps Script to generate the Calendar link
    if (stage_slug === 'en_attente' && subtype === 'rappel_differe') {
      updates.push({ range: `P${row_number}`, value: 'Oui' });
    }

    // Update the Sheet
    await updateGoogleSheetCells(credentials, org.google_sheet_id, updates);

    return NextResponse.json({
      success: true,
      newStatus,
      updatedCells: updates.map((u) => u.range),
    });
  } catch (error) {
    console.error('Error updating Sheet status:', error);

    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

    if (errorMessage.includes('invalid_grant') || errorMessage.includes('Token has been expired')) {
      return NextResponse.json(
        { error: 'Session Google expirée', needsReconnect: true },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}
