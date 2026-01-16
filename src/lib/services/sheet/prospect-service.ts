import { IProspectService, ProspectData, ProspectFilters, Organization } from '../interfaces';
import {
  getValidCredentials,
  readGoogleSheet,
  parseProspectsFromSheet,
  updateGoogleSheetCells,
  appendGoogleSheetRow,
  GoogleCredentials,
} from '@/lib/google';
import { createAdminClient } from '@/lib/supabase-admin';
import { mapStageToSheetStatus, WaitingSubtype } from '@/types/pipeline';

/**
 * Service Prospect pour le mode Google Sheet
 * Utilise directement les credentials et l'API Google Sheets
 */
export class SheetProspectService implements IProspectService {
  private organizationId: string;
  private googleCredentials?: Record<string, unknown>;
  private googleSheetId?: string;

  constructor(organization: Organization) {
    this.organizationId = organization.id;
    this.googleCredentials = organization.google_credentials;
    this.googleSheetId = organization.google_sheet_id;
  }

  /**
   * Mapping des donnees Sheet vers ProspectData unifie
   */
  private mapSheetToProspect(row: ReturnType<typeof parseProspectsFromSheet>[0]): ProspectData {
    return {
      id: row.id || '',
      rowNumber: row.rowNumber, // Numéro de ligne pour le drag & drop
      firstName: row.prenom || '',
      lastName: row.nom || '',
      email: row.email || '',
      phone: row.telephone,
      source: row.source,
      age: row.age ? parseInt(String(row.age)) : undefined,
      situationPro: row.situationPro,
      revenusMensuels: row.revenus ? parseInt(String(row.revenus)) / 12 : undefined,
      patrimoine: row.patrimoine ? parseInt(String(row.patrimoine)) : undefined,
      besoins: row.besoins,
      notesAppel: row.notesAppel,

      // Mapping Statut Appel -> Stage
      stage: this.mapStatutToStage(row.statutAppel),
      qualification: this.mapQualification(row.qualificationIA),
      scoreIa: row.scoreIA ? parseInt(String(row.scoreIA)) : undefined,
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
   * MUST match SHEET_STAGES slugs in src/types/pipeline.ts:
   * nouveau, en_attente, rdv_pris, rdv_effectue, negociation, gagne, perdu
   */
  private mapStatutToStage(statut?: string): string {
    if (!statut || statut.trim() === '') return 'nouveau';

    const s = statut.toLowerCase().trim();

    // Perdu / Refus
    if (s.includes('refuse') || s.includes('refusé') || s === 'perdu' || s === 'refus') return 'perdu';

    // Gagné
    if (s.includes('gagne') || s.includes('gagné')) return 'gagne';

    // RDV Validé -> rdv_pris
    if (s.includes('rdv valide') || s.includes('rdv validé')) return 'rdv_pris';

    // RDV Effectué -> rdv_effectue
    if (s.includes('rdv effectue') || s.includes('rdv effectué') || s.includes('apres rdv') || s.includes('après rdv'))
      return 'rdv_effectue';

    // Négociation
    if (s.includes('negociation') || s.includes('négociation')) return 'negociation';

    // En attente (À rappeler, Plaquette, Contacté, etc.) -> en_attente
    if (
      s.includes('rappeler') ||
      s.includes('plaquette') ||
      s.includes('contacte') ||
      s.includes('contacté') ||
      s.includes('appele') ||
      s.includes('appelé') ||
      s.includes('attente')
    )
      return 'en_attente';

    // Nouveau
    if (s === 'nouveau') return 'nouveau';

    // Default
    console.log('📊 Unknown sheet status, defaulting to nouveau:', statut);
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

  /**
   * Get valid credentials and save if refreshed
   */
  private async getCredentials(): Promise<GoogleCredentials> {
    if (!this.googleCredentials) {
      throw new Error('Google non connecté');
    }

    console.log('📊 SheetProspectService - Getting valid credentials...');
    const credentials = await getValidCredentials(this.googleCredentials as unknown as GoogleCredentials);

    // Compare access_token to detect if credentials were refreshed
    const originalCredentials = this.googleCredentials as unknown as GoogleCredentials;
    if (credentials.access_token !== originalCredentials.access_token) {
      console.log('🔄 SheetProspectService - Credentials refreshed, saving...');
      const adminClient = createAdminClient();
      await adminClient
        .from('organizations')
        .update({ google_credentials: credentials })
        .eq('id', this.organizationId);
      // Update local cache
      this.googleCredentials = credentials as unknown as Record<string, unknown>;
    }

    return credentials;
  }

  async getAll(filters?: ProspectFilters): Promise<ProspectData[]> {
    try {
      console.log('📊 SheetProspectService.getAll - Starting...');
      console.log('📊 SheetProspectService.getAll - org:', this.organizationId);
      console.log('📊 SheetProspectService.getAll - has credentials:', !!this.googleCredentials);
      console.log('📊 SheetProspectService.getAll - sheetId:', this.googleSheetId);

      if (!this.googleSheetId) {
        console.error('📊 SheetProspectService.getAll - No sheet ID configured');
        return [];
      }

      const credentials = await this.getCredentials();
      console.log('📊 SheetProspectService.getAll - Got credentials, reading sheet...');

      const rows = await readGoogleSheet(credentials, this.googleSheetId);
      console.log('📊 SheetProspectService.getAll - Got rows:', rows.length);

      const rawProspects = parseProspectsFromSheet(rows);
      console.log('📊 SheetProspectService.getAll - Parsed prospects:', rawProspects.length);

      // Mapper vers le format unifie
      let prospects = rawProspects.map((row) => this.mapSheetToProspect(row));

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
      console.error('📊 SheetProspectService.getAll - ERROR:', error);
      return [];
    }
  }

  async getById(id: string): Promise<ProspectData | null> {
    const prospects = await this.getAll();
    return prospects.find((p) => p.id === id) || null;
  }

  async create(data: Partial<ProspectData>): Promise<ProspectData> {
    if (!this.googleSheetId) {
      throw new Error('Aucun ID de Google Sheet configuré');
    }

    const credentials = await this.getCredentials();

    // Get existing rows to determine the next ID
    const existingRows = await readGoogleSheet(credentials, this.googleSheetId);
    const nextId = existingRows.length.toString(); // Row 1 = headers, so length = next ID

    // Date du jour au format DD/MM/YYYY
    const today = new Date();
    const dateLead = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

    // Construire la nouvelle ligne selon la structure de la Sheet :
    // A: ID, B: Date Lead, C: Nom, D: Prénom, E: Email, F: Téléphone, G: Source,
    // H: Âge, I: Situation Pro, J: Revenus Mensuels, K: Patrimoine, L: Besoins,
    // M: Notes Appel, N: Statut Appel, O: Date RDV, P: Rappel Souhaité,
    // Q: Qualification IA, R: Score IA, S: Priorité, T: Justification IA,
    // U: RDV Prévu, V: Lien rappel, W: Mail Plaquette, X: Mail Synthèse,
    // Y: Mail Rappel, Z: Email Conseiller
    const newRow = [
      nextId,                                                    // A: ID
      dateLead,                                                  // B: Date Lead
      data.lastName || '',                                       // C: Nom
      data.firstName || '',                                      // D: Prénom
      data.email || '',                                          // E: Email
      data.phone || '',                                          // F: Téléphone
      data.source || '',                                         // G: Source
      data.age?.toString() || '',                                // H: Âge
      data.situationPro || '',                                   // I: Situation Pro
      data.revenusMensuels ? `${data.revenusMensuels}` : '',     // J: Revenus
      data.patrimoine ? `${data.patrimoine}` : '',               // K: Patrimoine
      data.besoins || '',                                        // L: Besoins
      data.notesAppel || '',                                     // M: Notes Appel
      '',                                                        // N: Statut Appel (vide = Nouveau)
      '',                                                        // O: Date RDV
      '',                                                        // P: Rappel Souhaité
      '',                                                        // Q: Qualification IA
      '',                                                        // R: Score IA
      '',                                                        // S: Priorité
      '',                                                        // T: Justification IA
      '',                                                        // U: RDV Prévu
      '',                                                        // V: Lien rappel
      '',                                                        // W: Mail Plaquette
      '',                                                        // X: Mail Synthèse
      '',                                                        // Y: Mail Rappel
      '',                                                        // Z: Email Conseiller
    ];

    // Ajouter la ligne à la Sheet
    const { rowNumber } = await appendGoogleSheetRow(
      credentials,
      this.googleSheetId,
      newRow,
      'Leads!A:Z'
    );

    console.log('✅ Prospect créé dans la Sheet:', { id: nextId, rowNumber });

    // Retourner le prospect créé
    return {
      id: `sheet-${rowNumber}`,
      rowNumber,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      phone: data.phone,
      source: data.source,
      age: data.age,
      situationPro: data.situationPro,
      revenusMensuels: data.revenusMensuels,
      patrimoine: data.patrimoine,
      besoins: data.besoins,
      notesAppel: data.notesAppel,
      stage: 'nouveau',
      qualification: null,
      createdAt: new Date().toISOString(),
    };
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
    subtype?: WaitingSubtype
  ): Promise<ProspectData> {
    // 1. Trouver le prospect pour obtenir son rowNumber
    const prospect = await this.getById(id);
    if (!prospect) {
      throw new Error('Prospect non trouvé');
    }

    if (!prospect.rowNumber) {
      throw new Error('Impossible de mettre à jour: rowNumber manquant');
    }

    if (!this.googleSheetId) {
      throw new Error('Aucun ID de Google Sheet configuré');
    }

    // 2. Get credentials
    const credentials = await this.getCredentials();

    // 3. Convert stage to Sheet status
    const newStatus = mapStageToSheetStatus(stage, subtype);

    // 4. Prepare updates
    const updates: { range: string; value: string }[] = [
      { range: `N${prospect.rowNumber}`, value: newStatus },
    ];

    // If "en_attente" with "rappel_differe", also set column P = "Oui"
    if (stage === 'en_attente' && subtype === 'rappel_differe') {
      updates.push({ range: `P${prospect.rowNumber}`, value: 'Oui' });
    }

    // 5. Update the Sheet
    await updateGoogleSheetCells(credentials, this.googleSheetId, updates);

    // 6. Retourner le prospect avec le nouveau stage
    return {
      ...prospect,
      stage,
    };
  }

  async getByStage(): Promise<Record<string, ProspectData[]>> {
    const prospects = await this.getAll();

    // MUST match SHEET_STAGES slugs
    const byStage: Record<string, ProspectData[]> = {
      nouveau: [],
      en_attente: [],
      rdv_pris: [],
      rdv_effectue: [],
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
    // Calculer depuis les prospects
    const prospects = await this.getAll();

    const byQualification: Record<string, number> = {
      CHAUD: 0,
      TIEDE: 0,
      FROID: 0,
      NON_QUALIFIE: 0,
    };
    // MUST match SHEET_STAGES slugs
    const byStage: Record<string, number> = {
      nouveau: 0,
      en_attente: 0,
      rdv_pris: 0,
      rdv_effectue: 0,
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
