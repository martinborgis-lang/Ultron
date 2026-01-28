import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

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

  // Récupérer la configuration du cabinet
  const { data: config } = await supabase
    .from('linkedin_config')
    .select('*')
    .eq('organization_id', userData.organization_id)
    .single();

  if (!config?.cabinet_name) {
    return NextResponse.json({ error: 'Veuillez d\'abord configurer votre cabinet' }, { status: 400 });
  }

  // Récupérer les posts précédents pour éviter les répétitions
  const { data: previousPosts } = await supabase
    .from('linkedin_posts')
    .select('content, topic, hook, created_at')
    .eq('organization_id', userData.organization_id)
    .order('created_at', { ascending: false })
    .limit(10);

  const body = await request.json();
  const { theme, customTopic } = body;

  try {
    // Construire le prompt pour l'agent
    const systemPrompt = buildSystemPrompt(config, previousPosts || []);
    const userPrompt = buildUserPrompt(theme, customTopic, config);

    console.log('[LinkedIn Generate] Generating post for:', config.cabinet_name);

    // Appeler Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    });

    // Extraire le contenu généré
    const generatedContent = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Parser la réponse (on attend un JSON)
    let postData;
    try {
      // Chercher le JSON dans la réponse
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        postData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      // Si pas de JSON, utiliser le contenu brut
      postData = {
        content: generatedContent,
        hook: generatedContent.split('\n')[0],
        topic: theme === 'custom' ? customTopic : theme,
        news_source: null,
        suggested_image_description: null,
      };
    }

    // Sauvegarder le post
    const { data: savedPost, error: saveError } = await supabase
      .from('linkedin_posts')
      .insert({
        organization_id: userData.organization_id,
        user_id: userData.id,
        content: postData.content,
        hook: postData.hook,
        topic: postData.topic,
        news_source: postData.news_source,
        suggested_image_url: postData.suggested_image_url,
        suggested_image_description: postData.suggested_image_description,
        status: 'draft',
      })
      .select()
      .single();

    if (saveError) {
      console.error('[LinkedIn Generate] Save error:', saveError);
    }

    return NextResponse.json({
      post: savedPost || postData,
      success: true,
    });

  } catch (error: any) {
    console.error('[LinkedIn Generate] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function buildSystemPrompt(config: any, previousPosts: any[]): string {
  return `Tu es un expert en communication LinkedIn pour les Conseillers en Gestion de Patrimoine (CGP).
Tu génères des posts LinkedIn professionnels, engageants et à forte valeur ajoutée.

# RÈGLES ABSOLUES

1. **ÉQUILIBRE CONTENU** : Le post doit être un mix subtil entre :
   - 70% de valeur informationnelle (actualité, conseil, pédagogie)
   - 30% de lien avec le cabinet (mais jamais de promotion agressive)
   - JAMAIS de liste de services, JAMAIS de "nous proposons X, Y, Z"
   - Le cabinet doit être mentionné naturellement, comme une solution possible, pas comme une pub

2. **TON ET STYLE** :
   - Accroche percutante en première ligne (emoji + phrase choc ou question)
   - Court et impactant (max 1300 caractères, idéalement 800-1000)
   - Phrases courtes, aérées
   - Pas de jargon incompréhensible
   - Un seul message principal par post

3. **STRUCTURE IDÉALE** :
   - 🎯 Accroche (1 ligne qui capte l'attention)
   - 📊 Fait / Actualité / Constat (2-3 lignes)
   - 💡 Analyse / Conseil / Point de vue (3-4 lignes)
   - ✨ Ouverture vers le cabinet OU question d'engagement (1-2 lignes)
   - #Hashtags (3-5 max, pertinents)

4. **CE QU'IL NE FAUT JAMAIS FAIRE** :
   - Lister les services du cabinet
   - Être trop promotionnel ou commercial
   - Faire du "clickbait" sans substance
   - Répéter les mêmes accroches ou structures
   - Être condescendant ou moralisateur
   - Utiliser des superlatifs ("le meilleur", "incroyable", "révolutionnaire")

# INFORMATIONS SUR LE CABINET

Nom : ${config.cabinet_name}
Description : ${config.cabinet_description || 'Non renseigné'}
Spécialités : ${config.cabinet_specialties?.join(', ') || 'Non renseigné'}
Ce qui les différencie : ${config.cabinet_differentiators || 'Non renseigné'}
Valeurs : ${config.cabinet_values || 'Non renseigné'}
${config.years_experience ? `Années d'expérience : ${config.years_experience}` : ''}
${config.clients_count ? `Nombre de clients : ${config.clients_count}` : ''}
${config.average_return ? `Rendement moyen : ${config.average_return}%` : ''}
Ton souhaité : ${config.tone || 'professionnel'}
Cible : ${config.target_audience || 'Particuliers patrimoniaux'}
Sujets à éviter : ${config.topics_to_avoid || 'Aucun spécifié'}
Hashtags favoris : ${config.preferred_hashtags?.join(' ') || '#GestionDePatrimoine #CGP'}
${config.brochure_text ? `\nContenu de la plaquette :\n${config.brochure_text.substring(0, 2000)}` : ''}

# POSTS PRÉCÉDENTS (à ne pas répéter)

${previousPosts.length > 0 ? previousPosts.map((p, i) => `
Post ${i + 1} (${new Date(p.created_at).toLocaleDateString('fr-FR')}) - Thème: ${p.topic || 'N/A'}
Accroche: ${p.hook || p.content.substring(0, 100)}
---`).join('\n') : 'Aucun post précédent.'}

# FORMAT DE RÉPONSE

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans \`\`\`) :
{
  "content": "Le contenu complet du post LinkedIn",
  "hook": "La première ligne d'accroche",
  "topic": "Le thème principal du post",
  "news_source": "La source de l'actualité utilisée si applicable",
  "suggested_image_description": "Description d'une image pertinente à ajouter"
}`;
}

function buildUserPrompt(theme: string, customTopic: string, config: any): string {
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (theme === 'custom' && customTopic) {
    return `Génère un post LinkedIn pour le cabinet ${config.cabinet_name} sur le sujet suivant :

"${customTopic}"

Date du jour : ${today}

Rappel : Le post doit apporter de la valeur, pas être une publicité. Fais le lien avec le cabinet de manière subtile.`;
  }

  const themeInstructions: Record<string, string> = {
    'auto': `Choisis l'actualité financière/patrimoniale la plus pertinente et récente pour générer un post.
Tu peux parler de : taux d'épargne (Livret A, LEP), marchés financiers, immobilier, fiscalité, retraite, etc.
Choisis ce qui est le plus d'actualité en ce moment (${today}).`,

    'market': `Génère un post sur l'actualité des marchés financiers (CAC 40, bourse, tendances).
Trouve un angle intéressant qui parle aux particuliers, pas aux traders.`,

    'savings': `Génère un post sur l'épargne (Livret A, LEP, PEL, assurance-vie).
Les taux du Livret A ont baissé à 2.4% en février 2025. Tu peux utiliser cette info ou une autre actualité pertinente.`,

    'tax': `Génère un post sur la fiscalité (impôts, défiscalisation, lois de finances).
Trouve un angle pratique et utile pour les particuliers.`,

    'retirement': `Génère un post sur la retraite (PER, réforme des retraites, préparation).
Adopte un angle rassurant et constructif.`,

    'realestate': `Génère un post sur l'immobilier (SCPI, investissement locatif, crédit immobilier).
Parle des tendances actuelles du marché.`,

    'tips': `Génère un post avec un conseil patrimonial pratique, sans lien avec l'actualité.
Une astuce concrète que les gens peuvent appliquer.`,
  };

  return `${themeInstructions[theme] || themeInstructions['auto']}

Date du jour : ${today}
Cabinet : ${config.cabinet_name}

Rappel des règles :
- 70% valeur / 30% cabinet (subtil)
- Pas de liste de services
- Accroche percutante
- Max 1300 caractères`;
}