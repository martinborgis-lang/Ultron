'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PipelineKanban } from '@/components/crm/PipelineKanban';
import { ProspectForm } from '@/components/crm/ProspectForm';
import { WaitingReasonModal } from '@/components/crm/WaitingReasonModal';
import { PipelineStage, CrmProspect } from '@/types/crm';
import { UnifiedStage } from '@/types/pipeline';
import { ProspectData } from '@/lib/services/interfaces';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// Adapter: Convert UnifiedStage to PipelineStage format for existing components
function unifiedStageToPipelineStage(stage: UnifiedStage): PipelineStage {
  return {
    id: stage.id,
    organization_id: '',
    name: stage.name,
    slug: stage.slug,
    color: stage.color,
    position: stage.position,
    is_won: stage.is_won,
    is_lost: stage.is_lost,
    default_probability: 50,
    created_at: new Date().toISOString(),
  };
}

// Adapter: Convert ProspectData to CrmProspect format for existing components
function prospectDataToCrmProspect(prospect: ProspectData): CrmProspect {
  // IMPORTANT: Ensure stage_slug is never undefined/null
  // Default to 'nouveau' if no stage is set
  const stageSlug = prospect.stage || 'nouveau';

  return {
    id: prospect.id,
    organization_id: '',
    first_name: prospect.firstName || null,
    last_name: prospect.lastName || null,
    email: prospect.email || null,
    phone: prospect.phone || null,
    company: null,
    job_title: prospect.situationPro || null,
    address: null,
    city: null,
    postal_code: null,
    country: 'France',
    patrimoine_estime: prospect.patrimoine || null,
    revenus_annuels: prospect.revenusMensuels ? prospect.revenusMensuels * 12 : null,
    situation_familiale: null,
    nb_enfants: null,
    age: prospect.age || null,
    profession: prospect.situationPro || null,
    stage_id: null,
    stage_slug: stageSlug, // Never undefined!
    deal_value: null,
    close_probability: 50,
    expected_close_date: prospect.dateRdv || null,
    qualification: (prospect.qualification?.toLowerCase() || 'non_qualifie') as CrmProspect['qualification'],
    score_ia: prospect.scoreIa || null,
    analyse_ia: prospect.justificationIa || null,
    derniere_qualification: null,
    source: prospect.source || null,
    source_detail: null,
    assigned_to: prospect.assignedTo || null,
    tags: [],
    notes: prospect.notesAppel || null,
    lost_reason: null,
    won_date: null,
    lost_date: null,
    last_activity_at: null,
    created_at: prospect.createdAt,
    updated_at: prospect.updatedAt || prospect.createdAt,
  };
}

export default function PipelinePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [prospects, setProspects] = useState<CrmProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  // State for waiting modal
  const [showWaitingModal, setShowWaitingModal] = useState(false);
  const [pendingMove, setPendingMove] = useState<{
    prospectId: string;
    prospectName: string;
  } | null>(null);

  // Ref to prevent double fetch on mount
  const hasFetched = useRef(false);

  // Fetch function (not in useCallback to avoid dependency issues)
  const fetchData = async (searchQuery?: string) => {
    setLoading(true);
    try {
      const [stagesRes, prospectsRes] = await Promise.all([
        fetch('/api/stages/unified'),
        fetch(`/api/prospects/unified${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`),
      ]);

      if (stagesRes.ok) {
        const stagesData: UnifiedStage[] = await stagesRes.json();
        setStages(stagesData.map(unifiedStageToPipelineStage));
      }

      if (prospectsRes.ok) {
        const prospectsData: ProspectData[] = await prospectsRes.json();
        setProspects(prospectsData.map(prospectDataToCrmProspect));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch - only once on mount
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  useEffect(() => {
    if (!hasFetched.current) return;

    const timer = setTimeout(() => {
      fetchData(search);
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleRefresh = () => {
    fetchData(search);
  };

  const handleProspectMove = async (
    prospectId: string,
    newStageSlug: string,
    subtype?: 'plaquette' | 'rappel_differe'
  ) => {
    const response = await fetch(`/api/prospects/unified/${prospectId}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_slug: newStageSlug, subtype }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update prospect');
    }
  };

  // Called when dropping on "en_attente" - show modal first
  const handleWaitingDrop = (prospectId: string, prospectName: string) => {
    setPendingMove({ prospectId, prospectName });
    setShowWaitingModal(true);
  };

  // Called when user confirms the waiting reason
  const handleWaitingConfirm = async (
    subtype: 'plaquette' | 'rappel_differe',
    rappelDate?: Date
  ) => {
    if (!pendingMove) return;

    // Find the target waiting stage - support both CRM and Sheet slugs
    const targetStage = stages.find(s =>
      s.slug === 'en_attente' || s.slug === 'contacte' || s.slug === 'a_rappeler'
    );
    const targetSlug = targetStage?.slug || 'en_attente';

    // Optimistic update BEFORE API call
    setProspects(prev => prev.map(p =>
      p.id === pendingMove.prospectId
        ? { ...p, stage_slug: targetSlug }
        : p
    ));

    try {
      await handleProspectMove(pendingMove.prospectId, targetSlug, subtype);

      // Create planning event if rappel_differe with date
      if (rappelDate && subtype === 'rappel_differe') {
        try {
          await fetch('/api/planning', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'call',
              title: `Rappeler ${pendingMove.prospectName}`,
              prospectId: pendingMove.prospectId,
              prospectName: pendingMove.prospectName,
              dueDate: rappelDate.toISOString(),
              priority: 'high',
            }),
          });
        } catch (err) {
          console.error('Error creating planning event:', err);
        }
      }

      toast({
        title: 'Prospect mis en attente',
        description:
          subtype === 'plaquette'
            ? 'La plaquette sera envoyee automatiquement'
            : `Rappel programme pour ${rappelDate?.toLocaleDateString('fr-FR')}`,
      });

      // Refresh to sync with server
      await fetchData(search);
    } catch (error) {
      // Rollback on error - refresh to get actual state
      await fetchData(search);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre le prospect en attente',
        variant: 'destructive',
      });
    } finally {
      setShowWaitingModal(false);
      setPendingMove(null);
    }
  };

  const handleProspectClick = (prospect: CrmProspect) => {
    router.push(`/prospects/${prospect.id}`);
  };

  // Stats
  const totalValue = prospects.reduce((sum, p) => sum + (p.deal_value || 0), 0);
  const weightedValue = prospects.reduce((sum, p) => {
    return sum + ((p.deal_value || 0) * (p.close_probability || 0)) / 100;
  }, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-muted-foreground">
            {prospects.length} prospects
            {totalValue > 0 && ` - ${formatCurrency(totalValue)} total`}
            {weightedValue > 0 && ` - ${formatCurrency(weightedValue)} pondere`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau prospect
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un prospect..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <PipelineKanban
          stages={stages}
          prospects={prospects}
          onProspectClick={handleProspectClick}
          onProspectMove={handleProspectMove}
          onWaitingDrop={handleWaitingDrop}
        />
      )}

      {/* Form Modal */}
      <ProspectForm
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={handleRefresh}
        stages={stages}
      />

      {/* Waiting Reason Modal */}
      <WaitingReasonModal
        open={showWaitingModal}
        onOpenChange={(open) => {
          setShowWaitingModal(open);
          if (!open) setPendingMove(null);
        }}
        prospectName={pendingMove?.prospectName || ''}
        onConfirm={handleWaitingConfirm}
      />
    </div>
  );
}
