import { IPlanningService, PlanningEvent, PlanningFilters } from '../interfaces';

/**
 * Service Planning pour le mode Google Sheet
 * Lit les evenements depuis Google Calendar de l'utilisateur
 *
 * TODO: Implementer avec Google Calendar API
 * Pour l'instant, retourne des donnees vides
 */
export class SheetPlanningService implements IPlanningService {
  constructor(
    private organizationId: string,
    private userId: string,
    private googleAccessToken?: string
  ) {}

  async getAll(filters?: PlanningFilters): Promise<PlanningEvent[]> {
    // TODO: Implementer avec Google Calendar API
    // Pour l'instant, on retourne un tableau vide
    console.log('SheetPlanningService.getAll - Mode Sheet non encore implemente');
    return [];
  }

  async getById(id: string): Promise<PlanningEvent | null> {
    console.log('SheetPlanningService.getById - Mode Sheet non encore implemente');
    return null;
  }

  async create(event: Partial<PlanningEvent>): Promise<PlanningEvent> {
    // TODO: Creer un evenement dans Google Calendar
    console.log('SheetPlanningService.create - Mode Sheet non encore implemente');
    throw new Error("Mode Sheet non encore implemente pour la creation d'evenements");
  }

  async update(id: string, data: Partial<PlanningEvent>): Promise<PlanningEvent> {
    console.log('SheetPlanningService.update - Mode Sheet non encore implemente');
    throw new Error('Mode Sheet non encore implemente');
  }

  async delete(id: string): Promise<void> {
    console.log('SheetPlanningService.delete - Mode Sheet non encore implemente');
    throw new Error('Mode Sheet non encore implemente');
  }

  async markComplete(id: string): Promise<PlanningEvent> {
    console.log('SheetPlanningService.markComplete - Mode Sheet non encore implemente');
    throw new Error('Mode Sheet non encore implemente');
  }

  async markIncomplete(id: string): Promise<PlanningEvent> {
    console.log('SheetPlanningService.markIncomplete - Mode Sheet non encore implemente');
    throw new Error('Mode Sheet non encore implemente');
  }

  async getByProspect(prospectId: string): Promise<PlanningEvent[]> {
    return [];
  }
}
