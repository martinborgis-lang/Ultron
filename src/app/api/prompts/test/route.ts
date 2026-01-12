import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

interface PromptConfig {
  useAI: boolean;
  systemPrompt: string;
  userPromptTemplate: string;
  fixedEmailSubject: string;
  fixedEmailBody: string;
}

interface TestData {
  prenom?: string;
  nom?: string;
  email?: string;
  qualification?: string;
  besoins?: string;
  notes_appel?: string;
  date_rdv?: string;
}

function replaceVariables(
  template: string,
  data: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { config, testData } = body as {
      type: string;
      config: PromptConfig;
      testData: TestData;
    };

    // Préparer les données pour le remplacement des variables
    const variables: Record<string, string> = {
      prenom: testData.prenom || '',
      nom: testData.nom || '',
      email: testData.email || '',
      qualification: testData.qualification || '',
      besoins: testData.besoins || '',
      notes_appel: testData.notes_appel || '',
      date_rdv: testData.date_rdv || '',
    };

    // Si email fixe, juste remplacer les variables
    if (!config.useAI) {
      const result = {
        objet: replaceVariables(config.fixedEmailSubject, variables),
        corps: replaceVariables(config.fixedEmailBody, variables),
      };
      return NextResponse.json({ result });
    }

    // Si IA, générer avec Claude
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const userPrompt = replaceVariables(config.userPromptTemplate, variables);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: config.systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return NextResponse.json(
        { error: "Réponse inattendue de l'IA" },
        { status: 500 }
      );
    }

    // Parser le JSON
    try {
      const result = JSON.parse(content.text);
      return NextResponse.json({ result });
    } catch {
      return NextResponse.json({
        result: { raw: content.text },
        warning: "La réponse n'est pas au format JSON attendu",
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
