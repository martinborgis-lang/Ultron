'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PipelineKanban } from '@/components/crm/PipelineKanban';
import { ProspectForm } from '@/components/crm/ProspectForm';
import { WaitingReasonModal } from '@/components/crm/WaitingReasonModal';
import { RdvNotesModal } from '@/components/crm/RdvNotesModal';
import { DealProductSelector } from '@/components/crm/DealProductSelector';
import { PipelineStage, CrmProspect } from '@/types/crm';
import { UnifiedStage } from '@/types/pipeline';
import { ProspectData } from '@/lib/services/interfaces';
import type { DealProductForm } from '@/types/products';
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

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  gmail_connected: boolean;
}

export default function PipelinePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [prospects, setProspects] = useState<CrmProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Team members for advisor selection
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // State for waiting modal
  const [showWaitingModal, setShowWaitingModal] = useState(false);
  const [pendingMove, setPendingMove] = useState<{
    prospectId: string;
    prospectName: string;
    currentAssignedTo?: string;
  } | null>(null);

  // State for RDV modal
  const [showRdvModal, setShowRdvModal] = useState(false);
  const [pendingRdvMove, setPendingRdvMove] = useState<{
    prospectId: string;
    prospectName: string;
    targetStageSlug: string;
    currentAssignedTo?: string;
  } | null>(null);

  // State for deal product selector
  const [showDealProductModal, setShowDealProductModal] = useState(false);
  const [pendingDeal, setPendingDeal] = useState<{
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

  // ✅ OPTIMISATION N+1: Initial fetch - regrouper TOUTES les requêtes en parallèle
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    // ✅ Regrouper toutes les requêtes initiales en parallèle
    const fetchInitialData = async () => {
      try {
        const [stagesRes, prospectsRes, teamRes, userRes] = await Promise.all([
          fetch('/api/stages/unified'),
          fetch('/api/prospects/unified'),
          fetch('/api/team'),
          fetch('/api/user/me'),
        ]);

        // Handle stages
        if (stagesRes.ok) {
          const stagesData: UnifiedStage[] = await stagesRes.json();
          setStages(stagesData.map(unifiedStageToPipelineStage));
        }

        // Handle prospects
        if (prospectsRes.ok) {
          const prospectsData: ProspectData[] = await prospectsRes.json();
          setProspects(prospectsData.map(prospectDataToCrmProspect));
        }

        // Handle team members
        if (teamRes.ok) {
          const teamData = await teamRes.json();
          if (teamData.members) {
            setTeamMembers(teamData.members);
          }
        }

        // Handle current user
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.id) {
            setCurrentUserId(userData.id);
          }
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchInitialData();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!hasFetched.current) return;

    const timer = setTimeout(() => {
      fetchData(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search, fetchData]);

  const handleRefresh = () => {
    fetchData(search);
  };

  const handleProspectMove = async (
    prospectId: string,
    newStageSlug: string,
    subtype?: 'plaquette' | 'rappel_differe',
    assignedTo?: string
  ) => {
    const response = await fetch(`/api/prospects/unified/${prospectId}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_slug: newStageSlug, subtype, assignedTo }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update prospect');
    }
  };

  // Called when dropping on "en_attente" - show modal first
  const handleWaitingDrop = (prospectId: string, prospectName: string) => {
    // Find current assigned_to for this prospect
    const prospect = prospects.find(p => p.id === prospectId);
    setPendingMove({ prospectId, prospectName, currentAssignedTo: prospect?.assigned_to || undefined });
    setShowWaitingModal(true);
  };

  // Called when user confirms the waiting reason
  const handleWaitingConfirm = async (
    subtype: 'plaquette' | 'rappel_differe',
    rappelDate?: Date,
    assignedTo?: string
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
        ? { ...p, stage_slug: targetSlug, assigned_to: assignedTo || p.assigned_to }
        : p
    ));

    try {
      // Update assigned_to if changed
      if (assignedTo) {
        await fetch(`/api/prospects/unified/${pendingMove.prospectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignedTo }),
        });
      }

      // Pass assignedTo to trigger workflow with correct advisor email
      await handleProspectMove(pendingMove.prospectId, targetSlug, subtype, assignedTo);

      // Create planning event if rappel_differe with date
      // The planning service automatically syncs to Google Calendar
      if (rappelDate && subtype === 'rappel_differe') {
        const endDate = new Date(rappelDate.getTime() + 30 * 60 * 1000); // 30 min duration

        // Create planning event in Ultron (auto-syncs to Google Calendar)
        try {
          await fetch('/api/planning', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'call',
              title: `Rappeler ${pendingMove.prospectName}`,
              description: `Rappel programmé depuis le pipeline`,
              prospectId: pendingMove.prospectId,
              startDate: rappelDate.toISOString(),
              endDate: endDate.toISOString(),
              priority: 'high',
            }),
          });
        } catch (err) {
          // If planning fails (sheet mode), create Google Calendar event directly
          console.log('Planning event not created, trying direct calendar:', err);
          try {
            await fetch('/api/calendar/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                summary: `📞 Rappeler ${pendingMove.prospectName}`,
                description: `Rappel programmé pour le prospect ${pendingMove.prospectName}.\n\nProspect ID: ${pendingMove.prospectId}`,
                startDateTime: rappelDate.toISOString(),
                endDateTime: endDate.toISOString(),
              }),
            });
          } catch (calErr) {
            console.error('Error creating Google Calendar event:', calErr);
          }
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
    } catch (_error) {
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

  // Called when dropping on RDV stage - show modal for notes
  const handleRdvDrop = (prospectId: string, prospectName: string, targetStageSlug: string) => {
    // Find current assigned_to for this prospect
    const prospect = prospects.find(p => p.id === prospectId);
    setPendingRdvMove({ prospectId, prospectName, targetStageSlug, currentAssignedTo: prospect?.assigned_to || undefined });
    setShowRdvModal(true);
  };

  // Called when dropping on won stage - show product selector
  const handleWonDrop = (prospectId: string, prospectName: string) => {
    setPendingDeal({ prospectId, prospectName });
    setShowDealProductModal(true);
  };

  // Called when user confirms the product selection
  const handleDealProductConfirm = async (dealData: DealProductForm) => {
    if (!pendingDeal) return;

    const { prospectId } = pendingDeal;

    try {
      // Create the deal with product information
      const response = await fetch('/api/deal-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dealData,
          prospect_id: prospectId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create deal');
      }

      const result = await response.json();

      // Update prospect's deal_value and move to won stage
      await fetch(`/api/prospects/unified/${prospectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealValue: dealData.client_amount,
        }),
      });

      // Move to won stage (this should trigger any won workflows)
      await handleProspectMove(prospectId, 'gagne');

      toast({
        title: 'Deal configuré avec succès',
        description: `Le produit "${result.deal.product.name}" a été configuré pour ce deal.`,
      });

      await fetchData(search);
    } catch (error) {
      console.error('Error creating deal:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de configurer le deal',
        variant: 'destructive',
      });
    } finally {
      setShowDealProductModal(false);
      setPendingDeal(null);
    }
  };

  // Called when user confirms the RDV with notes
  const handleRdvConfirm = async (notes: string, rdvDate: Date, assignedTo?: string) => {
    if (!pendingRdvMove) return;

    const { prospectId, prospectName, targetStageSlug } = pendingRdvMove;

    // Optimistic update
    setProspects(prev => prev.map(p =>
      p.id === prospectId
        ? { ...p, stage_slug: targetStageSlug, notes, expected_close_date: rdvDate.toISOString(), assigned_to: assignedTo || p.assigned_to }
        : p
    ));

    try {
      // 1. Create planning event FIRST with Google Meet (to get the Meet link)
      const endDate = new Date(rdvDate.getTime() + 60 * 60 * 1000); // 1h duration
      let meetLink: string | undefined;

      try {
        const planningRes = await fetch('/api/planning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'meeting',
            title: `🤝 RDV avec ${prospectName}`,
            description: `Notes de l'appel:\n${notes}`,
            prospectId: prospectId,
            startDate: rdvDate.toISOString(),
            endDate: endDate.toISOString(),
            priority: 'high',
            addGoogleMeet: true, // Creates Google Meet link
          }),
        });

        if (planningRes.ok) {
          const planningData = await planningRes.json();
          meetLink = planningData.meetLink;
          if (meetLink) {
            console.log('Google Meet link created:', meetLink);
          }
        }
      } catch (err) {
        // Silently fail for sheet mode (planning managed via Google Calendar)
        console.log('Planning event not created (probably sheet mode):', err);
      }

      // 2. Update prospect with notes, RDV date, Meet link and assigned advisor
      await fetch(`/api/prospects/unified/${prospectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notesAppel: notes,
          dateRdv: rdvDate.toISOString(),
          meetLink: meetLink, // Store Meet link on prospect for email
          assignedTo: assignedTo, // Update assigned advisor
        }),
      });

      // 3. Move to RDV stage (this triggers the workflow with qualification + email)
      // Pass assignedTo to trigger workflow with correct advisor email
      await handleProspectMove(prospectId, targetStageSlug, undefined, assignedTo);

      toast({
        title: 'RDV programme',
        description: meetLink
          ? `Le prospect recevra un email avec le lien Google Meet.`
          : `Le prospect sera qualifie et recevra un email de confirmation.`,
      });

      await fetchData(search);
    } catch (_error) {
      await fetchData(search);
      toast({
        title: 'Erreur',
        description: 'Impossible de programmer le RDV',
        variant: 'destructive',
      });
    } finally {
      setShowRdvModal(false);
      setPendingRdvMove(null);
    }
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
          onRdvDrop={handleRdvDrop}
          onWonDrop={handleWonDrop}
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
        currentAssignedTo={pendingMove?.currentAssignedTo}
        teamMembers={teamMembers}
        currentUserId={currentUserId}
        onConfirm={handleWaitingConfirm}
      />

      {/* RDV Notes Modal */}
      <RdvNotesModal
        open={showRdvModal}
        onOpenChange={(open) => {
          setShowRdvModal(open);
          if (!open) setPendingRdvMove(null);
        }}
        prospectName={pendingRdvMove?.prospectName || ''}
        currentAssignedTo={pendingRdvMove?.currentAssignedTo}
        teamMembers={teamMembers}
        currentUserId={currentUserId}
        onConfirm={handleRdvConfirm}
      />

      {/* Deal Product Selector Modal */}
      <DealProductSelector
        open={showDealProductModal}
        onClose={() => {
          setShowDealProductModal(false);
          setPendingDeal(null);
        }}
        onConfirm={handleDealProductConfirm}
        prospectId={pendingDeal?.prospectId || ''}
        prospectName={pendingDeal?.prospectName || ''}
      />
    </div>
  );
}
