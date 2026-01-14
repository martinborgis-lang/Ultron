'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { PipelineStage, CrmProspect } from '@/types/crm';
import { DraggableProspectCard } from './ProspectCard';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PipelineColumnProps {
  stage: PipelineStage & { prospects_count?: number };
  prospects: CrmProspect[];
  onProspectClick: (prospect: CrmProspect) => void;
}

export function PipelineColumn({ stage, prospects, onProspectClick }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.slug,
  });

  const totalValue = prospects.reduce((sum, p) => sum + (p.deal_value || 0), 0);
  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return `${value}`;
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-72 flex-shrink-0 bg-muted/30 rounded-lg',
        isOver && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      {/* Header */}
      <div
        className="p-3 border-b border-border"
        style={{ borderTopColor: stage.color, borderTopWidth: '3px', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{stage.name}</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {prospects.length}
            </span>
          </div>
          {stage.is_won && <span className="text-green-500 text-xs">Gagne</span>}
          {stage.is_lost && <span className="text-red-500 text-xs">Perdu</span>}
        </div>
        {totalValue > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Total: <span className="font-medium text-foreground">{formatValue(totalValue)}</span>
          </p>
        )}
      </div>

      {/* Prospects List */}
      <ScrollArea className="flex-1 p-2">
        <SortableContext items={prospects.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 min-h-[100px]">
            {prospects.map((prospect) => (
              <DraggableProspectCard
                key={prospect.id}
                prospect={prospect}
                onClick={() => onProspectClick(prospect)}
              />
            ))}
            {prospects.length === 0 && (
              <div className="h-24 flex items-center justify-center text-sm text-muted-foreground border-2 border-dashed border-muted rounded-lg">
                Aucun prospect
              </div>
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}
