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

    if (!over) return;

    const prospectId = active.id as string;
    const newStageSlug = over.id as string;

    const prospect = localProspects.find((p) => p.id === prospectId);
    if (!prospect || prospect.stage_slug === newStageSlug) return;

    // Special handling for "en_attente" stage - show modal first
    if (newStageSlug === 'en_attente' && onWaitingDrop) {
      const prospectName = [prospect.first_name, prospect.last_name]
        .filter(Boolean)
        .join(' ') || 'Ce prospect';
      onWaitingDrop(prospectId, prospectName);
      return;
    }

    // Optimistic update for other stages
    setLocalProspects((prev) =>
      prev.map((p) =>
        p.id === prospectId ? { ...p, stage_slug: newStageSlug } : p
      )
    );

    try {
      await onProspectMove(prospectId, newStageSlug);

      const newStage = stages.find((s) => s.slug === newStageSlug);
      toast({
        title: 'Prospect deplace',
        description: `${prospect.first_name} ${prospect.last_name} -> ${newStage?.name}`,
      });
    } catch (error) {
      // Rollback on error
      setLocalProspects(prospects);
      toast({
        title: 'Erreur',
        description: 'Impossible de deplacer le prospect',
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
