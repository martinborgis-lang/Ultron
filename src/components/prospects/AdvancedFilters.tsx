'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Filter, RotateCcw, ChevronDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export interface AdvancedFilters {
  patrimoineRange: [number, number];
  revenusRange: [number, number];
  ageRange: [number, number];
}

interface AdvancedFiltersComponentProps {
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  onReset: () => void;
  maxValues?: {
    maxPatrimoine: number;
    maxRevenus: number;
    maxAge: number;
  };
}

const DEFAULT_MAX_VALUES = {
  maxPatrimoine: 1000000, // 1M €
  maxRevenus: 200000, // 200k €
  maxAge: 80,
};

const DEFAULT_FILTERS: AdvancedFilters = {
  patrimoineRange: [0, DEFAULT_MAX_VALUES.maxPatrimoine],
  revenusRange: [0, DEFAULT_MAX_VALUES.maxRevenus],
  ageRange: [18, DEFAULT_MAX_VALUES.maxAge],
};

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M€`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k€`;
  }
  return `${value}€`;
}

export function AdvancedFiltersComponent({
  filters,
  onFiltersChange,
  onReset,
  maxValues = DEFAULT_MAX_VALUES,
}: AdvancedFiltersComponentProps) {
  const [open, setOpen] = useState(false);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.patrimoineRange[0] !== 0 ||
      filters.patrimoineRange[1] !== maxValues.maxPatrimoine ||
      filters.revenusRange[0] !== 0 ||
      filters.revenusRange[1] !== maxValues.maxRevenus ||
      filters.ageRange[0] !== 18 ||
      filters.ageRange[1] !== maxValues.maxAge
    );
  }, [filters, maxValues]);

  const handlePatrimoineChange = (values: number[]) => {
    onFiltersChange({
      ...filters,
      patrimoineRange: [values[0], values[1]],
    });
  };

  const handleRevenusChange = (values: number[]) => {
    onFiltersChange({
      ...filters,
      revenusRange: [values[0], values[1]],
    });
  };

  const handleAgeChange = (values: number[]) => {
    onFiltersChange({
      ...filters,
      ageRange: [values[0], values[1]],
    });
  };

  const handleReset = () => {
    onReset();
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`${
            hasActiveFilters()
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-900'
              : ''
          }`}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtres avancés
          {hasActiveFilters() && (
            <span className="ml-1 h-2 w-2 rounded-full bg-indigo-500 dark:bg-indigo-400" />
          )}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Filtres avancés</CardTitle>
              {hasActiveFilters() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Réinitialiser
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filtre Patrimoine */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Patrimoine estimé</Label>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(filters.patrimoineRange[0])} - {formatCurrency(filters.patrimoineRange[1])}
                </span>
              </div>
              <div className="px-2">
                <Slider
                  value={filters.patrimoineRange}
                  onValueChange={handlePatrimoineChange}
                  max={maxValues.maxPatrimoine}
                  min={0}
                  step={10000}
                  className="w-full [&_[data-slot=slider-range]]:bg-green-500 [&_[data-slot=slider-range]]:dark:bg-green-400 [&_[data-slot=slider-thumb]]:border-green-500 [&_[data-slot=slider-thumb]]:dark:border-green-400"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0€</span>
                  <span>{formatCurrency(maxValues.maxPatrimoine)}</span>
                </div>
              </div>
            </div>

            {/* Filtre Revenus */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Revenus annuels</Label>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(filters.revenusRange[0])} - {formatCurrency(filters.revenusRange[1])}
                </span>
              </div>
              <div className="px-2">
                <Slider
                  value={filters.revenusRange}
                  onValueChange={handleRevenusChange}
                  max={maxValues.maxRevenus}
                  min={0}
                  step={5000}
                  className="w-full [&_[data-slot=slider-range]]:bg-blue-500 [&_[data-slot=slider-range]]:dark:bg-blue-400 [&_[data-slot=slider-thumb]]:border-blue-500 [&_[data-slot=slider-thumb]]:dark:border-blue-400"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0€</span>
                  <span>{formatCurrency(maxValues.maxRevenus)}</span>
                </div>
              </div>
            </div>

            {/* Filtre Âge */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Âge</Label>
                <span className="text-sm text-muted-foreground">
                  {filters.ageRange[0]} - {filters.ageRange[1]} ans
                </span>
              </div>
              <div className="px-2">
                <Slider
                  value={filters.ageRange}
                  onValueChange={handleAgeChange}
                  max={maxValues.maxAge}
                  min={18}
                  step={1}
                  className="w-full [&_[data-slot=slider-range]]:bg-purple-500 [&_[data-slot=slider-range]]:dark:bg-purple-400 [&_[data-slot=slider-thumb]]:border-purple-500 [&_[data-slot=slider-thumb]]:dark:border-purple-400"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>18 ans</span>
                  <span>{maxValues.maxAge} ans</span>
                </div>
              </div>
            </div>

            {/* Info sur les résultats */}
            {hasActiveFilters() && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Les filtres avancés se cumulent avec la qualification (chaud/tiède/froid)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { DEFAULT_FILTERS };