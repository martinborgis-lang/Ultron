/**
 * Remplace les placeholders {{variable}} dans un texte avec les vraies valeurs
 */
export function replacePlaceholders(text: string, prospect: any): string {
  if (!text || !prospect) return text || '';

  let result = text;

  // Remplacement sécurisé des placeholders
  const replacements: Record<string, string> = {
    'prenom': prospect.prenom || prospect.first_name || prospect.prénom || '',
    'nom': prospect.nom || prospect.last_name || '',
    'email': prospect.email || '',
    'besoins': prospect.besoins || prospect.notes_qualification || '',
    'notes_appel': prospect.notes_appel || prospect.notesAppel || '',
    'date_rdv': prospect.date_rdv || prospect.rdv_date || prospect.dateRdv || '',
    'qualification': prospect.qualification || prospect.qualificationIA || '',
    'telephone': prospect.telephone || prospect.phone || '',
    'score': prospect.score || prospect.scoreIA || '',
    'priorite': prospect.priorite || prospect.prioriteIA || ''
  };

  // Remplacer tous les placeholders
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    result = result.replace(regex, value);
  }

  return result;
}

/**
 * Applique le remplacement des placeholders sur un objet email complet
 */
export function replaceEmailPlaceholders(email: { objet: string; corps: string }, prospect: any) {
  return {
    objet: replacePlaceholders(email.objet, prospect),
    corps: replacePlaceholders(email.corps, prospect)
  };
}