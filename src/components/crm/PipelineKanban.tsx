'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { PipelineStage, CrmProspect } from '@/types/crm';
import { PipelineColumn } from './PipelineColumn';
import { ProspectCard } from './ProspectCard';
import { useToast } from '@/hooks/use-toast';

interface PipelineKanbanProps {
  stages: PipelineStage[];
  prospects: CrmProspect[];
  onProspectClick: (prospect: CrmProspect) => void;
  onProspectMove: (
    prospectId: string,
    newStageSlug: string,
    subtype?: 'plaquette' | 'rappel_differe'
  ) => Promise<void>;
  onWaitingDrop?: (prospectId: string, prospectName: string) => void;
}

// Slugs qui déclenchent la modale "En attente"
// Supporte les deux formats (CRM et Sheet)
const WAITING_STAGE_SLUGS = ['en_attente', 'contacte', 'a_rappeler'];

export function PipelineKanban({
  stages,
  prospects,
  onProspectClick,
  onProspectMove,
  onWaitingDrop,
}: PipelineKanbanProps) {
  const [activeProspect, setActiveProspect] = useState<CrmProspect | null>(null);
  const [localProspects, setLocalProspects] = useState(prospects);
  const { toast } = useToast();

  // Create a Set of valid stage slugs for quick lookup
  const validStageSlugs = new Set(stages.map(s => s.slug));

  useEffect(() => {
    setLocalProspects(prospects);
  }, [prospects]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const prospect = localProspects.find((p) => p.id === event.active.id);
    if (prospect) {
      setActiveProspect(prospect);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProspect(null);

    // If dropped outside any droppable area, cancel
    if (!over) {
      console.log('Drop cancelled - no target');
      return;
    }

    const prospectId = active.id as string;
    const targetId = over.id as string;

    // CRITICAL: Check if targetId is a valid stage slug
    // If not (e.g., it's a prospect UUID), find the stage from the drop target's data
    let newStageSlug: string;

    if (validStageSlugs.has(targetId)) {
      // Dropped directly on a column
      newStageSlug = targetId;
    } else {
      // Dropped on a card - find which column that card belongs to
      const targetProspect = localProspects.find(p => p.id === targetId);
      if (targetProspect) {
        newStageSlug = targetProspect.stage_slug;
        console.log('Dropped on card, using card stage:', newStageSlug);
      } else {
        // Unknown target, cancel
        console.log('Drop cancelled - unknown target:', targetId);
        return;
      }
    }

    const prospect = localProspects.find((p) => p.id === prospectId);

    if (!prospect) {
      console.error('Prospect not found:', prospectId);
      return;
    }

    // Same stage - no change needed
    if (prospect.stage_slug === newStageSlug) {
      console.log('Same stage, no change');
      return;
    }

    console.log('Moving prospect:', {
      from: prospect.stage_slug,
      to: newStageSlug,
      isWaitingStage: WAITING_STAGE_SLUGS.includes(newStageSlug),
    });

    // Check if this is a "waiting" stage that should trigger the modal
    if (WAITING_STAGE_SLUGS.includes(newStageSlug) && onWaitingDrop) {
      const prospectName = [prospect.first_name, prospect.last_name]
        .filter(Boolean)
        .join(' ') || 'Ce prospect';

      console.log('Opening waiting modal for:', prospectName);
      onWaitingDrop(prospectId, prospectName);
      return;
    }

    // Optimistic update
    const previousStage = prospect.stage_slug;
    setLocalProspects((prev) =>
      prev.map((p) =>
        p.id === prospectId ? { ...p, stage_slug: newStageSlug } : p
      )
    );

    try {
      await onProspectMove(prospectId, newStageSlug);

      const newStage = stages.find((s) => s.slug === newStageSlug);
      toast({
        title: 'Prospect déplacé',
        description: `${prospect.first_name || ''} ${prospect.last_name || ''} → ${newStage?.name || newStageSlug}`,
      });
    } catch (error) {
      console.error('Error moving prospect:', error);

      // Rollback
      setLocalProspects((prev) =>
        prev.map((p) =>
          p.id === prospectId ? { ...p, stage_slug: previousStage } : p
        )
      );

      toast({
        title: 'Erreur',
        description: 'Impossible de déplacer le prospect',
        variant: 'destructive',
      });
    }
  };

  // Group prospects by stage
  const prospectsByStage = stages.reduce(
    (acc, stage) => {
      acc[stage.slug] = localProspects.filter((p) => p.stage_slug === stage.slug);
      return acc;
    },
    {} as Record<string, CrmProspect[]>
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)]">
        {stages.map((stage) => (
          <PipelineColumn
            key={stage.id}
            stage={stage}
            prospects={prospectsByStage[stage.slug] || []}
            onProspectClick={onProspectClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeProspect && (
          <div className="rotate-3 scale-105">
            <ProspectCard prospect={activeProspect} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
