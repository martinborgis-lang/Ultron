// Hook React pour la gestion de la pagination côté client
// Support pour offset-based et cursor-based pagination

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { PaginationParams, PaginatedResponse, CursorPaginatedResponse } from '@/lib/pagination/pagination-helper';

export interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSort?: string;
  initialOrder?: 'asc' | 'desc';
}

export interface PaginationState {
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
  cursor?: string;
}

export interface UsePaginationReturn {
  // État de la pagination
  paginationState: PaginationState;

  // Actions de navigation
  goToPage: (page: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;

  // Configuration
  setLimit: (limit: number) => void;
  setSort: (field: string, order?: 'asc' | 'desc') => void;

  // Reset
  reset: () => void;

  // Query string helpers
  getQueryParams: () => URLSearchParams;
  buildQueryString: () => string;

  // Pour cursor-based pagination
  setCursor: (cursor?: string) => void;

  // Utilitaires
  isFirstPage: boolean;
  canGoNext: (totalPages?: number) => boolean;
  canGoPrev: () => boolean;
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = 1,
    initialLimit = 20,
    initialSort = 'created_at',
    initialOrder = 'desc'
  } = options;

  const [paginationState, setPaginationState] = useState<PaginationState>({
    page: initialPage,
    limit: initialLimit,
    sort: initialSort,
    order: initialOrder
  });

  const goToPage = useCallback((page: number) => {
    setPaginationState(prev => ({
      ...prev,
      page: Math.max(1, page),
      cursor: undefined // Reset cursor lors d'un changement de page
    }));
  }, []);

  const goToFirstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const goToLastPage = useCallback((totalPages?: number) => {
    if (totalPages && totalPages > 0) {
      goToPage(totalPages);
    }
  }, [goToPage]);

  const goToNextPage = useCallback(() => {
    setPaginationState(prev => ({
      ...prev,
      page: prev.page + 1,
      cursor: undefined
    }));
  }, []);

  const goToPrevPage = useCallback(() => {
    setPaginationState(prev => ({
      ...prev,
      page: Math.max(1, prev.page - 1),
      cursor: undefined
    }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPaginationState(prev => ({
      ...prev,
      limit: Math.max(1, Math.min(limit, 100)), // Entre 1 et 100
      page: 1, // Reset à la page 1 lors du changement de limite
      cursor: undefined
    }));
  }, []);

  const setSort = useCallback((field: string, order: 'asc' | 'desc' = 'desc') => {
    setPaginationState(prev => ({
      ...prev,
      sort: field,
      order,
      page: 1, // Reset à la page 1 lors du changement de tri
      cursor: undefined
    }));
  }, []);

  const setCursor = useCallback((cursor?: string) => {
    setPaginationState(prev => ({
      ...prev,
      cursor
    }));
  }, []);

  const reset = useCallback(() => {
    setPaginationState({
      page: initialPage,
      limit: initialLimit,
      sort: initialSort,
      order: initialOrder
    });
  }, [initialPage, initialLimit, initialSort, initialOrder]);

  const getQueryParams = useCallback((): URLSearchParams => {
    const params = new URLSearchParams();
    params.set('page', paginationState.page.toString());
    params.set('limit', paginationState.limit.toString());
    params.set('sort', paginationState.sort);
    params.set('order', paginationState.order);

    if (paginationState.cursor) {
      params.set('cursor', paginationState.cursor);
    }

    return params;
  }, [paginationState]);

  const buildQueryString = useCallback((): string => {
    return getQueryParams().toString();
  }, [getQueryParams]);

  // États calculés
  const isFirstPage = paginationState.page <= 1;

  const canGoNext = useCallback((totalPages?: number): boolean => {
    if (totalPages !== undefined) {
      return paginationState.page < totalPages;
    }
    return true; // Par défaut, on assume qu'il pourrait y avoir une page suivante
  }, [paginationState.page]);

  const canGoPrev = useCallback((): boolean => {
    return paginationState.page > 1;
  }, [paginationState.page]);

  return {
    paginationState,
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPrevPage,
    setLimit,
    setSort,
    setCursor,
    reset,
    getQueryParams,
    buildQueryString,
    isFirstPage,
    canGoNext,
    canGoPrev
  };
}

// Hook pour les requêtes paginées avec fetch automatique
export interface UseApiPaginationOptions<T> extends UsePaginationOptions {
  apiUrl: string;
  additionalParams?: Record<string, string>;
  autoFetch?: boolean;
  dependencies?: any[]; // Dépendances pour re-fetch
}

export interface UseApiPaginationReturn<T> extends UsePaginationReturn {
  data: T[];
  isLoading: boolean;
  error: string | null;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  refetch: () => Promise<void>;
  meta: any;
}

export function useApiPagination<T = any>(
  options: UseApiPaginationOptions<T>
): UseApiPaginationReturn<T> {
  const {
    apiUrl,
    additionalParams = {},
    autoFetch = true,
    dependencies = [],
    ...paginationOptions
  } = options;

  const pagination = usePagination(paginationOptions);

  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [meta, setMeta] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const queryParams = pagination.getQueryParams();

      // Ajouter les paramètres additionnels
      Object.entries(additionalParams).forEach(([key, value]) => {
        if (value) {
          queryParams.set(key, value);
        }
      });

      const url = `${apiUrl}?${queryParams.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: PaginatedResponse<T> = await response.json();

      setData(result.data);
      setTotalItems(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
      setHasNextPage(result.pagination.hasNextPage);
      setHasPrevPage(result.pagination.hasPrevPage);
      setMeta(result.pagination);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, pagination.paginationState, additionalParams]);

  // Auto fetch lors des changements
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch, ...dependencies]);

  return {
    ...pagination,
    data,
    isLoading,
    error,
    totalItems,
    totalPages,
    hasNextPage,
    hasPrevPage,
    refetch: fetchData,
    meta
  };
}

// Hook spécialisé pour les prospects
export function useProspectsPagination(filters?: Record<string, string>) {
  return useApiPagination<any>({
    apiUrl: '/api/prospects/unified',
    additionalParams: filters,
    initialLimit: 20,
    initialSort: 'created_at',
    dependencies: [filters]
  });
}

// Hook spécialisé pour les activités
export function useActivitiesPagination(prospectId?: string) {
  return useApiPagination<any>({
    apiUrl: '/api/crm/activities',
    additionalParams: prospectId ? { prospect_id: prospectId } : {},
    initialLimit: 10,
    initialSort: 'created_at',
    dependencies: [prospectId]
  });
}

export default usePagination;