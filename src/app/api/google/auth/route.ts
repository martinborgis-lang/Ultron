import { createClient } from '@/lib/supabase/server';
import { generateAuthUrl } from '@/lib/google';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL));
    }

    const { data: user } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_id', authUser.id)
      .single();

    if (!user?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const state = Buffer.from(
      JSON.stringify({ organization_id: user.organization_id })
    ).toString('base64');

    const authUrl = generateAuthUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google auth' },
      { status: 500 }
    );
  }
}
