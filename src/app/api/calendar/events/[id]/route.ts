import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteCalendarEvent } from '@/lib/google-calendar';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer le user
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, gmail_credentials')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Récupérer les credentials de l'organisation si pas de gmail_credentials
    let credentials = userData.gmail_credentials;

    if (!credentials && userData.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('google_credentials')
        .eq('id', userData.organization_id)
        .single();

      credentials = org?.google_credentials;
    }

    if (!credentials) {
      return NextResponse.json({ error: 'Google non connecté' }, { status: 400 });
    }

    await deleteCalendarEvent(credentials, id);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Erreur suppression événement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
