import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: organizations, error } = await supabase
      .from('organizations')
      .select('id, name, google_sheet_id, prompt_plaquette, plaquette_url');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const report = organizations?.map(org => ({
      id: org.id,
      name: org.name,
      google_sheet_id: org.google_sheet_id,
      has_prompt_plaquette: !!org.prompt_plaquette,
      has_plaquette_url: !!org.plaquette_url,
      prompt_config_type: org.prompt_plaquette ?
        (typeof org.prompt_plaquette === 'object' ?
          (org.prompt_plaquette as any)?.useAI ? 'AI_MODE' : 'FIXED_MODE'
          : 'LEGACY'
        ) : 'MISSING'
    }));

    const summary = {
      total_orgs: organizations?.length || 0,
      orgs_with_prompts: report?.filter(r => r.has_prompt_plaquette).length || 0,
      orgs_without_prompts: report?.filter(r => !r.has_prompt_plaquette).length || 0,
      orgs_with_plaquette_url: report?.filter(r => r.has_plaquette_url).length || 0,
    };

    return NextResponse.json({
      summary,
      organizations: report,
    });

  } catch (error) {
    console.error('Check prompts error:', error);
    return NextResponse.json({
      error: 'Failed to check prompts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}