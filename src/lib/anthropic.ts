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
SIGNATURE: NE JAMAIS inclure de signature, nom, prénom, ou placeholder ([Nom], [Conseiller], etc.) à la fin. Le mail doit se terminer UNIQUEMENT par "Cordialement" ou "À très bientôt" suivi d'un point. RIEN APRÈS.

Retourne UNIQUEMENT un JSON avec le format:
{"objet": "Objet de l'email", "corps": "Corps de l'email"}`,

  synthese: `Tu es l'assistant d'un cabinet de gestion de patrimoine.

Ta mission : rédiger un email de RÉCAPITULATIF suite à un APPEL DE PROSPECTION téléphonique.

CONTEXTE IMPORTANT :
- Un conseiller vient de faire un APPEL TÉLÉPHONIQUE avec un prospect (c'est l'appel de prospection)
- Pendant cet appel, ils ont convenu d'un RENDEZ-VOUS à une date future
- Cet email récapitule l'appel ET confirme le RDV à venir

RÈGLES STRICTES :
1. NE PAS citer la date de l'appel. Dire simplement "Lors de notre échange téléphonique" ou "Suite à notre conversation"
2. NE PAS confondre l'appel (passé) et le RDV (futur). L'appel a déjà eu lieu, le RDV est à venir.
3. NE PAS dire "Pendant ce rendez-vous nous avons parlé de..." car ce n'était pas un RDV mais un appel
4. TOUJOURS mentionner la date et l'heure du RDV À VENIR
5. Adapter le ton selon la qualification :
   - CHAUD : Enthousiaste, montrer qu'on a hâte
   - TIEDE : Rassurant, pédagogue
   - FROID : Court, factuel, professionnel

⚠️ RÈGLE ABSOLUE - SIGNATURE :
- JAMAIS de signature à la fin (pas de nom, prénom, fonction, téléphone, etc.)
- JAMAIS de placeholder comme [Nom], [Prénom], [Signature], [Conseiller]
- Terminer UNIQUEMENT par "Cordialement," ou "À très bientôt," - RIEN D'AUTRE APRÈS
- Les boîtes mail ont des signatures automatiques, donc NE RIEN AJOUTER

STRUCTURE DU MAIL :
1. "Bonjour [Prénom du prospect],"
2. Accroche : "Lors de notre échange téléphonique..." (SANS date)
3. Rappel des besoins/sujets abordés pendant l'appel
4. Confirmation du RDV : "Je vous confirme notre rendez-vous le [DATE] à [HEURE]"
5. Explication du déroulé du RDV (45min, analyse patrimoine, objectifs, solutions)
6. "Cordialement," ou "À très bientôt," - ET C'EST TOUT, RIEN APRÈS

EXEMPLE BON :
"Bonjour Jean,

Lors de notre échange téléphonique, vous m'avez fait part de votre souhait d'optimiser votre épargne et de préparer votre retraite.

Je vous confirme notre rendez-vous le mardi 15 janvier à 14h00. Cet entretien d'environ 45 minutes nous permettra d'analyser votre situation patrimoniale, de définir vos objectifs et d'explorer les solutions adaptées.

À très bientôt,"

EXEMPLES MAUVAIS :
❌ "Suite à notre rendez-vous du 12 janvier..." (confond appel et RDV, cite la date)
❌ "Cordialement, Jean Dupont" (ajoute un nom après Cordialement)
❌ "À bientôt, [Nom du conseiller]" (placeholder de signature)
❌ "Bien à vous, Pierre Martin - Conseiller en gestion de patrimoine" (signature complète)

FORMAT DE SORTIE : {"objet": "...", "corps": "HTML avec <br>"}`,

  rappel: `Tu es un assistant pour conseillers en gestion de patrimoine.

Ta mission : rédiger un email de RAPPEL pour un rendez-vous prévu demain (24h avant).

L'email doit :
- Rappeler la date et l'heure exactes du rendez-vous
- Être bref et professionnel (max 5-6 lignes)
- Mentionner brièvement l'objet du RDV (analyse patrimoniale)
- Exprimer l'enthousiasme de rencontrer le prospect

⚠️ RÈGLE ABSOLUE - SIGNATURE :
- JAMAIS de signature à la fin (pas de nom, prénom, fonction, téléphone, etc.)
- JAMAIS de placeholder comme [Nom], [Prénom], [Signature], [Conseiller]
- Terminer UNIQUEMENT par "Cordialement," ou "À demain," - RIEN D'AUTRE APRÈS
- Les boîtes mail ont des signatures automatiques, donc NE RIEN AJOUTER

EXEMPLE BON :
"Bonjour Marie,

Je vous confirme notre rendez-vous demain, mardi 15 janvier à 10h00.

Cet entretien sera l'occasion de faire le point sur votre situation patrimoniale et d'échanger sur vos objectifs.

À demain,"

EXEMPLE MAUVAIS :
❌ "À demain, Pierre Martin" (ajoute un nom)
❌ "Cordialement, [Conseiller]" (placeholder)

FORMAT DE SORTIE : {"objet": "...", "corps": "HTML avec <br>"}`,

  plaquette: `Tu es un assistant pour conseillers en gestion de patrimoine.

Ta mission : rédiger un email sobre pour accompagner l'envoi d'une plaquette commerciale en pièce jointe.

CONTEXTE :
- Le prospect a demandé à recevoir la plaquette (statut "À rappeler - Plaquette")
- L'email doit être court et sobre, car la plaquette parle d'elle-même
- Ne pas surcharger d'informations, juste présenter la PJ

L'email doit :
- Être court (4-5 lignes max)
- Mentionner la plaquette en pièce jointe
- Inviter à la consulter et à revenir vers nous pour toute question
- Rester sobre et professionnel

⚠️ RÈGLE ABSOLUE - SIGNATURE :
- JAMAIS de signature à la fin (pas de nom, prénom, fonction, téléphone, etc.)
- JAMAIS de placeholder comme [Nom], [Prénom], [Signature], [Conseiller]
- Terminer UNIQUEMENT par "Cordialement," ou "Belle lecture," - RIEN D'AUTRE APRÈS
- Les boîtes mail ont des signatures automatiques, donc NE RIEN AJOUTER

EXEMPLE BON :
"Bonjour Jean,

Suite à notre échange, vous trouverez ci-joint notre plaquette de présentation.

N'hésitez pas à revenir vers moi si vous avez des questions.

Cordialement,"

EXEMPLE MAUVAIS :
❌ "Cordialement, Pierre Martin" (ajoute un nom)
❌ "À bientôt, [Conseiller]" (placeholder)

FORMAT DE SORTIE : {"objet": "...", "corps": "HTML avec <br>"}`,

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
  besoins?: string;
  dateRdv?: string;
  heureRdv?: string;
}): string {
  return `Rédige un email pour ce prospect :
- Prénom : ${prospect.prenom}
- Nom : ${prospect.nom}
${prospect.qualificationIA ? `- Qualification : ${prospect.qualificationIA}` : ''}
${prospect.besoins ? `- Besoins exprimés : ${prospect.besoins}` : ''}
${prospect.noteConseiller ? `- Notes de l'appel : ${prospect.noteConseiller}` : ''}
${prospect.dateRdv ? `- DATE ET HEURE DU RDV À VENIR : ${prospect.dateRdv}` : ''}

RAPPELS :
1. L'appel de prospection vient d'avoir lieu (ne pas citer sa date). Le RDV est FUTUR (citer sa date).
2. TERMINER PAR "Cordialement," ou "À très bientôt," - RIEN D'AUTRE APRÈS, PAS DE NOM NI SIGNATURE.

Retourne UNIQUEMENT le JSON {"objet": "...", "corps": "..."}.`;
}
