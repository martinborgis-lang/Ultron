import { logger } from '@/lib/logger';

import { IPlanningService, PlanningEvent, PlanningFilters } from '../interfaces';

/**
 * Service Planning pour le mode Google Sheet
 *
 * ⚠️  FONCTIONNALITÉ NON DISPONIBLE EN MODE SHEET
 * Les événements sont gérés directement via Google Calendar.
 * Pour utiliser la gestion de planning complète, activez le mode CRM.
 */
export class SheetPlanningService implements IPlanningService {
  constructor(
    private organizationId: string,
    private userId: string,
    private googleAccessToken?: string
  ) {}

  async getAll(filters?: PlanningFilters): Promise<PlanningEvent[]> {
    logger.debug('SheetPlanningService.getAll - Retour tableau vide (mode Sheet)');
    // En mode Sheet, les événements sont gérés directement dans Google Calendar
    return [];
  }

  async getById(id: string): Promise<PlanningEvent | null> {
    logger.debug('SheetPlanningService.getById - Mode Sheet non encore implemente');
    return null;
  }

  async create(event: Partial<PlanningEvent>): Promise<PlanningEvent> {
    logger.debug('SheetPlanningService.create - Création bloquée en mode Sheet');
    throw new Error(
      'La gestion du planning n\'est pas disponible en mode Google Sheet. ' +
      'Pour utiliser cette fonctionnalité, activez le mode CRM dans les paramètres.'
    );
  }

  async update(id: string, data: Partial<PlanningEvent>): Promise<PlanningEvent> {
    logger.debug('SheetPlanningService.update - Opération bloquée en mode Sheet');
    throw new Error(
      'La modification d\'événements n\'est pas disponible en mode Google Sheet. ' +
      'Activez le mode CRM pour utiliser cette fonctionnalité.'
    );
  }

  async delete(id: string): Promise<void> {
    logger.debug('SheetPlanningService.delete - Opération bloquée en mode Sheet');
    throw new Error(
      'La suppression d\'événements n\'est pas disponible en mode Google Sheet. ' +
      'Activez le mode CRM pour utiliser cette fonctionnalité.'
    );
  }

  async markComplete(id: string): Promise<PlanningEvent> {
    logger.debug('SheetPlanningService.markComplete - Opération bloquée en mode Sheet');
    throw new Error(
      'La gestion de statut des tâches n\'est pas disponible en mode Google Sheet. ' +
      'Activez le mode CRM pour utiliser cette fonctionnalité.'
    );
  }

  async markIncomplete(id: string): Promise<PlanningEvent> {
    logger.debug('SheetPlanningService.markIncomplete - Opération bloquée en mode Sheet');
    throw new Error(
      'La gestion de statut des tâches n\'est pas disponible en mode Google Sheet. ' +
      'Activez le mode CRM pour utiliser cette fonctionnalité.'
    );
  }

  async getByProspect(prospectId: string): Promise<PlanningEvent[]> {
    return [];
  }
}
