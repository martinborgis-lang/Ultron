import Anthropic from '@anthropic-ai/sdk';
import { getSchemaContext } from './schema-context';
import type { SQLGenerationResult, ConversationContext } from '@/types/assistant';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SQL_GENERATOR_SYSTEM_PROMPT = `Tu es un expert SQL PostgreSQL specialise dans les bases de donnees CRM pour la gestion de patrimoine.

Ta mission: Convertir les questions en langage naturel en requetes SQL SELECT valides.

${getSchemaContext()}

## INSTRUCTIONS CRITIQUES

1. Reponds UNIQUEMENT avec la requete SQL, sans explication, sans markdown, sans commentaire
2. N'utilise JAMAIS de bloc de code markdown (\`\`\`)
3. La requete doit etre prete a etre executee directement
4. Si la question n'est pas claire ou ne correspond pas aux donnees disponibles, genere une requete qui retourne un resultat vide plutot que de refuser

## FORMAT DE REPONSE
Retourne directement le SQL, par exemple:
SELECT first_name AS prenom, last_name AS nom FROM crm_prospects WHERE organization_id = $1 LIMIT 10`;

/**
 * Generate SQL query from natural language using Claude
 */
export async function generateSQL(
  userMessage: string,
  conversationHistory?: ConversationContext[]
): Promise<SQLGenerationResult> {
  // Build conversation context if available
  let contextString = '';
  if (conversationHistory && conversationHistory.length > 0) {
    const relevantHistory = conversationHistory.slice(-4); // Last 4 messages for context
    contextString = relevantHistory
      .map((msg) => `${msg.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${msg.content}`)
      .join('\n');
  }

  const userPrompt = `${contextString ? `Contexte de la conversation:\n${contextString}\n\n` : ''}Question de l'utilisateur: "${userMessage}"

Genere la requete SQL PostgreSQL correspondante.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SQL_GENERATOR_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Clean up the SQL response
    let sql = content.text.trim();

    // Remove markdown code blocks if present
    if (sql.startsWith('```sql')) {
      sql = sql.slice(6);
    } else if (sql.startsWith('```')) {
      sql = sql.slice(3);
    }
    if (sql.endsWith('```')) {
      sql = sql.slice(0, -3);
    }

    // Remove any trailing/leading whitespace
    sql = sql.trim();

    // Basic sanity check - must look like SQL
    if (!sql.toUpperCase().startsWith('SELECT')) {
      throw new Error('Generated query does not start with SELECT');
    }

    return { sql };
  } catch (error) {
    console.error('SQL generation error:', error);
    throw new Error(
      `Erreur lors de la generation SQL: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if a message is a greeting or non-query message
 */
export function isGreetingOrNonQuery(message: string): boolean {
  const greetings = [
    'bonjour',
    'salut',
    'hello',
    'hi',
    'coucou',
    'bonsoir',
    'merci',
    'au revoir',
    'bye',
    'ok',
    'oui',
    'non',
    'd\'accord',
    'super',
    'parfait',
  ];

  const lowerMessage = message.toLowerCase().trim();

  // Check if it's just a greeting
  if (greetings.some((g) => lowerMessage === g || lowerMessage.startsWith(g + ' '))) {
    return true;
  }

  // Check if it's very short and doesn't contain query words
  const queryWords = [
    'montre',
    'donne',
    'affiche',
    'liste',
    'combien',
    'trouve',
    'cherche',
    'quels',
    'quelles',
    'qui',
    'prospects',
    'rdv',
    'taches',
    'conseillers',
    'patrimoine',
    'revenus',
    'chaud',
    'tiede',
    'froid',
  ];

  if (lowerMessage.length < 10 && !queryWords.some((w) => lowerMessage.includes(w))) {
    return true;
  }

  return false;
}

/**
 * Get a friendly response for greetings
 */
export function getGreetingResponse(message: string): string {
  const lowerMessage = message.toLowerCase().trim();

  if (lowerMessage.includes('bonjour') || lowerMessage.includes('salut') || lowerMessage.includes('hello')) {
    return `Bonjour ! Je suis l'assistant Ultron. Je peux vous aider a interroger vos donnees CRM.

Voici quelques exemples de questions que vous pouvez me poser:
- "Montre moi les prospects chauds"
- "Combien de RDV cette semaine?"
- "Prospects sans conseiller assigne"
- "Top 5 par patrimoine"

Comment puis-je vous aider ?`;
  }

  if (lowerMessage.includes('merci')) {
    return `Je vous en prie ! N'hesitez pas si vous avez d'autres questions sur vos prospects.`;
  }

  if (lowerMessage.includes('au revoir') || lowerMessage.includes('bye')) {
    return `A bientot ! N'hesitez pas a revenir si vous avez besoin d'aide.`;
  }

  return `Je suis pret a vous aider ! Posez-moi une question sur vos prospects, RDV, ou taches.`;
}
