import { createAdminClient } from '@/lib/supabase-admin';
import { IProspectService, ProspectData, ProspectFilters } from '../interfaces';

export class CrmProspectService implements IProspectService {
  private supabase = createAdminClient();

  constructor(private organizationId: string) {}

  private mapDbToProspect(row: any): ProspectData {
    return {
      id: row.id,
      firstName: row.first_name || '',
      lastName: row.last_name || '',
      email: row.email || '',
      phone: row.phone,
      source: row.source_detail || row.source,
      age: row.age,
      situationPro: row.profession || row.job_title,
      revenusMensuels: row.revenus_annuels ? Math.round(row.revenus_annuels / 12) : undefined,
      patrimoine: row.patrimoine_estime,
      besoins: row.notes,
      notesAppel: row.notes,

      stage: row.stage_slug || 'nouveau',
      qualification: row.qualification || null,
      scoreIa: row.score_ia,
      justificationIa: row.analyse_ia,

      dateRdv: row.expected_close_date,

      assignedTo: row.assigned_to,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getAll(filters?: ProspectFilters): Promise<ProspectData[]> {
    let query = this.supabase
      .from('crm_prospects')
      .select('*')
      .eq('organization_id', this.organizationId)
      .order('created_at', { ascending: false });

    if (filters?.stage) {
      query = query.eq('stage_slug', filters.stage);
    }
    if (filters?.qualification) {
      query = query.eq('qualification', filters.qualification);
    }
    if (filters?.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('CrmProspectService.getAll error:', error);
      throw error;
    }

    return (data || []).map((row) => this.mapDbToProspect(row));
  }

  async getById(id: string): Promise<ProspectData | null> {
    const { data, error } = await this.supabase
      .from('crm_prospects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapDbToProspect(data);
  }

  async create(data: Partial<ProspectData>): Promise<ProspectData> {
    const dbData: Record<string, any> = {
      organization_id: this.organizationId,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      source_detail: data.source,
      age: data.age,
      profession: data.situationPro,
      revenus_annuels: data.revenusMensuels ? data.revenusMensuels * 12 : null,
      patrimoine_estime: data.patrimoine,
      notes: data.besoins || data.notesAppel,
      stage_slug: data.stage || 'nouveau',
      qualification: data.qualification,
      score_ia: data.scoreIa,
      analyse_ia: data.justificationIa,
      expected_close_date: data.dateRdv,
      assigned_to: data.assignedTo,
    };

    const { data: result, error } = await this.supabase
      .from('crm_prospects')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('CrmProspectService.create error:', error);
      throw error;
    }

    return this.mapDbToProspect(result);
  }

  async update(id: string, data: Partial<ProspectData>): Promise<ProspectData> {
    const dbData: Record<string, any> = { updated_at: new Date().toISOString() };

    if (data.firstName !== undefined) dbData.first_name = data.firstName;
    if (data.lastName !== undefined) dbData.last_name = data.lastName;
    if (data.email !== undefined) dbData.email = data.email;
    if (data.phone !== undefined) dbData.phone = data.phone;
    if (data.source !== undefined) dbData.source_detail = data.source;
    if (data.age !== undefined) dbData.age = data.age;
    if (data.situationPro !== undefined) dbData.profession = data.situationPro;
    if (data.revenusMensuels !== undefined) dbData.revenus_annuels = data.revenusMensuels * 12;
    if (data.patrimoine !== undefined) dbData.patrimoine_estime = data.patrimoine;
    if (data.besoins !== undefined) dbData.notes = data.besoins;
    if (data.notesAppel !== undefined) dbData.notes = data.notesAppel;
    if (data.stage !== undefined) dbData.stage_slug = data.stage;
    if (data.qualification !== undefined) dbData.qualification = data.qualification;
    if (data.scoreIa !== undefined) dbData.score_ia = data.scoreIa;
    if (data.justificationIa !== undefined) dbData.analyse_ia = data.justificationIa;
    if (data.dateRdv !== undefined) dbData.expected_close_date = data.dateRdv;
    if (data.assignedTo !== undefined) dbData.assigned_to = data.assignedTo;

    // Handle meetLink and dateRdv - store in metadata
    // dateRdv is also stored in metadata as rdv_datetime to preserve the full datetime (since expected_close_date might be DATE type)
    if ((data as any).meetLink !== undefined || data.dateRdv !== undefined) {
      // We need to merge with existing metadata
      const { data: existingProspect } = await this.supabase
        .from('crm_prospects')
        .select('metadata')
        .eq('id', id)
        .single();

      dbData.metadata = {
        ...(existingProspect?.metadata || {}),
      };

      if ((data as any).meetLink !== undefined) {
        dbData.metadata.meet_link = (data as any).meetLink;
      }

      if (data.dateRdv !== undefined) {
        // Store full ISO datetime in metadata for accurate time retrieval
        dbData.metadata.rdv_datetime = data.dateRdv;
      }
    }

    const { data: result, error } = await this.supabase
      .from('crm_prospects')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapDbToProspect(result);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from('crm_prospects').delete().eq('id', id);
    if (error) throw error;
  }

  async updateStage(
    id: string,
    stage: string,
    _subtype?: 'plaquette' | 'rappel_differe'
  ): Promise<ProspectData> {
    // subtype is ignored in CRM mode for now
    // Could be used later to trigger CRM workflows
    return this.update(id, { stage });
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
      // Normalize qualification to uppercase for comparison
      const qual = (p.qualification || 'non_qualifie').toUpperCase();
      if (byQualification[qual] !== undefined) byQualification[qual]++;
      else byQualification['NON_QUALIFIE']++;

      const stage = p.stage || 'nouveau';
      if (byStage[stage] !== undefined) byStage[stage]++;
      else byStage['nouveau']++;
    });

    return { total: prospects.length, byQualification, byStage };
  }
}
