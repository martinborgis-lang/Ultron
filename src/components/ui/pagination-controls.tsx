'use client';

// Composant de pagination réutilisable avec design shadcn/ui
// Support pour différents styles de pagination

import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal
} from 'lucide-react';
import type { PaginationMeta } from '@/lib/pagination/pagination-helper';

export interface PaginationControlsProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  showLimitSelector?: boolean;
  showPageNumbers?: boolean;
  showGoToPage?: boolean;
  showInfo?: boolean;
  className?: string;
  limitOptions?: number[];
  maxVisiblePages?: number;
}

export function PaginationControls({
  pagination,
  onPageChange,
  onLimitChange,
  showLimitSelector = true,
  showPageNumbers = true,
  showGoToPage = false,
  showInfo = true,
  className = '',
  limitOptions = [10, 20, 50, 100],
  maxVisiblePages = 7
}: PaginationControlsProps) {

  const {
    page,
    totalPages,
    hasNextPage,
    hasPrevPage,
    total,
    limit,
    offset
  } = pagination;

  // Calcul des numéros de pages à afficher
  const getVisiblePages = (): (number | 'ellipsis')[] => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);

    // Toujours afficher la première page
    pages.push(1);

    let startPage = Math.max(2, page - halfVisible);
    let endPage = Math.min(totalPages - 1, page + halfVisible);

    // Ajuster si on est proche du début
    if (page <= halfVisible + 1) {
      endPage = Math.min(totalPages - 1, maxVisiblePages - 1);
    }

    // Ajuster si on est proche de la fin
    if (page >= totalPages - halfVisible) {
      startPage = Math.max(2, totalPages - maxVisiblePages + 2);
    }

    // Ajouter ellipsis si nécessaire
    if (startPage > 2) {
      pages.push('ellipsis');
    }

    // Ajouter les pages du milieu
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Ajouter ellipsis si nécessaire
    if (endPage < totalPages - 1) {
      pages.push('ellipsis');
    }

    // Toujours afficher la dernière page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const handlePageInput = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const target = event.target as HTMLInputElement;
      const pageNum = parseInt(target.value);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        onPageChange(pageNum);
        target.value = '';
      }
    }
  };

  if (totalPages <= 1) {
    return null; // Ne pas afficher la pagination s'il n'y a qu'une page
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>

      {/* Informations */}
      {showInfo && (
        <div className="text-sm text-muted-foreground">
          Affichage de {offset + 1} à {Math.min(offset + limit, total)} sur {total} éléments
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">

        {/* Sélecteur de limite */}
        {showLimitSelector && onLimitChange && (
          <div className="flex items-center gap-2">
            <Label htmlFor="limit-select" className="text-sm">
              Éléments par page:
            </Label>
            <Select
              value={limit.toString()}
              onValueChange={(value) => onLimitChange(parseInt(value))}
            >
              <SelectTrigger id="limit-select" className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {limitOptions.map(option => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Contrôles de navigation */}
        <div className="flex items-center gap-2">

          {/* Première page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={!hasPrevPage}
            aria-label="Première page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Page précédente */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrevPage}
            aria-label="Page précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Numéros de pages */}
          {showPageNumbers && (
            <div className="flex items-center gap-1">
              {getVisiblePages().map((pageNum, index) => (
                pageNum === 'ellipsis' ? (
                  <div key={`ellipsis-${index}`} className="px-2">
                    <MoreHorizontal className="h-4 w-4" />
                  </div>
                ) : (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="min-w-8"
                  >
                    {pageNum}
                  </Button>
                )
              ))}
            </div>
          )}

          {/* Page suivante */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNextPage}
            aria-label="Page suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Dernière page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={!hasNextPage}
            aria-label="Dernière page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Aller à la page */}
        {showGoToPage && (
          <div className="flex items-center gap-2">
            <Label htmlFor="goto-page" className="text-sm">
              Aller à la page:
            </Label>
            <Input
              id="goto-page"
              type="number"
              min={1}
              max={totalPages}
              placeholder={page.toString()}
              onKeyDown={handlePageInput}
              className="w-20"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Composant simple pour pagination basique
export function SimplePagination({
  pagination,
  onPageChange,
  className = ''
}: Pick<PaginationControlsProps, 'pagination' | 'onPageChange' | 'className'>) {
  return (
    <PaginationControls
      pagination={pagination}
      onPageChange={onPageChange}
      showLimitSelector={false}
      showPageNumbers={false}
      showGoToPage={false}
      showInfo={false}
      className={className}
    />
  );
}

// Composant compact pour mobile
export function MobilePagination({
  pagination,
  onPageChange,
  onLimitChange,
  className = ''
}: Pick<PaginationControlsProps, 'pagination' | 'onPageChange' | 'onLimitChange' | 'className'>) {
  const { page, totalPages, hasNextPage, hasPrevPage, total, offset, limit } = pagination;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>

      {/* Info compact */}
      <div className="text-sm text-muted-foreground text-center">
        Page {page} sur {totalPages} ({total} éléments)
      </div>

      {/* Navigation simple */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Précédent
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{page}</span>
          <span className="text-sm text-muted-foreground">/ {totalPages}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
        >
          Suivant
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Limite si fournie */}
      {onLimitChange && (
        <Select
          value={limit.toString()}
          onValueChange={(value) => onLimitChange(parseInt(value))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 par page</SelectItem>
            <SelectItem value="20">20 par page</SelectItem>
            <SelectItem value="50">50 par page</SelectItem>
            <SelectItem value="100">100 par page</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export default PaginationControls;