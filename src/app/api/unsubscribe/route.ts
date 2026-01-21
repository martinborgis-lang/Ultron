import { NextRequest, NextResponse } from 'next/server';
import { verifyUnsubscribeToken } from '@/lib/gdpr/unsubscribe-token';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
    }

    const payload = verifyUnsubscribeToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Marquer comme désinscrit
    const { error } = await adminClient
      .from('crm_prospects')
      .update({
        consent_marketing: false,
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('id', payload.prospectId);

    if (error) {
      console.error('[GDPR] Erreur désinscription:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    // Logger pour audit (ignore les erreurs de log)
    try {
      await adminClient.from('crm_activities').insert({
        organization_id: payload.organizationId,
        prospect_id: payload.prospectId,
        type: 'gdpr',
        subject: 'Désinscription',
        content: `Le prospect s'est désinscrit des emails commerciaux via le lien de désinscription.`,
      });
    } catch {
      // Ignore si échec du log
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[GDPR] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}