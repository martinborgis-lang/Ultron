import { IProspectService, ProspectData, ProspectFilters } from '../interfaces';

/**
 * Service Prospect pour le mode Google Sheet
 * Appelle les APIs existantes /api/sheets/prospects et /api/sheets/stats
 */
export class SheetProspectService implements IProspectService {
  constructor(private organizationId: string) {}

  /**
   * Mapping des donnees Sheet vers ProspectData unifie
   */
  private mapSheetToProspect(row: any): ProspectData {
    return {
      id: row.id || '',
      rowNumber: row.rowNumber, // Numéro de ligne pour le drag & drop
      firstName: row.prenom || '',
      lastName: row.nom || '',
      email: row.email || '',
      phone: row.telephone,
      source: row.source,
      age: row.age ? parseInt(row.age) : undefined,
      situationPro: row.situationPro,
      revenusMensuels: row.revenus ? parseInt(row.revenus) / 12 : undefined,
      patrimoine: row.patrimoine ? parseInt(row.patrimoine) : undefined,
      besoins: row.besoins,
      notesAppel: row.notesAppel,

      // Mapping Statut Appel -> Stage
      stage: this.mapStatutToStage(row.statutAppel),
      qualification: this.mapQualification(row.qualificationIA),
      scoreIa: row.scoreIA ? parseInt(row.scoreIA) : undefined,
      justificationIa: row.justificationIA,

      dateRdv: row.dateRdv,
      rappelSouhaite: row.rappelSouhaite,

      mailPlaquetteEnvoye: row.mailPlaquette?.toLowerCase() === 'oui',
      mailSyntheseEnvoye: row.mailSynthese?.toLowerCase() === 'oui',
      mailRappelEnvoye: row.mailRappel?.toLowerCase() === 'oui',

      createdAt: row.dateLead || new Date().toISOString(),
    };
  }

  /**
   * Mapping Statut Appel (Sheet) -> Stage (Pipeline)
   */
  private mapStatutToStage(statut?: string): string {
    if (!statut || statut.trim() === '') return 'nouveau';

    const s = statut.toLowerCase().trim();

    if (s.includes('refuse') || s.includes('refusé') || s === 'perdu') return 'perdu';
    if (s.includes('gagne') || s.includes('gagné') || s === 'gagne') return 'gagne';
    if (s.includes('rdv valide') || s.includes('rdv validé')) return 'rdv_valide';
    if (s.includes('rdv effectue') || s.includes('rdv effectué') || s.includes('apres rdv'))
      return 'proposition';
    if (s.includes('proposition') || s.includes('negociation') || s.includes('négociation'))
      return 'negociation';
    if (
      s.includes('rappeler') ||
      s.includes('plaquette') ||
      s.includes('contacte') ||
      s.includes('contacté') ||
      s.includes('appele') ||
      s.includes('appelé')
    )
      return 'contacte';
    if (s === 'nouveau') return 'nouveau';

    return 'nouveau';
  }

  private mapQualification(qual?: string): 'CHAUD' | 'TIEDE' | 'FROID' | null {
    if (!qual) return null;
    const q = qual.toUpperCase().trim();
    if (q === 'CHAUD') return 'CHAUD';
    if (q === 'TIEDE' || q === 'TIÈDE') return 'TIEDE';
    if (q === 'FROID') return 'FROID';
    return null;
  }

  async getAll(filters?: ProspectFilters): Promise<ProspectData[]> {
    try {
      // Appeler l'API Sheet existante - utiliser un import dynamique pour eviter les problemes SSR
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/sheets/prospects`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (!res.ok) {
        console.error('SheetProspectService.getAll: API error', res.status);
        return [];
      }

      const data = await res.json();
      const rawProspects = data.prospects || [];

      // Mapper vers le format unifie
      let prospects = rawProspects.map((row: any) => this.mapSheetToProspect(row));

      // Appliquer les filtres
      if (filters?.stage) {
        prospects = prospects.filter((p: ProspectData) => p.stage === filters.stage);
      }
      if (filters?.qualification) {
        prospects = prospects.filter((p: ProspectData) => p.qualification === filters.qualification);
      }
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        prospects = prospects.filter(
          (p: ProspectData) =>
            p.firstName.toLowerCase().includes(search) ||
            p.lastName.toLowerCase().includes(search) ||
            p.email.toLowerCase().includes(search)
        );
      }

      return prospects;
    } catch (error) {
      console.error('SheetProspectService.getAll error:', error);
      return [];
    }
  }

  async getById(id: string): Promise<ProspectData | null> {
    const prospects = await this.getAll();
    return prospects.find((p) => p.id === id) || null;
  }

  async create(_data: Partial<ProspectData>): Promise<ProspectData> {
    throw new Error(
      'En mode Sheet, ajoutez les prospects directement dans Google Sheet ou utilisez les workflows automatiques.'
    );
  }

  async update(_id: string, _data: Partial<ProspectData>): Promise<ProspectData> {
    throw new Error('En mode Sheet, modifiez les prospects directement dans Google Sheet.');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('En mode Sheet, supprimez les prospects directement dans Google Sheet.');
  }

  async updateStage(
    id: string,
    stage: string,
    subtype?: 'plaquette' | 'rappel_differe'
  ): Promise<ProspectData> {
    // 1. Trouver le prospect pour obtenir son rowNumber
    const prospect = await this.getById(id);
    if (!prospect) {
      throw new Error('Prospect non trouvé');
    }

    if (!prospect.rowNumber) {
      throw new Error('Impossible de mettre à jour: rowNumber manquant');
    }

    // 2. Appeler l'API pour mettre à jour la Sheet
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/sheets/update-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        row_number: prospect.rowNumber,
        stage_slug: stage,
        subtype,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la mise à jour du statut');
    }

    // 3. Retourner le prospect avec le nouveau stage
    // Note: On met à jour localement car la Sheet est async
    return {
      ...prospect,
      stage,
    };
  }

  async getByStage(): Promise<Record<string, ProspectData[]>> {
    const prospects = await this.getAll();

    const byStage: Record<string, ProspectData[]> = {
      nouveau: [],
      contacte: [],
      rdv_valide: [],
      proposition: [],
      negociation: [],
      gagne: [],
      perdu: [],
    };

    prospects.forEach((p) => {
      const stage = p.stage || 'nouveau';
      if (byStage[stage]) {
        byStage[stage].push(p);
      } else {
        byStage['nouveau'].push(p);
      }
    });

    return byStage;
  }

  async getStats(): Promise<{
    total: number;
    byQualification: Record<string, number>;
    byStage: Record<string, number>;
  }> {
    try {
      // Appeler l'API stats existante
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/sheets/stats`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        const stats = data.stats || data;

        return {
          total: stats.total || 0,
          byQualification: {
            CHAUD: stats.chauds || 0,
            TIEDE: stats.tiedes || 0,
            FROID: stats.froids || 0,
            NON_QUALIFIE:
              (stats.total || 0) - (stats.chauds || 0) - (stats.tiedes || 0) - (stats.froids || 0),
          },
          byStage: {},
        };
      }
    } catch (error) {
      console.error('SheetProspectService.getStats API error:', error);
    }

    // Fallback: calculer depuis les prospects
    const prospects = await this.getAll();

    const byQualification: Record<string, number> = {
      CHAUD: 0,
      TIEDE: 0,
      FROID: 0,
      NON_QUALIFIE: 0,
    };
    const byStage: Record<string, number> = {
      nouveau: 0,
      contacte: 0,
      rdv_valide: 0,
      proposition: 0,
      negociation: 0,
      gagne: 0,
      perdu: 0,
    };

    prospects.forEach((p) => {
      const qual = p.qualification || 'NON_QUALIFIE';
      if (byQualification[qual] !== undefined) byQualification[qual]++;

      const stage = p.stage || 'nouveau';
      if (byStage[stage] !== undefined) byStage[stage]++;
    });

    return { total: prospects.length, byQualification, byStage };
  }
}
