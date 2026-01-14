'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ActivityTimeline } from '@/components/crm/ActivityTimeline';
import { ProspectTasks } from '@/components/crm/ProspectTasks';
import { CrmProspect, CrmActivity, CrmTask, PipelineStage } from '@/types/crm';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  MapPin,
  Loader2,
  Trash2,
  Save,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const qualificationOptions = [
  { value: 'chaud', label: 'Chaud', color: 'bg-red-500' },
  { value: 'tiede', label: 'Tiede', color: 'bg-orange-500' },
  { value: 'froid', label: 'Froid', color: 'bg-blue-500' },
  { value: 'non_qualifie', label: 'Non qualifie', color: 'bg-gray-500' },
];

export default function ProspectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const prospectId = params.id as string;

  const [prospect, setProspect] = useState<CrmProspect | null>(null);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<CrmProspect>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prospectRes, activitiesRes, tasksRes, stagesRes] = await Promise.all([
        fetch(`/api/crm/prospects/${prospectId}`),
        fetch(`/api/crm/activities?prospect_id=${prospectId}`),
        fetch(`/api/crm/tasks?prospect_id=${prospectId}`),
        fetch('/api/crm/stages'),
      ]);

      if (!prospectRes.ok) {
        router.push('/pipeline');
        return;
      }

      const prospectData = await prospectRes.json();
      const activitiesData = await activitiesRes.json();
      const tasksData = await tasksRes.json();
      const stagesData = await stagesRes.json();

      setProspect(prospectData);
      setFormData(prospectData);
      setActivities(activitiesData);
      setTasks(tasksData);
      setStages(stagesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [prospectId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/crm/prospects/${prospectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erreur');

      const updated = await response.json();
      setProspect(updated);
      setEditMode(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/crm/prospects/${prospectId}`, { method: 'DELETE' });
      router.push('/pipeline');
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleStageChange = async (newStageSlug: string) => {
    const newStage = stages.find((s) => s.slug === newStageSlug);
    setFormData({ ...formData, stage_slug: newStageSlug });

    // Save immediately
    try {
      const response = await fetch(`/api/crm/prospects/${prospectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage_slug: newStageSlug,
          close_probability: newStage?.default_probability || formData.close_probability,
        }),
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error updating stage:', error);
    }
  };

  const updateField = (field: string, value: string | number | null) => {
    setFormData({ ...formData, [field]: value });
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="p-6 text-center">
        <p>Prospect non trouve</p>
        <Button onClick={() => router.push('/pipeline')} className="mt-4">
          Retour au pipeline
        </Button>
      </div>
    );
  }

  const fullName = [prospect.first_name, prospect.last_name].filter(Boolean).join(' ') || 'Sans nom';
  const forecastValue = ((formData.deal_value || 0) * (formData.close_probability || 0)) / 100;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{fullName}</h1>
            {prospect.company && (
              <p className="text-muted-foreground flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {prospect.company}
                {prospect.job_title && ` - ${prospect.job_title}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditMode(true)}>
                Modifier
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer ce prospect ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irreversible. Toutes les activites et taches associees seront egalement supprimees.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Info */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations de contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editMode ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Prenom</Label>
                      <Input
                        value={formData.first_name || ''}
                        onChange={(e) => updateField('first_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Nom</Label>
                      <Input
                        value={formData.last_name || ''}
                        onChange={(e) => updateField('last_name', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input
                      value={formData.email || ''}
                      onChange={(e) => updateField('email', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Telephone</Label>
                    <Input
                      value={formData.phone || ''}
                      onChange={(e) => updateField('phone', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Entreprise</Label>
                      <Input
                        value={formData.company || ''}
                        onChange={(e) => updateField('company', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Poste</Label>
                      <Input
                        value={formData.job_title || ''}
                        onChange={(e) => updateField('job_title', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Ville</Label>
                    <Input
                      value={formData.city || ''}
                      onChange={(e) => updateField('city', e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  {prospect.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${prospect.email}`} className="hover:underline">
                        {prospect.email}
                      </a>
                    </div>
                  )}
                  {prospect.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${prospect.phone}`} className="hover:underline">
                        {prospect.phone}
                      </a>
                    </div>
                  )}
                  {prospect.city && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      {prospect.city}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Stage</Label>
                <Select value={formData.stage_slug} onValueChange={handleStageChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.slug} value={stage.slug}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Qualification</Label>
                <Select
                  value={formData.qualification}
                  onValueChange={(v) => updateField('qualification', v)}
                  disabled={!editMode}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {qualificationOptions.map((q) => (
                      <SelectItem key={q.value} value={q.value}>
                        {q.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Valeur</Label>
                  {editMode ? (
                    <Input
                      type="number"
                      value={formData.deal_value || ''}
                      onChange={(e) =>
                        updateField('deal_value', e.target.value ? parseFloat(e.target.value) : null)
                      }
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-green-400 mt-1">
                      {formatCurrency(prospect.deal_value)}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Probabilite</Label>
                  {editMode ? (
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.close_probability || ''}
                      onChange={(e) => updateField('close_probability', parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-lg font-semibold mt-1">{prospect.close_probability}%</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Forecast pondere</Label>
                <p className="text-lg font-semibold text-primary mt-1">
                  {formatCurrency(forecastValue)}
                </p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Date closing prevue</Label>
                {editMode ? (
                  <Input
                    type="date"
                    value={formData.expected_close_date?.split('T')[0] || ''}
                    onChange={(e) => updateField('expected_close_date', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm mt-1">
                    {prospect.expected_close_date
                      ? format(new Date(prospect.expected_close_date), 'dd MMMM yyyy', { locale: fr })
                      : '-'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Patrimoine */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Patrimoine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editMode ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Patrimoine estime</Label>
                      <Input
                        type="number"
                        value={formData.patrimoine_estime || ''}
                        onChange={(e) =>
                          updateField(
                            'patrimoine_estime',
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Revenus annuels</Label>
                      <Input
                        type="number"
                        value={formData.revenus_annuels || ''}
                        onChange={(e) =>
                          updateField(
                            'revenus_annuels',
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Situation</Label>
                      <Input
                        value={formData.situation_familiale || ''}
                        onChange={(e) => updateField('situation_familiale', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Enfants</Label>
                      <Input
                        type="number"
                        value={formData.nb_enfants || ''}
                        onChange={(e) =>
                          updateField('nb_enfants', e.target.value ? parseInt(e.target.value) : null)
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Age</Label>
                      <Input
                        type="number"
                        value={formData.age || ''}
                        onChange={(e) =>
                          updateField('age', e.target.value ? parseInt(e.target.value) : null)
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Profession</Label>
                      <Input
                        value={formData.profession || ''}
                        onChange={(e) => updateField('profession', e.target.value)}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Patrimoine estime</span>
                    <span className="font-medium">{formatCurrency(prospect.patrimoine_estime)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Revenus annuels</span>
                    <span className="font-medium">{formatCurrency(prospect.revenus_annuels)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Situation</span>
                    <span>{prospect.situation_familiale || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Enfants</span>
                    <span>{prospect.nb_enfants ?? '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Age</span>
                    <span>{prospect.age ? `${prospect.age} ans` : '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Profession</span>
                    <span>{prospect.profession || '-'}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {editMode ? (
                <Textarea
                  value={formData.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={4}
                  placeholder="Ajouter des notes..."
                />
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {prospect.notes || 'Aucune note'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Timeline & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tasks */}
          <Card>
            <CardContent className="pt-6">
              <ProspectTasks tasks={tasks} prospectId={prospectId} onTasksChanged={fetchData} />
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardContent className="pt-6">
              <ActivityTimeline
                activities={activities}
                prospectId={prospectId}
                onActivityAdded={fetchData}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
