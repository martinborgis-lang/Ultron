import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const RESPONSE_FORMATTER_SYSTEM_PROMPT = `Tu es un assistant CRM francais pour conseillers en gestion de patrimoine.

Ta mission: Presenter les resultats de requetes SQL de maniere conversationnelle et professionnelle.

REGLES:
1. Reponds toujours en francais
2. Sois concis mais informatif
3. Mets en valeur les informations cles (nombres, totaux, tendances)
4. Si la liste est longue, resume les points principaux
5. Utilise des formulations naturelles ("Voici les X prospects...", "J'ai trouve Y resultats...")
6. Si aucun resultat, explique poliment qu'il n'y a pas de donnees
7. Propose 1-2 questions de suivi pertinentes a la fin
8. N'invente JAMAIS de donnees - base-toi uniquement sur les resultats fournis
9. Formate les montants en euros avec separateurs de milliers
10. Formate les dates en francais (ex: 15 janvier 2026)`;

/**
 * Format query results into a conversational response
 */
export async function formatResponse(
  userQuestion: string,
  data: Record<string, unknown>[],
  sql?: string
): Promise<string> {
  // Handle empty results
  if (!data || data.length === 0) {
    return `Je n'ai trouve aucun resultat correspondant a votre recherche "${userQuestion}".

Cela peut signifier que:
- Il n'y a pas encore de donnees correspondant a ces criteres
- Les filtres sont peut-etre trop restrictifs

Voulez-vous essayer une recherche differente ?`;
  }

  // For simple count queries
  if (data.length === 1 && Object.keys(data[0]).length === 1) {
    const key = Object.keys(data[0])[0];
    const value = data[0][key];

    if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
      return formatCountResponse(userQuestion, key, Number(value));
    }
  }

  // For complex results, use Claude to format
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: RESPONSE_FORMATTER_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Question de l'utilisateur: "${userQuestion}"

Resultats de la requete (${data.length} lignes):
${JSON.stringify(data, null, 2)}

Formate ces resultats de maniere conversationnelle.`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return formatFallbackResponse(userQuestion, data);
    }

    return content.text;
  } catch (error) {
    console.error('Response formatting error:', error);
    return formatFallbackResponse(userQuestion, data);
  }
}

/**
 * Format a count response
 */
function formatCountResponse(question: string, key: string, value: number): string {
  const keyLower = key.toLowerCase();

  if (keyLower.includes('rdv') || keyLower.includes('meeting')) {
    if (value === 0) {
      return `Aucun RDV trouve pour cette periode.

Souhaitez-vous consulter les RDV sur une autre periode ?`;
    }
    return `Vous avez **${value} RDV** ${question.toLowerCase().includes('semaine') ? 'cette semaine' : 'programmes'}.

Voulez-vous voir le detail de ces RDV ?`;
  }

  if (keyLower.includes('prospect') || keyLower === 'total' || keyLower === 'count') {
    if (value === 0) {
      return `Aucun prospect trouve correspondant a ces criteres.

Essayez peut-etre avec des criteres moins restrictifs ?`;
    }
    return `J'ai trouve **${value} prospect${value > 1 ? 's' : ''}** correspondant a votre recherche.

Voulez-vous voir la liste detaillee ?`;
  }

  return `Le resultat est: **${value}**`;
}

/**
 * Fallback formatting when Claude fails
 */
function formatFallbackResponse(
  question: string,
  data: Record<string, unknown>[]
): string {
  const count = data.length;

  let response = `Voici les ${count} resultat${count > 1 ? 's' : ''} trouves:\n\n`;

  // Format first few results
  const displayData = data.slice(0, 5);

  displayData.forEach((row, index) => {
    const values = Object.entries(row)
      .filter(([_, v]) => v !== null && v !== undefined)
      .map(([k, v]) => {
        // Format values nicely
        if (typeof v === 'number') {
          // Check if it looks like money
          if (k.toLowerCase().includes('patrimoine') || k.toLowerCase().includes('revenu')) {
            return `${k}: ${formatMoney(v)}`;
          }
          return `${k}: ${v}`;
        }
        if (v instanceof Date || (typeof v === 'string' && isDateString(v))) {
          return `${k}: ${formatDate(v as string | Date)}`;
        }
        return `${k}: ${v}`;
      })
      .join(', ');

    response += `${index + 1}. ${values}\n`;
  });

  if (count > 5) {
    response += `\n... et ${count - 5} autres resultats.`;
  }

  return response;
}

/**
 * Format money value
 */
function formatMoney(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format date value
 */
function formatDate(value: string | Date): string {
  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return String(value);
  }
}

/**
 * Check if a string looks like a date
 */
function isDateString(value: string): boolean {
  if (typeof value !== 'string') return false;
  // Check common date patterns
  return /^\d{4}-\d{2}-\d{2}/.test(value) || /^\d{2}\/\d{2}\/\d{4}/.test(value);
}

/**
 * Determine the best way to display results
 */
export function determineDataType(
  data: Record<string, unknown>[]
): 'table' | 'count' | 'list' {
  if (!data || data.length === 0) {
    return 'list';
  }

  // Single row with single numeric value = count
  if (data.length === 1) {
    const values = Object.values(data[0]);
    if (values.length === 1 && typeof values[0] === 'number') {
      return 'count';
    }
  }

  // Multiple columns = table
  const firstRow = data[0];
  const columnCount = Object.keys(firstRow).length;

  if (columnCount >= 3) {
    return 'table';
  }

  return 'list';
}
