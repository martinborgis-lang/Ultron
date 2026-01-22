import { logger } from '@/lib/logger';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

async function sendTelegram(message: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
    }),
  });
}

// Contexte du projet pour le Manager
const PROJECT_CONTEXT = `
# Ultron - SaaS de gestion de prospects pour conseillers en gestion de patrimoine

## Stack technique
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + Auth)
- Vercel (hosting)
- Google APIs (Sheets, Calendar, Gmail)

## Features existantes
1. Dashboard avec statistiques (prospects chauds/tièdes/froids, graphiques)
2. Connexion Google Sheets dynamique
3. Qualification automatique des prospects par IA (scoring personnalisable)
4. Envoi d'emails personnalisés (synthèse RDV, rappel 24h, plaquette)
5. Gestion multi-conseillers avec Gmail individuel
6. Extension Chrome pour Google Meet (assistant RDV temps réel)
7. Personnalisation des prompts email par organisation
8. Configuration du scoring IA (pondération patrimoine/revenus/analyse)
9. Mode sombre

## Structure des dossiers
src/
├── app/(dashboard)/     # Pages du dashboard (dashboard, prospects, settings)
├── app/api/            # API Routes
├── components/         # Composants React (ui/, layout/, dashboard/, settings/)
├── lib/               # Utilitaires (supabase/, utils.ts)
└── hooks/             # Custom hooks

## Pistes d'amélioration suggérées
- Analytics avancées (taux de conversion, funnel, performance par source)
- Export PDF des rapports
- Historique des interactions par prospect
- Notifications push / email digest
- Onboarding interactif nouveaux utilisateurs
- Templates d'emails prédéfinis sélectionnables
- Recherche et filtres avancés sur prospects
- Tags/labels personnalisés sur prospects
- Import CSV de prospects
- Intégration calendrier plus poussée (sync bidirectionnelle)
- Page de profil prospect détaillée
- Timeline des actions par prospect
- KPIs personnalisables sur dashboard
- Comparaison période N vs N-1
- Mode compact pour la liste des prospects
`;

async function generateFeatureIdea(): Promise<{ title: string; description: string; priority: number }> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: `Tu es un Product Manager expert en SaaS B2B.
Propose UNE amélioration concrète et implémentable en 1-2 heures pour Ultron.

Critères STRICTS:
- Feature à forte valeur ajoutée pour les conseillers en gestion de patrimoine
- Implémentable en 1-2h de développement (scope limité)
- Peut être: nouvelle UI, amélioration UX, nouvelle stat, petit outil, etc.
- ÉVITE les features qui nécessitent de nouvelles intégrations externes complexes
- PRIVILÉGIE les améliorations du dashboard, des stats, de l'UX

Retourne UNIQUEMENT un JSON valide:
{
  "title": "Titre court et clair",
  "description": "Description détaillée de ce qu'il faut implémenter techniquement",
  "priority": 50
}`,
    messages: [{
      role: 'user',
      content: `Contexte du projet:\n${PROJECT_CONTEXT}\n\nPropose UNE amélioration.`
    }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Invalid AI response');
  }

  const jsonText = content.text.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(jsonText);
}

async function generateDetailedPrompt(title: string, description: string): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 6000,
    system: `Tu es un Tech Lead senior qui rédige des spécifications techniques ultra-détaillées.
Tu dois générer un prompt COMPLET pour Claude Code CLI qui va implémenter la feature.

Le prompt DOIT inclure:
1. Objectif clair de la feature
2. Liste des fichiers à créer/modifier
3. Code TypeScript/React COMPLET pour chaque fichier (pas de "// TODO" ou "...")
4. Instructions de style (Tailwind classes à utiliser)
5. Si besoin, requête SQL pour Supabase
6. Message de commit suggéré

RÈGLES:
- Utilise shadcn/ui pour les composants (Button, Card, Input, etc.)
- Utilise Lucide React pour les icônes
- Respecte le style existant (dark mode compatible)
- Le code doit être prêt à copier-coller et fonctionner
- Sois EXHAUSTIF, ne laisse rien à deviner`,
    messages: [{
      role: 'user',
      content: `Contexte:\n${PROJECT_CONTEXT}\n\n---\n\nFeature à implémenter:\nTitre: ${title}\nDescription: ${description}`
    }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Invalid prompt generation');
  }

  return content.text;
}

export async function POST(request: NextRequest) {
  // Vérifier la signature QStash en production
  // Pour le dev, on peut bypass avec un secret
  const isQStash = request.headers.get('upstash-signature');
  const manualSecret = request.nextUrl.searchParams.get('secret');

  if (!isQStash && manualSecret !== process.env.AGENT_MANUAL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    logger.debug('🚀 Agent trigger started');

    // Vérifier qu'il n'y a pas déjà une tâche en cours
    const { data: runningTasks } = await supabase
      .from('agent_tasks')
      .select('*')
      .eq('status', 'running');

    if (runningTasks && runningTasks.length > 0) {
      logger.debug('Task already running, skipping');
      return NextResponse.json({ skipped: true, reason: 'task_running' });
    }

    // Récupérer les idées en attente (priorité décroissante, plus anciennes d'abord)
    const { data: ideas } = await supabase
      .from('agent_ideas')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    let selectedIdea = ideas?.[0];
    let isAutoGenerated = false;

    // Si pas d'idée de Martin, en générer une automatiquement
    if (!selectedIdea) {
      logger.debug('No pending ideas, generating one...');
      const suggestion = await generateFeatureIdea();
      isAutoGenerated = true;

      const { data: newIdea, error } = await supabase
        .from('agent_ideas')
        .insert({
          title: suggestion.title,
          description: suggestion.description,
          priority: suggestion.priority,
          source: 'auto',
        })
        .select()
        .single();

      if (error) throw error;
      selectedIdea = newIdea;
    }

    if (!selectedIdea) {
      await sendTelegram(`⚠️ Aucune idée disponible et impossible d'en générer.`);
      return NextResponse.json({ skipped: true, reason: 'no_ideas' });
    }

    logger.debug(`Processing idea: ${selectedIdea.title}`);

    // Générer le prompt détaillé pour Claude Code
    const detailedPrompt = await generateDetailedPrompt(selectedIdea.title, selectedIdea.description);
    const branchName = `ultron-agent/${selectedIdea.id.slice(0, 8)}-${Date.now()}`;

    // Créer la tâche
    const { data: task, error: taskError } = await supabase
      .from('agent_tasks')
      .insert({
        idea_id: selectedIdea.id,
        prompt: detailedPrompt,
        branch_name: branchName,
        status: 'pending',
      })
      .select()
      .single();

    if (taskError) throw taskError;

    // Marquer l'idée comme assignée
    await supabase
      .from('agent_ideas')
      .update({ status: 'assigned' })
      .eq('id', selectedIdea.id);

    // Notifier Telegram
    const sourceEmoji = selectedIdea.source === 'martin' ? '👤' : '🤖';
    const sourceText = selectedIdea.source === 'martin' ? 'Ton idée' : 'Idée auto-générée';

    await sendTelegram(
      `🚀 *Nouvelle feature en préparation !*\n\n` +
      `${sourceEmoji} ${sourceText}\n` +
      `📌 *${selectedIdea.title}*\n\n` +
      `📝 ${selectedIdea.description.slice(0, 150)}${selectedIdea.description.length > 150 ? '...' : ''}\n\n` +
      `🔧 Branche: \`${branchName}\`\n\n` +
      `_Le worker va l'implémenter..._`
    );

    logger.debug(`Task created: ${task.id}`);

    return NextResponse.json({
      success: true,
      task_id: task.id,
      idea_id: selectedIdea.id,
      title: selectedIdea.title,
      branch: branchName,
      auto_generated: isAutoGenerated,
    });

  } catch (error: any) {
    console.error('Trigger error:', error);
    await sendTelegram(`❌ *Erreur Agent Manager*\n\n\`${error.message.slice(0, 200)}\``);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET pour tests manuels
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.AGENT_MANUAL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Simuler un POST
  return POST(request);
}
