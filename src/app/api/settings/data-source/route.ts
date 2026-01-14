import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Recuperer l'organization de l'user
    const { data: userData } = await adminClient
      .from('users')
      .select('organization_id')
      .eq('auth_id', user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: "Pas d'organisation" }, { status: 400 });
    }

    // Recuperer les settings de l'organisation
    const { data: org, error } = await adminClient
      .from('organizations')
      .select('data_mode, google_sheet_id')
      .eq('id', userData.organization_id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      data_mode: org?.data_mode || 'crm',
      google_sheet_id: org?.google_sheet_id || '',
    });
  } catch (error) {
    console.error('GET /api/settings/data-source error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Recuperer l'organization de l'user
    const { data: userData } = await adminClient
      .from('users')
      .select('organization_id')
      .eq('auth_id', user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: "Pas d'organisation" }, { status: 400 });
    }

    const body = await request.json();

    // Valider le mode
    if (!['sheet', 'crm'].includes(body.data_mode)) {
      return NextResponse.json({ error: 'Mode invalide' }, { status: 400 });
    }

    // Mettre a jour l'organisation
    const { error } = await adminClient
      .from('organizations')
      .update({
        data_mode: body.data_mode,
        google_sheet_id: body.google_sheet_id,
      })
      .eq('id', userData.organization_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/settings/data-source error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
