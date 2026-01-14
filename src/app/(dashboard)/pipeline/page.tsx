'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PipelineKanban } from '@/components/crm/PipelineKanban';
import { ProspectForm } from '@/components/crm/ProspectForm';
import { PipelineStage, CrmProspect } from '@/types/crm';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PipelinePage() {
  const router = useRouter();
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [prospects, setProspects] = useState<CrmProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch stages
      const stagesRes = await fetch('/api/crm/stages');
      const stagesData = await stagesRes.json();
      setStages(stagesData);

      // Fetch prospects
      const prospectsRes = await fetch(`/api/crm/prospects?limit=200${search ? `&search=${search}` : ''}`);
      const prospectsData = await prospectsRes.json();
      setProspects(prospectsData.prospects || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProspectMove = async (prospectId: string, newStageSlug: string) => {
    const response = await fetch(`/api/crm/prospects/${prospectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_slug: newStageSlug }),
    });

    if (!response.ok) {
      throw new Error('Failed to update prospect');
    }
  };

  const handleProspectClick = (prospect: CrmProspect) => {
    router.push(`/prospects/${prospect.id}`);
  };

  // Stats
  const totalValue = prospects.reduce((sum, p) => sum + (p.deal_value || 0), 0);
  const weightedValue = prospects.reduce((sum, p) => {
    return sum + ((p.deal_value || 0) * (p.close_probability || 0) / 100);
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
            {prospects.length} prospects - {formatCurrency(totalValue)} total - {formatCurrency(weightedValue)} pondere
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
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
        />
      )}

      {/* Form Modal */}
      <ProspectForm
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={fetchData}
        stages={stages.filter(s => !s.is_won && !s.is_lost)}
      />
    </div>
  );
}
