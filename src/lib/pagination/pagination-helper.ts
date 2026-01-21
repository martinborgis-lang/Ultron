// Système de pagination standardisé pour toutes les APIs
// Support pour cursor-based et offset-based pagination

export interface PaginationParams {
  page?: number;          // Page number (1-based)
  limit?: number;         // Items per page
  offset?: number;        // Skip items (alternative to page)
  sort?: string;          // Sort field
  order?: 'asc' | 'desc'; // Sort direction
  cursor?: string;        // Cursor for cursor-based pagination
}

export interface PaginationMeta {
  total: number;           // Total items
  page: number;           // Current page (1-based)
  limit: number;          // Items per page
  totalPages: number;     // Total pages
  hasNextPage: boolean;   // Has next page
  hasPrevPage: boolean;   // Has previous page
  nextPage?: number;      // Next page number
  prevPage?: number;      // Previous page number
  offset: number;         // Current offset
}

export interface CursorPaginationMeta {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextCursor?: string;
  prevCursor?: string;
  total?: number;         // Optional for performance
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  pagination: CursorPaginationMeta;
}

// Configuration par défaut
export const DEFAULT_PAGINATION_CONFIG = {
  defaultLimit: 20,
  maxLimit: 100,
  minLimit: 1,
  defaultPage: 1,
  defaultOrder: 'desc' as const
};

export class PaginationHelper {

  /**
   * Parse et valide les paramètres de pagination depuis les query params
   */
  static parseParams(searchParams: URLSearchParams): PaginationParams {
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(
      Math.max(
        parseInt(searchParams.get('limit') || String(DEFAULT_PAGINATION_CONFIG.defaultLimit)) || DEFAULT_PAGINATION_CONFIG.defaultLimit,
        DEFAULT_PAGINATION_CONFIG.minLimit
      ),
      DEFAULT_PAGINATION_CONFIG.maxLimit
    );
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0') || 0);
    const sort = searchParams.get('sort') || 'created_at';
    const order = (searchParams.get('order')?.toLowerCase() === 'asc') ? 'asc' : 'desc';
    const cursor = searchParams.get('cursor') || undefined;

    return {
      page,
      limit,
      offset: offset || ((page - 1) * limit), // Calculer offset depuis page si pas fourni
      sort,
      order,
      cursor
    };
  }

  /**
   * Génère les métadonnées de pagination
   */
  static generateMeta(
    total: number,
    currentPage: number,
    limit: number
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    const offset = (currentPage - 1) * limit;

    return {
      total,
      page: currentPage,
      limit,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      nextPage: currentPage < totalPages ? currentPage + 1 : undefined,
      prevPage: currentPage > 1 ? currentPage - 1 : undefined,
      offset
    };
  }

  /**
   * Génère les métadonnées pour cursor-based pagination
   */
  static generateCursorMeta(
    data: any[],
    limit: number,
    hasNext: boolean,
    hasPrev: boolean,
    getCursor: (item: any) => string,
    total?: number
  ): CursorPaginationMeta {
    const nextCursor = hasNext && data.length > 0
      ? getCursor(data[data.length - 1])
      : undefined;

    const prevCursor = hasPrev && data.length > 0
      ? getCursor(data[0])
      : undefined;

    return {
      hasNextPage: hasNext,
      hasPrevPage: hasPrev,
      nextCursor,
      prevCursor,
      total
    };
  }

  /**
   * Applique la pagination à une query Supabase
   */
  static applyToSupabaseQuery(
    query: any,
    params: PaginationParams,
    countQuery?: any
  ) {
    // Appliquer tri
    if (params.sort) {
      query = query.order(params.sort, { ascending: params.order === 'asc' });
    }

    // Appliquer pagination
    const offset = params.offset || 0;
    const limit = params.limit || DEFAULT_PAGINATION_CONFIG.defaultLimit;

    query = query.range(offset, offset + limit - 1);

    // Ajouter count si fourni
    if (countQuery) {
      query = query.select('*', { count: 'exact' });
    }

    return query;
  }

  /**
   * Valide les paramètres de tri
   */
  static validateSortField(field: string, allowedFields: string[]): string {
    if (!allowedFields.includes(field)) {
      return 'created_at'; // Fallback sécurisé
    }
    return field;
  }

  /**
   * Crée une réponse paginée standardisée
   */
  static createResponse<T>(
    data: T[],
    total: number,
    params: PaginationParams
  ): PaginatedResponse<T> {
    const page = params.page || Math.floor((params.offset || 0) / (params.limit || DEFAULT_PAGINATION_CONFIG.defaultLimit)) + 1;
    const limit = params.limit || DEFAULT_PAGINATION_CONFIG.defaultLimit;

    return {
      data,
      pagination: this.generateMeta(total, page, limit)
    };
  }

  /**
   * Crée une réponse avec cursor-based pagination
   */
  static createCursorResponse<T>(
    data: T[],
    limit: number,
    hasNext: boolean,
    hasPrev: boolean,
    getCursor: (item: T) => string,
    total?: number
  ): CursorPaginatedResponse<T> {
    return {
      data,
      pagination: this.generateCursorMeta(data, limit, hasNext, hasPrev, getCursor, total)
    };
  }

  /**
   * Génère des liens de navigation (pour APIs REST)
   */
  static generateLinks(
    baseUrl: string,
    meta: PaginationMeta,
    queryParams: Record<string, string> = {}
  ): {
    first?: string;
    prev?: string;
    next?: string;
    last?: string;
  } {
    const createUrl = (page: number) => {
      const params = new URLSearchParams({
        ...queryParams,
        page: page.toString(),
        limit: meta.limit.toString()
      });
      return `${baseUrl}?${params.toString()}`;
    };

    const links: any = {};

    if (meta.page > 1) {
      links.first = createUrl(1);
    }

    if (meta.hasPrevPage && meta.prevPage) {
      links.prev = createUrl(meta.prevPage);
    }

    if (meta.hasNextPage && meta.nextPage) {
      links.next = createUrl(meta.nextPage);
    }

    if (meta.totalPages > 1 && meta.page < meta.totalPages) {
      links.last = createUrl(meta.totalPages);
    }

    return links;
  }

  /**
   * Applique la pagination en mémoire (pour les services Sheet ou données déjà chargées)
   */
  static paginateInMemory<T>(
    data: T[],
    params: PaginationParams
  ): PaginatedResponse<T> {
    const offset = params.offset || 0;
    const limit = params.limit || DEFAULT_PAGINATION_CONFIG.defaultLimit;

    const paginatedData = data.slice(offset, offset + limit);

    return this.createResponse(paginatedData, data.length, params);
  }

  /**
   * Utilitaire pour créer des cursors basés sur timestamp + ID
   */
  static createTimestampCursor(timestamp: string, id: string): string {
    return Buffer.from(`${timestamp}:${id}`).toString('base64');
  }

  /**
   * Utilitaire pour parser des cursors basés sur timestamp + ID
   */
  static parseTimestampCursor(cursor: string): { timestamp: string; id: string } | null {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      const [timestamp, id] = decoded.split(':');
      if (!timestamp || !id) return null;
      return { timestamp, id };
    } catch {
      return null;
    }
  }
}

// Types pour les filtres de tri sécurisés
export const COMMON_SORT_FIELDS = {
  PROSPECTS: ['created_at', 'updated_at', 'first_name', 'last_name', 'email', 'score_ia'] as const,
  ACTIVITIES: ['created_at', 'type', 'subject'] as const,
  TASKS: ['created_at', 'due_date', 'priority'] as const,
  EVENTS: ['start_date', 'end_date', 'created_at'] as const,
  EMAILS: ['sent_at', 'subject'] as const
} as const;

export type ProspectSortField = typeof COMMON_SORT_FIELDS.PROSPECTS[number];
export type ActivitySortField = typeof COMMON_SORT_FIELDS.ACTIVITIES[number];
export type TaskSortField = typeof COMMON_SORT_FIELDS.TASKS[number];

// Export par défaut
export default PaginationHelper;