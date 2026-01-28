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
    .select('organization_id, role')
    .eq('auth_id', user.id)
    .single();

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 400 });
  }

  // Seuls les admins peuvent accéder à la configuration voice
  if (userData.role !== 'admin') {
    return NextResponse.json({ error: 'Accès non autorisé - Admin requis' }, { status: 403 });
  }

  const { data: config, error } = await supabase
    .from('voice_config')
    .select('*')
    .eq('organization_id', userData.organization_id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[Voice Config] Error:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement de la configuration' }, { status: 500 });
  }

  return NextResponse.json({ config: config || null });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('auth_id', user.id)
    .single();

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 400 });
  }

  if (userData.role !== 'admin') {
    return NextResponse.json({ error: 'Accès non autorisé - Admin requis' }, { status: 403 });
  }

  const body = await request.json();

  // Validation des données requises
  if (!body.vapi_api_key?.trim()) {
    return NextResponse.json({ error: 'La clé API Vapi est obligatoire' }, { status: 400 });
  }

  // Upsert de la configuration
  const { data: config, error } = await supabase
    .from('voice_config')
    .upsert({
      organization_id: userData.organization_id,
      vapi_api_key: body.vapi_api_key.trim(),
      vapi_phone_number: body.vapi_phone_number?.trim() || null,
      vapi_assistant_id: body.vapi_assistant_id?.trim() || null,
      agent_name: body.agent_name?.trim() || 'Assistant Ultron',
      agent_voice: body.agent_voice || 'jennifer',
      agent_language: body.agent_language || 'fr-FR',
      working_hours_start: body.working_hours_start || '09:00',
      working_hours_end: body.working_hours_end || '18:00',
      working_days: body.working_days || [1, 2, 3, 4, 5],
      timezone: body.timezone || 'Europe/Paris',
      system_prompt: body.system_prompt?.trim() || null,
      qualification_questions: body.qualification_questions || null,
      max_call_duration_seconds: body.max_call_duration_seconds || 300,
      retry_on_no_answer: body.retry_on_no_answer ?? true,
      max_retry_attempts: body.max_retry_attempts || 2,
      delay_between_retries_minutes: body.delay_between_retries_minutes || 60,
      webhook_url: body.webhook_url?.trim() || null,
      webhook_secret: body.webhook_secret?.trim() || null,
      is_enabled: body.is_enabled ?? false,
    })
    .select()
    .single();

  if (error) {
    console.error('[Voice Config] Upsert error:', error);
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde de la configuration' }, { status: 500 });
  }

  return NextResponse.json({ config });
}