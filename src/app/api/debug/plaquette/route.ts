import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateEmailWithConfig, DEFAULT_PROMPTS, PromptConfig } from '@/lib/anthropic';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Get all organizations and check their prompt configuration
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select('id, name, google_sheet_id, prompt_plaquette, plaquette_url');

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
    }

    // Debug info for each organization
    const debugInfo: any[] = [];

    for (const org of organizations || []) {
      const orgInfo: any = {
        id: org.id,
        name: org.name,
        google_sheet_id: org.google_sheet_id,
        has_plaquette_url: !!org.plaquette_url,
        has_prompt_plaquette: !!org.prompt_plaquette,
        prompt_config: org.prompt_plaquette,
      };

      // Test email generation for this org
      try {
        const testProspect = {
          prenom: 'Jean',
          nom: 'Test',
          email: 'jean.test@example.com',
          besoins: 'Optimisation fiscale et préparation retraite',
        };

        const promptConfig = org.prompt_plaquette as PromptConfig | null;

        const email = await generateEmailWithConfig(
          promptConfig,
          DEFAULT_PROMPTS.plaquette,
          testProspect
        );

        orgInfo.test_email = {
          success: true,
          subject: email.objet,
          body_preview: email.corps.substring(0, 100) + '...',
        };
      } catch (emailError) {
        orgInfo.test_email = {
          success: false,
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
        };
      }

      debugInfo.push(orgInfo);
    }

    return NextResponse.json({
      success: true,
      organizations_count: organizations?.length || 0,
      debug_info: debugInfo,
    });

  } catch (error) {
    logger.error('Debug plaquette error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organization_id, prospect_data } = await request.json();

    if (!organization_id || !prospect_data) {
      return NextResponse.json(
        { error: 'Missing organization_id or prospect_data' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, prompt_plaquette, plaquette_url')
      .eq('id', organization_id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    logger.info(`[DEBUG] Testing plaquette email generation for org: ${org.name}`);
    logger.info(`[DEBUG] Has prompt_plaquette:`, !!org.prompt_plaquette);
    logger.info(`[DEBUG] Has plaquette_url:`, !!org.plaquette_url);
    logger.info(`[DEBUG] Prospect data:`, prospect_data);

    // Test email generation
    const promptConfig = org.prompt_plaquette as PromptConfig | null;

    logger.info(`[DEBUG] Using promptConfig:`, promptConfig);
    logger.info(`[DEBUG] Using DEFAULT_PROMPTS.plaquette:`, DEFAULT_PROMPTS.plaquette.substring(0, 200));

    const email = await generateEmailWithConfig(
      promptConfig,
      DEFAULT_PROMPTS.plaquette,
      {
        prenom: prospect_data.prenom,
        nom: prospect_data.nom,
        email: prospect_data.email,
        besoins: prospect_data.besoins,
      }
    );

    logger.info(`[DEBUG] Generated email:`, {
      subject: email.objet,
      body_length: email.corps?.length || 0,
      body_preview: email.corps?.substring(0, 200) || 'No body'
    });

    return NextResponse.json({
      success: true,
      organization: {
        id: org.id,
        name: org.name,
        has_prompt_plaquette: !!org.prompt_plaquette,
        has_plaquette_url: !!org.plaquette_url,
      },
      generated_email: {
        subject: email.objet,
        body: email.corps,
        body_length: email.corps?.length || 0,
      },
      prompt_config_used: promptConfig,
      default_prompt_used: !promptConfig || promptConfig.useAI,
    });

  } catch (error) {
    logger.error('Debug plaquette test error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}