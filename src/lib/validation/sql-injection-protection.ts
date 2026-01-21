// Protection contre les injections SQL
// Validation et sanitization des inputs utilisateur

export const ALLOWED_STAGES = [
  'nouveau',
  'en_attente',
  'contacte',
  'rdv_pris',
  'rdv_effectue',
  'proposition',
  'negociation',
  'gagne',
  'perdu'
] as const;

export const ALLOWED_QUALIFICATIONS = [
  'CHAUD',
  'TIEDE',
  'FROID',
  'non_qualifie'
] as const;

export const ALLOWED_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'first_name',
  'last_name',
  'email',
  'deal_value',
  'score_ia'
] as const;

export type AllowedStage = typeof ALLOWED_STAGES[number];
export type AllowedQualification = typeof ALLOWED_QUALIFICATIONS[number];
export type AllowedSortField = typeof ALLOWED_SORT_FIELDS[number];

export interface SafeFilters {
  search?: string;
  stage?: AllowedStage;
  qualification?: AllowedQualification;
  stages?: AllowedStage[];
  qualifications?: AllowedQualification[];
  assigned_to?: string;
  limit?: number;
  offset?: number;
  sort_field?: AllowedSortField;
  sort_order?: 'asc' | 'desc';
}

export class SQLInjectionProtection {

  /**
   * Valide et sanitise une chaîne de recherche
   * Supprime les caractères dangereux et limite la longueur
   */
  static sanitizeSearch(search: string | null): string | undefined {
    if (!search) return undefined;

    // Supprimer les caractères SQL dangereux
    const sanitized = search
      .replace(/['"`;\\]/g, '') // Enlever quotes, semicolons, backslashes
      .replace(/--/g, '')       // Enlever commentaires SQL
      .replace(/\/\*/g, '')     // Enlever commentaires multilignes
      .replace(/\*\//g, '')
      .replace(/\bUNION\b/gi, '') // Enlever UNION attacks
      .replace(/\bSELECT\b/gi, '')
      .replace(/\bINSERT\b/gi, '')
      .replace(/\bUPDATE\b/gi, '')
      .replace(/\bDELETE\b/gi, '')
      .replace(/\bDROP\b/gi, '')
      .replace(/\bALTER\b/gi, '')
      .trim();

    // Limiter la longueur
    if (sanitized.length > 100) {
      return sanitized.substring(0, 100);
    }

    return sanitized.length > 0 ? sanitized : undefined;
  }

  /**
   * Valide un stage contre la whitelist
   */
  static validateStage(stage: string | null): AllowedStage | undefined {
    if (!stage) return undefined;
    return ALLOWED_STAGES.includes(stage as AllowedStage)
      ? stage as AllowedStage
      : undefined;
  }

  /**
   * Valide une qualification contre la whitelist
   */
  static validateQualification(qualification: string | null): AllowedQualification | undefined {
    if (!qualification) return undefined;
    return ALLOWED_QUALIFICATIONS.includes(qualification as AllowedQualification)
      ? qualification as AllowedQualification
      : undefined;
  }

  /**
   * Valide un UUID
   */
  static validateUUID(uuid: string | null): string | undefined {
    if (!uuid) return undefined;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid) ? uuid : undefined;
  }

  /**
   * Valide un array de stages
   */
  static validateStages(stages: string[]): AllowedStage[] {
    if (!Array.isArray(stages)) return [];

    return stages
      .filter((stage): stage is AllowedStage =>
        ALLOWED_STAGES.includes(stage as AllowedStage)
      );
  }

  /**
   * Valide un array de qualifications
   */
  static validateQualifications(qualifications: string[]): AllowedQualification[] {
    if (!Array.isArray(qualifications)) return [];

    return qualifications
      .filter((qual): qual is AllowedQualification =>
        ALLOWED_QUALIFICATIONS.includes(qual as AllowedQualification)
      );
  }

  /**
   * Valide et sanitise les paramètres de pagination
   */
  static validatePagination(limit: string | null, offset: string | null): { limit: number; offset: number } {
    const parsedLimit = limit ? parseInt(limit) : 50;
    const parsedOffset = offset ? parseInt(offset) : 0;

    return {
      limit: Math.min(Math.max(parsedLimit, 1), 200), // Entre 1 et 200
      offset: Math.max(parsedOffset, 0) // Minimum 0
    };
  }

  /**
   * Valide le champ de tri
   */
  static validateSortField(field: string | null): AllowedSortField {
    if (!field) return 'created_at';
    return ALLOWED_SORT_FIELDS.includes(field as AllowedSortField)
      ? field as AllowedSortField
      : 'created_at';
  }

  /**
   * Valide l'ordre de tri
   */
  static validateSortOrder(order: string | null): 'asc' | 'desc' {
    return order === 'asc' || order === 'desc' ? order : 'desc';
  }

  /**
   * Fonction principale pour valider tous les filtres d'une requête
   */
  static validateFilters(searchParams: URLSearchParams): SafeFilters {
    const search = this.sanitizeSearch(searchParams.get('search'));
    const stage = this.validateStage(searchParams.get('stage'));
    const qualification = this.validateQualification(searchParams.get('qualification'));
    const stages = this.validateStages(searchParams.getAll('stage'));
    const qualifications = this.validateQualifications(searchParams.getAll('qualification'));
    const assigned_to = this.validateUUID(searchParams.get('assigned_to'));

    const { limit, offset } = this.validatePagination(
      searchParams.get('limit'),
      searchParams.get('offset')
    );

    const sort_field = this.validateSortField(searchParams.get('sort_field'));
    const sort_order = this.validateSortOrder(searchParams.get('sort_order'));

    return {
      search,
      stage,
      qualification,
      stages: stages.length > 0 ? stages : undefined,
      qualifications: qualifications.length > 0 ? qualifications : undefined,
      assigned_to,
      limit,
      offset,
      sort_field,
      sort_order
    };
  }

  /**
   * Échappe les caractères spéciaux pour LIKE/ILIKE
   * Utilise l'échappement PostgreSQL
   */
  static escapeLikePattern(pattern: string): string {
    return pattern
      .replace(/\\/g, '\\\\')  // Échapper les backslashes
      .replace(/%/g, '\\%')    // Échapper les wildcards %
      .replace(/_/g, '\\_');   // Échapper les wildcards _
  }

  /**
   * Crée un pattern de recherche sécurisé pour ILIKE
   */
  static createSafeSearchPattern(search: string): string {
    const sanitized = this.sanitizeSearch(search);
    if (!sanitized) return '';

    const escaped = this.escapeLikePattern(sanitized);
    return `%${escaped}%`;
  }
}

// Helpers pour une utilisation facile
export function sanitizeSearch(search: string | null): string | undefined {
  return SQLInjectionProtection.sanitizeSearch(search);
}

export function validateStage(stage: string | null): AllowedStage | undefined {
  return SQLInjectionProtection.validateStage(stage);
}

export function validateQualification(qualification: string | null): AllowedQualification | undefined {
  return SQLInjectionProtection.validateQualification(qualification);
}

export function validateUUID(uuid: string | null): string | undefined {
  return SQLInjectionProtection.validateUUID(uuid);
}

export function validateFilters(searchParams: URLSearchParams): SafeFilters {
  return SQLInjectionProtection.validateFilters(searchParams);
}

export function createSafeSearchPattern(search: string): string {
  return SQLInjectionProtection.createSafeSearchPattern(search);
}