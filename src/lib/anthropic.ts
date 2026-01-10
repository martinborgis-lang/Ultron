import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface EmailGenerated {
  objet: string;
  corps: string;
}

export interface QualificationResult {
  qualification: 'CHAUD' | 'TIEDE' | 'FROID';
  score: number;
  priorite: 'HAUTE' | 'MOYENNE' | 'BASSE';
  justification: string;
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

IMPORTANT - Adapte le ton selon la qualification du prospect:
- CHAUD: Ton enthousiaste et dynamique, montrer l'urgence d'avancer
- TIEDE: Ton rassurant et pédagogique, lever les hésitations
- FROID: Ton court et factuel, rester disponible sans insister

L'email doit:
- Remercier le prospect pour le rendez-vous
- Résumer les points clés abordés
- Proposer les prochaines étapes (adaptées au niveau de qualification)
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

  analyseQualification: `Tu es un expert en qualification de prospects pour conseillers en gestion de patrimoine.
Analyse le profil du prospect et détermine sa qualification.

Critères de qualification:
- CHAUD: Patrimoine > 100k€, revenus stables, besoin identifié, disponible rapidement
- TIEDE: Potentiel intéressant mais hésitant ou timing pas optimal
- FROID: Faible potentiel, peu de moyens, ou pas de besoin identifié

Score: 0-100 basé sur le potentiel commercial
Priorité: HAUTE (à contacter en priorité), MOYENNE, BASSE

Retourne UNIQUEMENT un JSON avec le format:
{"qualification": "CHAUD|TIEDE|FROID", "score": 75, "priorite": "HAUTE|MOYENNE|BASSE", "justification": "Explication courte"}`,
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

export async function qualifyProspect(prospect: {
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  age?: string;
  situationPro?: string;
  revenus?: string;
  patrimoine?: string;
  besoins?: string;
  notesAppel?: string;
}): Promise<QualificationResult> {
  const userPrompt = `Informations du prospect à qualifier:
- Prénom: ${prospect.prenom}
- Nom: ${prospect.nom}
- Email: ${prospect.email}
${prospect.telephone ? `- Téléphone: ${prospect.telephone}` : ''}
${prospect.age ? `- Âge: ${prospect.age}` : ''}
${prospect.situationPro ? `- Situation professionnelle: ${prospect.situationPro}` : ''}
${prospect.revenus ? `- Revenus: ${prospect.revenus}` : ''}
${prospect.patrimoine ? `- Patrimoine: ${prospect.patrimoine}` : ''}
${prospect.besoins ? `- Besoins exprimés: ${prospect.besoins}` : ''}
${prospect.notesAppel ? `- Notes de l'appel: ${prospect.notesAppel}` : ''}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    system: DEFAULT_PROMPTS.analyseQualification,
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  try {
    let jsonStr = content.text;
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);

    const qualification = parsed.qualification?.toUpperCase();
    if (!['CHAUD', 'TIEDE', 'FROID'].includes(qualification)) {
      throw new Error('Invalid qualification value');
    }

    const priorite = parsed.priorite?.toUpperCase();
    if (!['HAUTE', 'MOYENNE', 'BASSE'].includes(priorite)) {
      throw new Error('Invalid priorite value');
    }

    return {
      qualification: qualification as 'CHAUD' | 'TIEDE' | 'FROID',
      score: Math.min(100, Math.max(0, parseInt(parsed.score) || 50)),
      priorite: priorite as 'HAUTE' | 'MOYENNE' | 'BASSE',
      justification: parsed.justification || '',
    };
  } catch {
    throw new Error('Failed to parse qualification from Claude response: ' + content.text);
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
