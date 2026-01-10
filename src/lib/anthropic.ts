import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface EmailGenerated {
  objet: string;
  corps: string;
}

export const DEFAULT_PROMPTS = {
  qualification: `Tu es un assistant expert en prospection pour conseillers en gestion de patrimoine.
Génère un email de qualification personnalisé pour un prospect.

L'email doit:
- Être professionnel et chaleureux
- Mentionner les informations pertinentes du prospect
- Proposer un échange pour comprendre ses besoins patrimoniaux
- Être concis (max 200 mots)

Retourne UNIQUEMENT un JSON avec le format:
{"objet": "Objet de l'email", "corps": "Corps de l'email"}`,

  synthese: `Tu es un assistant expert en gestion de patrimoine.
Génère un email de synthèse après un rendez-vous.

L'email doit:
- Remercier le prospect pour le rendez-vous
- Résumer les points clés abordés
- Proposer les prochaines étapes
- Être professionnel et personnalisé

Retourne UNIQUEMENT un JSON avec le format:
{"objet": "Objet de l'email", "corps": "Corps de l'email"}`,

  rappel: `Tu es un assistant pour conseillers en gestion de patrimoine.
Génère un email de rappel pour un rendez-vous prévu demain.

L'email doit:
- Rappeler la date et l'heure du rendez-vous
- Être bref et professionnel
- Inclure les informations pratiques si nécessaire

Retourne UNIQUEMENT un JSON avec le format:
{"objet": "Objet de l'email", "corps": "Corps de l'email"}`,

  plaquette: `Tu es un assistant pour conseillers en gestion de patrimoine.
Génère un email d'envoi de plaquette commerciale.

L'email doit:
- Présenter brièvement la plaquette jointe
- Mettre en avant les points forts
- Inviter à prendre contact pour plus d'informations
- Être professionnel et engageant

Retourne UNIQUEMENT un JSON avec le format:
{"objet": "Objet de l'email", "corps": "Corps de l'email"}`,
};

export async function generateEmail(
  systemPrompt: string,
  userPrompt: string
): Promise<EmailGenerated> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    system: systemPrompt,
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  try {
    // Extract JSON from the response (handle potential markdown code blocks)
    let jsonStr = content.text;
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);

    if (!parsed.objet || !parsed.corps) {
      throw new Error('Invalid email format');
    }

    return {
      objet: parsed.objet,
      corps: parsed.corps,
    };
  } catch {
    throw new Error('Failed to parse email from Claude response: ' + content.text);
  }
}

export function buildUserPrompt(prospect: {
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  qualificationIA?: string;
  scoreIA?: string;
  noteConseiller?: string;
  dateRdv?: string;
  heureRdv?: string;
}): string {
  return `Informations du prospect:
- Prénom: ${prospect.prenom}
- Nom: ${prospect.nom}
- Email: ${prospect.email}
${prospect.telephone ? `- Téléphone: ${prospect.telephone}` : ''}
${prospect.qualificationIA ? `- Qualification: ${prospect.qualificationIA}` : ''}
${prospect.scoreIA ? `- Score: ${prospect.scoreIA}%` : ''}
${prospect.noteConseiller ? `- Notes du conseiller: ${prospect.noteConseiller}` : ''}
${prospect.dateRdv ? `- Date RDV: ${prospect.dateRdv}` : ''}
${prospect.heureRdv ? `- Heure RDV: ${prospect.heureRdv}` : ''}`;
}
