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

  const { data: posts, error } = await supabase
    .from('linkedin_posts')
    .select('*')
    .eq('organization_id', userData.organization_id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[LinkedIn Posts] Error:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des posts' }, { status: 500 });
  }

  return NextResponse.json({ posts: posts || [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id, id')
    .eq('auth_id', user.id)
    .single();

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 400 });
  }

  const body = await request.json();

  // Validation des données
  if (!body.content?.trim()) {
    return NextResponse.json({ error: 'Le contenu du post est obligatoire' }, { status: 400 });
  }

  const { data: post, error } = await supabase
    .from('linkedin_posts')
    .insert({
      organization_id: userData.organization_id,
      user_id: userData.id,
      content: body.content.trim(),
      hook: body.hook?.trim() || null,
      topic: body.topic?.trim() || null,
      news_source: body.news_source?.trim() || null,
      suggested_image_url: body.suggested_image_url?.trim() || null,
      suggested_image_description: body.suggested_image_description?.trim() || null,
      status: body.status || 'draft',
    })
    .select()
    .single();

  if (error) {
    console.error('[LinkedIn Posts] Insert error:', error);
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde du post' }, { status: 500 });
  }

  return NextResponse.json({ post });
}