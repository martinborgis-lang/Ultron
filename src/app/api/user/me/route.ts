import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/user/me - Get current user info
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, organization_id, gmail_credentials, is_active')
      .eq('auth_id', authUser.id)
      .single();

    if (error || !user) {
      console.error('User not found:', error);
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      organization_id: user.organization_id,
      gmail_connected: !!user.gmail_credentials,
      is_active: user.is_active,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation de l\'utilisateur' },
      { status: 500 }
    );
  }
}
