// ============================================
// PROSPECT INTERFACE
// ============================================
export interface ProspectData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  source?: string;
  age?: number;
  situationPro?: string;
  revenusMensuels?: number;
  patrimoine?: number;
  besoins?: string;
  notesAppel?: string;

  // Pipeline
  stage: string;
  qualification: 'CHAUD' | 'TIEDE' | 'FROID' | 'NON_QUALIFIE' | null;
  scoreIa?: number;
  justificationIa?: string;

  // RDV
  dateRdv?: string;
  rappelSouhaite?: string;

  // Emails envoyes
  mailPlaquetteEnvoye?: boolean;
  mailSyntheseEnvoye?: boolean;
  mailRappelEnvoye?: boolean;

  // Metadata
  emailConseiller?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt?: string;

  // Sheet-specific (pour le drag & drop)
  rowNumber?: number;
}

export interface ProspectFilters {
  stage?: string;
  qualification?: string;
  search?: string;
  assignedTo?: string;
}

export interface IProspectService {
  getAll(filters?: ProspectFilters): Promise<ProspectData[]>;
  getById(id: string): Promise<ProspectData | null>;
  create(data: Partial<ProspectData>): Promise<ProspectData>;
  update(id: string, data: Partial<ProspectData>): Promise<ProspectData>;
  delete(id: string): Promise<void>;
  updateStage(
    id: string,
    stage: string,
    subtype?: 'plaquette' | 'rappel_differe'
  ): Promise<ProspectData>;
  getByStage(): Promise<Record<string, ProspectData[]>>;
  getStats(): Promise<{
    total: number;
    byQualification: Record<string, number>;
    byStage: Record<string, number>;
  }>;
}

// ============================================
// PLANNING/EVENTS INTERFACE
// ============================================
export interface PlanningEvent {
  id: string;
  type: 'task' | 'call' | 'meeting' | 'reminder' | 'email';
  title: string;
  description?: string;

  startDate?: string;
  endDate?: string;
  dueDate?: string;
  allDay: boolean;

  status: 'pending' | 'completed' | 'cancelled';
  completedAt?: string;

  prospectId?: string;
  prospectName?: string;
  assignedTo?: string;
  assignedToName?: string;

  priority: 'low' | 'medium' | 'high' | 'urgent';
  externalId?: string;
  meetLink?: string; // Google Meet link
  calendarLink?: string; // Google Calendar event link
  createdAt: string;
}

export interface PlanningFilters {
  filter?: 'all' | 'today' | 'overdue' | 'upcoming';
  prospectId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export interface IPlanningService {
  getAll(filters?: PlanningFilters): Promise<PlanningEvent[]>;
  getById(id: string): Promise<PlanningEvent | null>;
  create(event: Partial<PlanningEvent>): Promise<PlanningEvent>;
  update(id: string, data: Partial<PlanningEvent>): Promise<PlanningEvent>;
  delete(id: string): Promise<void>;
  markComplete(id: string): Promise<PlanningEvent>;
  markIncomplete(id: string): Promise<PlanningEvent>;
  getByProspect(prospectId: string): Promise<PlanningEvent[]>;
}

// ============================================
// ORGANIZATION WITH MODE
// ============================================
export interface Organization {
  id: string;
  name: string;
  data_mode: 'sheet' | 'crm';
  google_sheet_id?: string;
  google_credentials?: Record<string, unknown>;
}
