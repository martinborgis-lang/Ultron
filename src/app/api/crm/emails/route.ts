import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();

    if (!context) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { organization } = context;
    const prospectEmail = request.nextUrl.searchParams.get('prospect_email');

    if (!prospectEmail) {
      return NextResponse.json({ error: 'prospect_email requis' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('prospect_email', prospectEmail)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Error fetching email logs:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('GET /api/crm/emails error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
