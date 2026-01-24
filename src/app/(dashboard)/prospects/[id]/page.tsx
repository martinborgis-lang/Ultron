'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { SaleClosureForm } from '@/components/crm/SaleClosureForm';
import { LetterGeneratorModal } from '@/components/letters/LetterGeneratorModal';
import { CrmProspect, CrmActivity, CrmTask, PipelineStage } from '@/types/crm';
import { EmailLog } from '@/types/email';
import {
  ArrowLeft,
  Mail,
  Phone,
  Loader2,
  Trash2,
  Save,
  AlertCircle,
  User,
  Briefcase,
  Calendar,
  Brain,
  TrendingUp,
  Send,
  Paperclip,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const qualificationColors: Record<string, string> = {
  chaud: 'bg-red-500 text-white',
  tiede: 'bg-orange-500 text-white',
  froid: 'bg-blue-500 text-white',
  non_qualifie: 'bg-emerald-500 text-white animate-pulse',
};

const qualificationLabels: Record<string, string> = {
  chaud: 'CHAUD',
  tiede: 'TIEDE',
  froid: 'FROID',
  non_qualifie: 'Nouveau',
};

export default function ProspectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const prospectId = params.id as string;

  const [prospect, setProspect] = useState<CrmProspect | null>(null);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<CrmProspect>>({});
  const [isSheetMode, setIsSheetMode] = useState(false);
  const [showLetterModal, setShowLetterModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ OPTIMISATION N+1: Regrouper toutes les requêtes initiales en parallèle
      const [prospectRes, stagesRes] = await Promise.all([
        fetch(`/api/prospects/unified/${prospectId}`),
        fetch('/api/stages/unified'),
      ]);

      if (!prospectRes.ok) {
        router.push('/prospects');
        return;
      }

      const [prospectData, stagesData] = await Promise.all([
        prospectRes.json(),
        stagesRes.json()
      ]);

      // Detect Sheet mode by checking if ID starts with 'sheet-' or has rowNumber
      const sheetMode = prospectId.startsWith('sheet-') || prospectData.rowNumber !== undefined;
      setIsSheetMode(sheetMode);

      // Convert unified ProspectData format to CrmProspect format for display
      // The unified API always returns ProspectData format (camelCase)
      const crmProspect: CrmProspect & { revenus_mensuels?: number | null } = {
        id: prospectData.id,
        organization_id: '',
        first_name: prospectData.firstName || '',
        last_name: prospectData.lastName || '',
        email: prospectData.email || '',
        phone: prospectData.phone || null,
        company: null,
        job_title: null,
        address: null,
        city: null,
        postal_code: null,
        country: 'France',
        patrimoine_estime: prospectData.patrimoine || null,
        revenus_annuels: prospectData.revenusMensuels ? prospectData.revenusMensuels * 12 : null,
        situation_familiale: null,
        nb_enfants: null,
        age: prospectData.age || null,
        profession: prospectData.situationPro || null,
        stage_id: null,
        stage_slug: prospectData.stage || 'nouveau',
        deal_value: null,
        close_probability: 50,
        expected_close_date: prospectData.dateRdv || null,
        qualification: prospectData.qualification?.toLowerCase() || 'non_qualifie',
        score_ia: prospectData.scoreIa || null,
        analyse_ia: prospectData.justificationIa || null,
        derniere_qualification: null,
        source: prospectData.source || null,
        source_detail: null,
        assigned_to: prospectData.assignedTo || null,
        tags: [],
        notes: prospectData.besoins || prospectData.notesAppel || null,
        lost_reason: null,
        won_date: null,
        lost_date: null,
        last_activity_at: null,
        created_at: prospectData.createdAt,
        updated_at: prospectData.updatedAt || null,
        // Store revenusMensuels for display
        revenus_mensuels: prospectData.revenusMensuels || null,
      };

      setProspect(crmProspect);
      setFormData(crmProspect);
      // ✅ SÉCURITÉ : Vérifier que stagesData est un array
      setStages(Array.isArray(stagesData) ? stagesData : []);

      // ✅ OPTIMISATION : Regrouper les requêtes secondaires en parallèle selon le mode
      const prospectEmail = sheetMode ? prospectData.email : crmProspect.email;

      if (!sheetMode) {
        // Mode CRM: Fetch activities, tasks, et emails en parallèle
        const secondaryRequests = [
          fetch(`/api/crm/activities?prospect_id=${prospectId}`),
          fetch(`/api/crm/tasks?prospect_id=${prospectId}`),
        ];

        // Ajouter la requête emails si l'email existe
        if (prospectEmail) {
          secondaryRequests.push(
            fetch(`/api/crm/emails?prospect_email=${encodeURIComponent(prospectEmail)}`)
          );
        }

        try {
          const responses = await Promise.all(secondaryRequests);
          const results = await Promise.all(
            responses.map(async (res, index) => {
              if (!res.ok) {
                console.warn(`Secondary request ${index} failed:`, res.status);
                return null;
              }
              return res.json();
            })
          );

          const [activitiesData, tasksData, emailsData] = results;
          // ✅ SÉCURITÉ : Vérifier que les données sont des arrays
          setActivities(Array.isArray(activitiesData) ? activitiesData : []);
          setTasks(Array.isArray(tasksData) ? tasksData : []);
          setEmails(Array.isArray(emailsData) ? emailsData : []);
        } catch (err) {
          console.error('Error fetching secondary CRM data:', err);
          setActivities([]);
          setTasks([]);
          setEmails([]);
        }
      } else {
        // Mode Sheet: Seulement emails si nécessaire
        setActivities([]);
        setTasks([]);

        if (prospectEmail) {
          try {
            const emailsRes = await fetch(`/api/crm/emails?prospect_email=${encodeURIComponent(prospectEmail)}`);
            if (emailsRes.ok) {
              const emailsData = await emailsRes.json();
              // ✅ SÉCURITÉ : Vérifier que emailsData est un array
              setEmails(Array.isArray(emailsData) ? emailsData : []);
            } else {
              setEmails([]);
            }
          } catch (err) {
            console.error('Error fetching emails:', err);
            setEmails([]);
          }
        } else {
          setEmails([]);
        }
      }
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
      const response = await fetch(`/api/prospects/unified/${prospectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.first_name,
          lastName: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          age: formData.age,
          situationPro: formData.profession,
          revenusMensuels: formData.revenus_annuels ? Math.round(formData.revenus_annuels / 12) : null,
          patrimoine: formData.patrimoine_estime,
          besoins: formData.notes,
          source: formData.source,
        }),
      });

      if (!response.ok) throw new Error('Erreur');

      await fetchData();
      setEditMode(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/prospects/unified/${prospectId}`, { method: 'DELETE' });
      router.push('/pipeline');
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleStageChange = async (newStageSlug: string) => {
    setFormData({ ...formData, stage_slug: newStageSlug });

    try {
      const response = await fetch(`/api/prospects/unified/${prospectId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage_slug: newStageSlug }),
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

  // Calculate revenus mensuels from revenus annuels
  const getRevenusMensuels = () => {
    if (prospect && 'revenus_mensuels' in prospect) {
      return prospect.revenus_mensuels as number;
    }
    if (prospect?.revenus_annuels) {
      return Math.round(prospect.revenus_annuels / 12);
    }
    return null;
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
  const currentStage = stages.find(s => s.slug === prospect.stage_slug);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{fullName}</h1>
              <Badge className={`flex items-center gap-1 ${qualificationColors[prospect.qualification || 'non_qualifie'] || qualificationColors.non_qualifie}`}>
                {(!prospect.qualification || prospect.qualification === 'non_qualifie') && (
                  <Sparkles className="w-3 h-3" />
                )}
                {qualificationLabels[prospect.qualification || 'non_qualifie'] || qualificationLabels.non_qualifie}
              </Badge>
            </div>
            {currentStage && (
              <p className="text-muted-foreground flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: currentStage.color }}
                />
                {currentStage.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSheetMode ? (
            <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-md">
              Mode lecture seule (Google Sheet)
            </div>
          ) : editMode ? (
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
              <Button
                variant="outline"
                onClick={() => setShowLetterModal(true)}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Générer une lettre
              </Button>
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

      {/* Sheet mode info banner */}
      {isSheetMode && (
        <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <CardContent className="py-3 flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">
              Ce prospect est synchronise depuis Google Sheet. Les modifications doivent etre faites directement dans la Sheet.
            </span>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Info */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editMode ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Nom</Label>
                      <Input
                        value={formData.last_name || ''}
                        onChange={(e) => updateField('last_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Prenom</Label>
                      <Input
                        value={formData.first_name || ''}
                        onChange={(e) => updateField('first_name', e.target.value)}
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
                  <div>
                    <Label className="text-xs">Source</Label>
                    <Input
                      value={formData.source || ''}
                      onChange={(e) => updateField('source', e.target.value)}
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
                  {prospect.source && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Source</span>
                      <span>{prospect.source}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cree le</span>
                    <span>
                      {prospect.created_at
                        ? format(new Date(prospect.created_at), 'dd MMM yyyy', { locale: fr })
                        : '-'}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Situation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Situation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editMode ? (
                <>
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

          {/* Financier */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Situation financiere
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editMode ? (
                <>
                  <div>
                    <Label className="text-xs">Revenus mensuels (EUR)</Label>
                    <Input
                      type="number"
                      value={formData.revenus_annuels ? Math.round(formData.revenus_annuels / 12) : ''}
                      onChange={(e) =>
                        updateField(
                          'revenus_annuels',
                          e.target.value ? parseFloat(e.target.value) * 12 : null
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Patrimoine (EUR)</Label>
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
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Revenus mensuels</span>
                    <span className="font-medium">{formatCurrency(getRevenusMensuels())}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Patrimoine</span>
                    <span className="font-medium">{formatCurrency(prospect.patrimoine_estime)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Stage actuel</Label>
                <Select
                  value={formData.stage_slug}
                  onValueChange={handleStageChange}
                  disabled={isSheetMode}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {/* ✅ SÉCURITÉ : Vérifier que stages est un array avant .map() */}
                    {Array.isArray(stages) && stages.map((stage) => (
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

              {prospect.expected_close_date && (
                <div>
                  <Label className="text-xs text-muted-foreground">Date RDV</Label>
                  <p className="text-sm mt-1">
                    {format(new Date(prospect.expected_close_date), 'EEEE dd MMMM yyyy HH:mm', { locale: fr })}
                  </p>
                </div>
              )}

              {/* Sale Closure Form for won prospects */}
              {!isSheetMode && currentStage?.is_won && (
                <div className="pt-4 border-t">
                  <Label className="text-xs text-muted-foreground">Finaliser la vente</Label>
                  <div className="mt-2">
                    <SaleClosureForm
                      prospectId={prospect.id}
                      prospectName={fullName}
                      onSaleClosed={fetchData}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Classification IA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Classification IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Qualification</span>
                <Badge className={`flex items-center gap-1 ${qualificationColors[prospect.qualification || 'non_qualifie'] || qualificationColors.non_qualifie}`}>
                  {(!prospect.qualification || prospect.qualification === 'non_qualifie') && (
                    <Sparkles className="w-3 h-3" />
                  )}
                  {qualificationLabels[prospect.qualification || 'non_qualifie'] || qualificationLabels.non_qualifie}
                </Badge>
              </div>
              {prospect.score_ia !== null && prospect.score_ia !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Score</span>
                  <span className="text-lg font-bold">{prospect.score_ia}/100</span>
                </div>
              )}
              {prospect.analyse_ia && (
                <div>
                  <Label className="text-xs text-muted-foreground">Analyse</Label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-lg whitespace-pre-wrap">
                    {prospect.analyse_ia}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Besoins / Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Besoins</CardTitle>
            </CardHeader>
            <CardContent>
              {editMode ? (
                <Textarea
                  value={formData.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={4}
                  placeholder="Besoins exprimes par le prospect..."
                />
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {prospect.notes || 'Aucun besoin renseigne'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Timeline & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tasks / Planning */}
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

          {/* Email History */}
          {Array.isArray(emails) && emails.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Historique des emails ({emails.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* ✅ SÉCURITÉ : Vérifier que emails est un array avant .map() */}
                {Array.isArray(emails) && emails.map((email) => {
                  const isExpanded = expandedEmails.has(email.id);
                  const emailTypeLabels: Record<string, string> = {
                    plaquette: 'Plaquette',
                    synthese: 'Synthese RDV',
                    rappel: 'Rappel 24h',
                    rdv_notes: 'Confirmation RDV',
                  };
                  const emailTypeColors: Record<string, string> = {
                    plaquette: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                    synthese: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                    rappel: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                    rdv_notes: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
                  };

                  return (
                    <div
                      key={email.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Send className="w-4 h-4 text-muted-foreground" />
                          <Badge
                            variant="secondary"
                            className={emailTypeColors[email.email_type] || 'bg-gray-100 text-gray-800'}
                          >
                            {emailTypeLabels[email.email_type] || email.email_type}
                          </Badge>
                          {email.has_attachment && (
                            <Paperclip className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {email.sent_at
                            ? format(new Date(email.sent_at), 'dd MMM yyyy HH:mm', { locale: fr })
                            : '-'}
                        </span>
                      </div>

                      <div className="font-medium text-sm">{email.subject}</div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          const newExpanded = new Set(expandedEmails);
                          if (isExpanded) {
                            newExpanded.delete(email.id);
                          } else {
                            newExpanded.add(email.id);
                          }
                          setExpandedEmails(newExpanded);
                        }}
                      >
                        <span>{isExpanded ? 'Masquer le contenu' : 'Voir le contenu'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>

                      {isExpanded && email.body && (
                        <div className="mt-2 p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                          {email.body}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Letter Generator Modal */}
      <LetterGeneratorModal
        prospect={{
          id: prospect.id,
          prenom: prospect.first_name,
          nom: prospect.last_name,
          first_name: prospect.first_name,
          last_name: prospect.last_name,
          email: prospect.email || '',
          telephone: prospect.phone || '',
        }}
        isOpen={showLetterModal}
        onClose={() => setShowLetterModal(false)}
      />
    </div>
  );
}
