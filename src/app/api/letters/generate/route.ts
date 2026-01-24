import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();
    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { letterType, formData } = await request.json();

    let systemPrompt: string;
    let userPrompt: string;

    if (letterType === 'rachat') {
      systemPrompt = RACHAT_SYSTEM_PROMPT;
      userPrompt = buildRachatUserPrompt(formData);
    } else if (letterType === 'stop_prelevement') {
      systemPrompt = STOP_PRELEVEMENT_SYSTEM_PROMPT;
      userPrompt = buildStopPrelevementUserPrompt(formData);
    } else {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const letter = response.content[0].type === 'text' ? response.content[0].text : '';

    return NextResponse.json({ letter });
  } catch (error) {
    console.error('Erreur génération lettre:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

const RACHAT_SYSTEM_PROMPT = `Tu es un expert en rédaction de courriers administratifs financiers en France.
Tu rédiges des lettres de demande de rachat ou transfert de contrats d'épargne.

FORMAT STRICT :
1. En-tête : Coordonnées de l'expéditeur (nom, adresse)
2. Lieu et date (Paris, le [date du jour])
3. Destinataire (nom de la compagnie)
4. Objet clair
5. Corps de la lettre professionnel avec référence au numéro de contrat
6. Formule de politesse
7. Espace pour signature

RÈGLES :
- Mentionner les articles de loi pertinents (L.132-21 du Code des assurances pour assurance-vie)
- Inclure les coordonnées bancaires si rachat
- Être précis et formel
- Utiliser le vouvoiement
- NE PAS ajouter de commentaire, juste la lettre
- Formater proprement avec retours à la ligne

EXEMPLE DE STRUCTURE :
[Nom Prénom]
[Adresse]
[Code postal] [Ville]

                                                           Paris, le [date]

[Compagnie d'assurance]
Service Rachat
[Adresse si connue]

Objet : Demande de rachat [total/partiel] du contrat n°[numéro]

Madame, Monsieur,

Je soussigné(e), [Prénom Nom], titulaire du contrat [type] n°[numéro] souscrit le [date], vous présente par la présente ma demande de [type d'opération].

[Corps de la lettre avec références légales]

[Coordonnées bancaires si nécessaire]

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

[Signature]
[Nom Prénom]`;

const STOP_PRELEVEMENT_SYSTEM_PROMPT = `Tu es un expert en rédaction de courriers administratifs.
Tu rédiges des lettres de demande d'arrêt de prélèvements automatiques.

FORMAT STRICT :
1. En-tête : Coordonnées de l'expéditeur
2. Lieu et date
3. Destinataire
4. Objet : Demande d'arrêt des versements programmés
5. Corps formel avec numéro de contrat et détails du prélèvement
6. Formule de politesse
7. Espace pour signature

RÈGLES :
- Préciser que le contrat reste ouvert (pas de rachat)
- Demander confirmation écrite
- Être clair sur la date d'effet souhaitée
- Utiliser le vouvoiement
- NE PAS ajouter de commentaire, juste la lettre
- Formater proprement avec retours à la ligne

EXEMPLE DE STRUCTURE :
[Nom Prénom]
[Adresse]
[Code postal] [Ville]

                                                           Paris, le [date]

[Compagnie d'assurance]
Service Gestion des Contrats

Objet : Demande d'arrêt des versements programmés - Contrat n°[numéro]

Madame, Monsieur,

Je soussigné(e), [Prénom Nom], titulaire du contrat n°[numéro], vous demande par la présente l'arrêt des versements programmés.

[Détails du prélèvement]
[Date d'effet souhaitée]

Je vous prie de me faire parvenir une confirmation écrite de cet arrêt.

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

[Signature]
[Nom Prénom]`;

function buildRachatUserPrompt(data: any): string {
  const typeOp = {
    'rachat_total': 'rachat total',
    'rachat_partiel': `rachat partiel de ${data.montantRachatPartiel} €`,
    'transfert': 'transfert',
  }[data.typeOperation] || 'rachat';

  const typeContrat = {
    'assurance_vie': "contrat d'assurance-vie",
    'per': 'Plan Épargne Retraite (PER)',
    'pea': 'Plan d\'Épargne en Actions (PEA)',
    'compte_titre': 'compte-titres',
    'perp': 'Plan d\'Épargne Retraite Populaire (PERP)',
    'capitalisation': 'contrat de capitalisation',
  }[data.typeContrat] || 'contrat';

  const compagnie = data.compagnie === 'Autre' ? data.autreCompagnie : data.compagnie;

  let prompt = `Rédige une lettre de ${typeOp} pour ce ${typeContrat} :

EXPÉDITEUR :
${data.clientPrenom} ${data.clientNom}
${data.clientAdresse}
${data.clientCodePostal} ${data.clientVille}
${data.clientDateNaissance ? `Né(e) le ${new Date(data.clientDateNaissance).toLocaleDateString('fr-FR')}` : ''}
${data.clientLieuNaissance ? `à ${data.clientLieuNaissance}` : ''}

DESTINATAIRE : ${compagnie}

CONTRAT :
- N° : ${data.numeroContrat}
- Type : ${typeContrat}
${data.dateSouscription ? `- Souscrit le : ${new Date(data.dateSouscription).toLocaleDateString('fr-FR')}` : ''}
${data.montantEstime ? `- Montant estimé : ${data.montantEstime} €` : ''}

OPÉRATION : ${typeOp}`;

  if ((data.typeOperation === 'rachat_total' || data.typeOperation === 'rachat_partiel') && data.ribIban) {
    prompt += `

RIB DESTINATION :
- IBAN : ${data.ribIban}
- BIC : ${data.ribBic || 'Non précisé'}
- Titulaire : ${data.ribTitulaire || data.clientPrenom + ' ' + data.clientNom}`;
  }

  if (data.typeOperation === 'transfert' && data.nouveauContratNumero) {
    prompt += `

CONTRAT DESTINATION : ${data.nouveauContratNumero}`;
  }

  return prompt;
}

function buildStopPrelevementUserPrompt(data: any): string {
  const compagnie = data.compagnie === 'Autre' ? data.autreCompagnie : data.compagnie;
  const freq = {
    'mensuel': 'mensuel',
    'trimestriel': 'trimestriel',
    'semestriel': 'semestriel',
    'annuel': 'annuel',
  }[data.frequence] || 'mensuel';

  return `Rédige une lettre d'arrêt de prélèvement :

EXPÉDITEUR :
${data.clientPrenom} ${data.clientNom}
${data.clientAdresse}
${data.clientCodePostal} ${data.clientVille}

DESTINATAIRE : ${compagnie}

CONTRAT : N° ${data.numeroContrat}

PRÉLÈVEMENT À ARRÊTER :
- Montant : ${data.montantPrelevement} €
- Fréquence : ${freq}
- Date d'arrêt souhaitée : ${data.dateArret ? new Date(data.dateArret).toLocaleDateString('fr-FR') : 'Dès réception du courrier'}

Important : Le contrat doit rester ouvert, seuls les versements automatiques doivent être arrêtés.`;
}