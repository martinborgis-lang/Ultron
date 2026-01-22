export interface UnifiedStage {
  id: string;
  slug: string;
  name: string;
  color: string;
  position: number;
  is_won: boolean;
  is_lost: boolean;
  sheet_status?: string; // Valeur correspondante dans la colonne N de la Sheet
}

export type WaitingSubtype = 'plaquette' | 'rappel_differe';

export const SHEET_STAGES: UnifiedStage[] = [
  { id: 'sheet-1', slug: 'nouveau', name: 'Nouveau', color: '#6366f1', position: 0, is_won: false, is_lost: false, sheet_status: '' },
  { id: 'sheet-2', slug: 'en_attente', name: 'En attente', color: '#f59e0b', position: 1, is_won: false, is_lost: false, sheet_status: 'À rappeler' },
  { id: 'sheet-3', slug: 'rdv_pris', name: 'RDV Pris', color: '#10b981', position: 2, is_won: false, is_lost: false, sheet_status: 'RDV Validé' },
  { id: 'sheet-4', slug: 'rdv_effectue', name: 'RDV Effectué', color: '#3b82f6', position: 3, is_won: false, is_lost: false, sheet_status: 'RDV Effectué' },
  { id: 'sheet-5', slug: 'negociation', name: 'Négociation', color: '#8b5cf6', position: 4, is_won: false, is_lost: false, sheet_status: 'Négociation' },
  { id: 'sheet-6', slug: 'gagne', name: 'Gagné', color: '#22c55e', position: 5, is_won: true, is_lost: false, sheet_status: 'Gagné' },
  { id: 'sheet-7', slug: 'perdu', name: 'Perdu', color: '#ef4444', position: 6, is_won: false, is_lost: true, sheet_status: 'Refus' },
];

/**
 * Convertit un statut de la colonne N de la Sheet vers un stage pipeline
 */
export function mapSheetStatusToStage(status: string): { slug: string; subtype?: WaitingSubtype } {
  const s = status?.trim() || '';

  if (s === '' || s.toLowerCase() === 'nouveau') return { slug: 'nouveau' };
  if (s === 'À rappeler - Plaquette') return { slug: 'en_attente', subtype: 'plaquette' };
  if (s === 'À rappeler - RDV') return { slug: 'en_attente', subtype: 'rappel_differe' };
  if (s === 'RDV Validé') return { slug: 'rdv_pris' };
  if (s === 'RDV Effectué') return { slug: 'rdv_effectue' };
  if (s === 'Négociation') return { slug: 'negociation' };
  if (s === 'Gagné') return { slug: 'gagne' };
  if (s === 'Refus') return { slug: 'perdu' };

  // Fallback pour les statuts non reconnus
  return { slug: 'nouveau' };
}

/**
 * Convertit un stage pipeline vers un statut de la colonne N de la Sheet
 */
export function mapStageToSheetStatus(slug: string, subtype?: WaitingSubtype): string {
  switch (slug) {
    case 'nouveau': return '';
    case 'en_attente':
      if (subtype === 'plaquette') return 'À rappeler - Plaquette';
      return 'À rappeler - RDV'; // Default pour rappel_differe ou null
    case 'rdv_pris': return 'RDV Validé';
    case 'rdv_effectue': return 'RDV Effectué';
    case 'negociation': return 'Négociation';
    case 'gagne': return 'Gagné';
    case 'perdu': return 'Refus';
    default: return '';
  }
}

/**
 * Trouve un stage par son slug
 */
export function getStageBySlug(slug: string): UnifiedStage | undefined {
  return SHEET_STAGES.find(s => s.slug === slug);
}
