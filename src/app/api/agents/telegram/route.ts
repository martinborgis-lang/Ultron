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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Vérifier que c'est un message texte du bon chat
    const message = body.message;
    if (!message?.text || String(message.chat.id) !== TELEGRAM_CHAT_ID) {
      return NextResponse.json({ ok: true });
    }

    const text = message.text;
    const messageId = message.message_id;

    // Commande /status
    if (text === '/status') {
      const { data: pendingTasks } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('status', 'pending');

      const { data: runningTasks } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('status', 'running');

      const { data: pendingIdeas } = await supabase
        .from('agent_ideas')
        .select('*')
        .eq('status', 'pending');

      const { data: completedToday } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('status', 'completed')
        .gte('completed_at', new Date().toISOString().split('T')[0]);

      await sendTelegram(
        `📊 *Status Ultron Agents*\n\n` +
        `💡 Ideas en attente: ${pendingIdeas?.length || 0}\n` +
        `⏳ Tasks pending: ${pendingTasks?.length || 0}\n` +
        `⚙️ Tasks running: ${runningTasks?.length || 0}\n` +
        `✅ Complétées aujourd'hui: ${completedToday?.length || 0}`
      );
      return NextResponse.json({ ok: true });
    }

    // Commande /ideas
    if (text === '/ideas') {
      const { data: ideas } = await supabase
        .from('agent_ideas')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .limit(10);

      if (!ideas || ideas.length === 0) {
        await sendTelegram(`📋 *Aucune idée en attente*\n\nEnvoie-moi une idée de feature !`);
      } else {
        const list = ideas.map((i, idx) =>
          `${idx + 1}. *${i.title}*\n   └ Prio: ${i.priority} | Source: ${i.source}`
        ).join('\n\n');
        await sendTelegram(`📋 *Ideas en attente:*\n\n${list}`);
      }
      return NextResponse.json({ ok: true });
    }

    // Commande /history
    if (text === '/history') {
      const { data: tasks } = await supabase
        .from('agent_tasks')
        .select('*, agent_ideas(title)')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(5);

      if (!tasks || tasks.length === 0) {
        await sendTelegram(`📜 *Aucune tâche complétée*`);
      } else {
        const list = tasks.map((t: any) =>
          `✅ *${t.agent_ideas?.title || 'Sans titre'}*\n   └ ${t.pr_url || 'Pas de PR'}`
        ).join('\n\n');
        await sendTelegram(`📜 *5 dernières features:*\n\n${list}`);
      }
      return NextResponse.json({ ok: true });
    }

    // Commande /help
    if (text === '/help' || text === '/start') {
      await sendTelegram(
        `🤖 *Ultron Agent Bot*\n\n` +
        `*Commandes:*\n` +
        `/status - État du système\n` +
        `/ideas - Liste des idées en attente\n` +
        `/history - 5 dernières features\n` +
        `/help - Cette aide\n\n` +
        `*Pour ajouter une idée:*\n` +
        `Envoie simplement ta demande en texte libre !\n\n` +
        `_Exemple: "Ajoute un graphique de conversion sur le dashboard"_`
      );
      return NextResponse.json({ ok: true });
    }

    // Sinon, c'est une nouvelle idée de feature
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: `Tu es un assistant qui extrait les idées de features à partir de messages.
Retourne UNIQUEMENT un JSON valide avec:
- title: titre court de la feature (max 80 chars, en français)
- description: description détaillée de ce qu'il faut implémenter
- priority: priorité de 1 à 100 (100 = très urgent/important)

Si le message n'est pas une idée de feature claire, retourne: {"skip": true, "reason": "explication"}`,
      messages: [{ role: 'user', content: text }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ ok: true });
    }

    let result;
    try {
      const jsonText = content.text.replace(/```json\n?|\n?```/g, '').trim();
      result = JSON.parse(jsonText);
    } catch {
      await sendTelegram(`⚠️ Erreur de parsing. Reformule ton idée ou utilise /help`);
      return NextResponse.json({ ok: true });
    }

    if (result.skip) {
      await sendTelegram(`🤔 Je n'ai pas compris cette idée.\n\n_${result.reason || 'Reformule ta demande'}_`);
      return NextResponse.json({ ok: true });
    }

    // Enregistrer l'idée
    const { data: idea, error } = await supabase
      .from('agent_ideas')
      .insert({
        title: result.title,
        description: result.description,
        priority: Math.min(100, Math.max(1, result.priority || 50)),
        source: 'martin',
        telegram_message_id: messageId,
      })
      .select()
      .single();

    if (error) throw error;

    await sendTelegram(
      `✅ *Idée enregistrée !*\n\n` +
      `📌 *${result.title}*\n\n` +
      `📝 ${result.description.slice(0, 200)}${result.description.length > 200 ? '...' : ''}\n\n` +
      `⭐ Priorité: ${result.priority}/100\n\n` +
      `_Sera développée au prochain cycle horaire${result.priority >= 80 ? ' (priorité haute !)' : ''}._`
    );

    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
