import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, MoreHorizontal, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  showSizeChanger?: boolean;
  onPageSizeChange?: (size: number) => void;
  className?: string;
  showInfo?: boolean;
  loading?: boolean;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  showSizeChanger = true,
  onPageSizeChange,
  className = "",
  showInfo = true,
  loading = false
}: PaginationProps) {

  // Générer les pages visibles (avec ellipsis)
  const getVisiblePages = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Afficher toutes les pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logique avec ellipsis
      if (currentPage <= 4) {
        // Début: 1 2 3 4 5 ... 10
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Fin: 1 ... 6 7 8 9 10
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        // Milieu: 1 ... 4 5 6 ... 10
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const visiblePages = getVisiblePages();
  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Handlers avec protection contre les appels multiples
  const handlePageChange = (page: number) => {
    if (!loading && page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (newSize: string) => {
    if (!loading && onPageSizeChange) {
      onPageSizeChange(parseInt(newSize));
    }
  };

  if (totalPages <= 1 && !showSizeChanger) {
    return null; // Pas besoin de pagination pour 1 page ou moins
  }

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      {/* Info et sélecteur taille de page */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {showInfo && totalItems > 0 && (
          <span className="whitespace-nowrap">
            {startItem}-{endItem} sur {totalItems.toLocaleString()}
          </span>
        )}

        {showSizeChanger && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap hidden sm:inline">Éléments par page :</span>
            <Select
              value={pageSize.toString()}
              onValueChange={handlePageSizeChange}
              disabled={loading}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Contrôles navigation */}
      <div className="flex items-center gap-1">
        {/* Première page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={loading || currentPage === 1}
          className="h-8 w-8 p-0 hidden sm:inline-flex"
          title="Première page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Page précédente */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={loading || currentPage <= 1}
          className="h-8 w-8 p-0"
          title="Page précédente"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Pages numériques */}
        {visiblePages.map((page, index) => (
          page === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-2 py-1 text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(page as number)}
              disabled={loading}
              className={cn(
                "h-8 min-w-8",
                currentPage === page && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {page}
            </Button>
          )
        ))}

        {/* Page suivante */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={loading || currentPage >= totalPages}
          className="h-8 w-8 p-0"
          title="Page suivante"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Dernière page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(totalPages)}
          disabled={loading || currentPage === totalPages}
          className="h-8 w-8 p-0 hidden sm:inline-flex"
          title="Dernière page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Hook personnalisé pour gérer l'état de pagination
export function usePagination(initialPageSize = 20) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(initialPageSize);
  const [loading, setLoading] = React.useState(false);

  const handlePageChange = React.useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = React.useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset à la page 1 lors du changement de taille
  }, []);

  const resetPagination = React.useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    pageSize,
    loading,
    setLoading,
    handlePageChange,
    handlePageSizeChange,
    resetPagination
  };
}

export default Pagination;