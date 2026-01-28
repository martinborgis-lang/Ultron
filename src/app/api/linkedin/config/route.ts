import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('auth_id', user.id)
    .single();

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 400 });
  }

  const { data: config } = await supabase
    .from('linkedin_config')
    .select('*')
    .eq('organization_id', userData.organization_id)
    .single();

  return NextResponse.json({ config: config || {} });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('auth_id', user.id)
    .single();

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 400 });
  }

  const body = await request.json();

  // Validation des données
  if (!body.cabinet_name?.trim()) {
    return NextResponse.json({ error: 'Le nom du cabinet est obligatoire' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('linkedin_config')
    .upsert({
      organization_id: userData.organization_id,
      cabinet_name: body.cabinet_name?.trim(),
      cabinet_description: body.cabinet_description?.trim() || null,
      cabinet_specialties: body.cabinet_specialties || [],
      cabinet_values: body.cabinet_values?.trim() || null,
      cabinet_differentiators: body.cabinet_differentiators?.trim() || null,
      years_experience: body.years_experience || null,
      clients_count: body.clients_count || null,
      average_return: body.average_return || null,
      assets_under_management: body.assets_under_management || null,
      website_url: body.website_url?.trim() || null,
      booking_url: body.booking_url?.trim() || null,
      phone: body.phone?.trim() || null,
      tone: body.tone || 'professionnel',
      target_audience: body.target_audience?.trim() || null,
      topics_to_avoid: body.topics_to_avoid?.trim() || null,
      preferred_hashtags: body.preferred_hashtags || [],
      brochure_url: body.brochure_url?.trim() || null,
      brochure_text: body.brochure_text?.trim() || null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'organization_id',
    })
    .select()
    .single();

  if (error) {
    console.error('[LinkedIn Config] Error:', error);
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
  }

  return NextResponse.json({ config: data });
}