'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { PipelineStage, CrmProspect } from '@/types/crm';
import { DraggableProspectCard } from './ProspectCard';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PipelineColumnProps {
  stage: PipelineStage & { prospects_count?: number };
  prospects: CrmProspect[];
  onProspectClick: (prospect: CrmProspect) => void;
  columnIndex?: number;
}

// Animation variants for columns
const columnVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  }),
};

const emptyStateVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 },
  },
};

export function PipelineColumn({ stage, prospects, onProspectClick, columnIndex = 0 }: PipelineColumnProps) {
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
    <motion.div
      ref={setNodeRef}
      custom={columnIndex}
      initial="hidden"
      animate="visible"
      variants={columnVariants}
      className={cn(
        'flex flex-col w-72 flex-shrink-0 bg-muted/30 rounded-lg transition-all duration-200',
        isOver && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02] shadow-lg'
      )}
    >
      {/* Header */}
      <motion.div
        className="p-3 border-b border-border"
        style={{ borderTopColor: stage.color, borderTopWidth: '3px', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem' }}
        whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{stage.name}</span>
            <motion.span
              key={prospects.length}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
            >
              {prospects.length}
            </motion.span>
          </div>
          {stage.is_won && (
            <span className="text-green-500 text-xs font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Gagne
            </span>
          )}
          {stage.is_lost && (
            <span className="text-red-500 text-xs font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Perdu
            </span>
          )}
        </div>
        {totalValue > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Total: <span className="font-medium text-foreground">{formatValue(totalValue)} €</span>
          </p>
        )}
      </motion.div>

      {/* Prospects List */}
      <ScrollArea className="flex-1 p-2">
        <SortableContext items={prospects.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 min-h-[100px]">
            <AnimatePresence mode="popLayout">
              {prospects.map((prospect, index) => (
                <DraggableProspectCard
                  key={prospect.id}
                  prospect={prospect}
                  onClick={() => onProspectClick(prospect)}
                  index={index}
                />
              ))}
            </AnimatePresence>
            {prospects.length === 0 && (
              <motion.div
                variants={emptyStateVariants}
                initial="hidden"
                animate="visible"
                className="h-24 flex items-center justify-center text-sm text-muted-foreground border-2 border-dashed border-muted rounded-lg"
              >
                Aucun prospect
              </motion.div>
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </motion.div>
  );
}
