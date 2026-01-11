import { createClient } from '@/lib/supabase/server';
import { generateAuthUrl, OAuthType } from '@/lib/google';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'organization') as OAuthType;

    if (!['organization', 'gmail'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL));
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('auth_id', authUser.id)
      .single();

    if (!user?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // State includes type to know where to store credentials on callback
    const state = Buffer.from(
      JSON.stringify({
        organization_id: user.organization_id,
        user_id: user.id,
        type,
      })
    ).toString('base64');

    const authUrl = generateAuthUrl(state, type);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google auth' },
      { status: 500 }
    );
  }
}
