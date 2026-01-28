// ========================================
// DASHBOARD AGENT IA AUTOMATIQUE
// ========================================

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Phone,
  PhoneCall,
  Clock,
  Users,
  TrendingUp,
  Settings,
  Play,
  Pause,
  Calendar,
  FileText,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mic,
  Volume2,
  Target,
  Zap
} from 'lucide-react';
import {
  VoiceConfig,
  PhoneCall as PhoneCallType,
  VoiceDashboardStats,
  RecentCall,
  VapiVoice
} from '@/types/voice';

export default function AIAgentDashboard() {
  // États
  const [config, setConfig] = useState<VoiceConfig | null>(null);
  const [stats, setStats] = useState<VoiceDashboardStats | null>(null);
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // États configuration
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configForm, setConfigForm] = useState<Partial<VoiceConfig>>({});

  // États appel manuel
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callForm, setCallForm] = useState({
    phone_number: '',
    prospect_id: '',
    notes: ''
  });

  // Charger les données
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Charger config, stats et appels en parallèle
      const [configRes, statsRes, callsRes] = await Promise.all([
        fetch('/api/voice/ai-agent/config'),
        fetch('/api/voice/ai-agent/stats'),
        fetch('/api/voice/ai-agent/call?limit=10')
      ]);

      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData.data);
        setConfigForm(configData.data);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      if (callsRes.ok) {
        const callsData = await callsRes.json();
        setRecentCalls(callsData.data);
      }

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/voice/ai-agent/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configForm)
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.data);
        setIsConfigOpen(false);
        toast.success('Configuration sauvegardée');
        loadDashboardData(); // Recharger pour les stats
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erreur sauvegarde');
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleManualCall = async () => {
    try {
      if (!callForm.phone_number) {
        toast.error('Numéro de téléphone requis');
        return;
      }

      const response = await fetch('/api/voice/ai-agent/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: callForm.phone_number,
          prospect_id: callForm.prospect_id || undefined,
          metadata: { notes: callForm.notes }
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Appel lancé avec succès');
        setIsCallModalOpen(false);
        setCallForm({ phone_number: '', prospect_id: '', notes: '' });
        loadDashboardData(); // Recharger les appels
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erreur lancement appel');
      }
    } catch (error) {
      toast.error('Erreur lors du lancement de l\'appel');
    }
  };

  const toggleAgent = async () => {
    try {
      const newStatus = !config?.is_enabled;

      const response = await fetch('/api/voice/ai-agent/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: newStatus })
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.data);
        toast.success(`Agent IA ${newStatus ? 'activé' : 'désactivé'}`);
      } else {
        toast.error('Erreur lors du changement de statut');
      }
    } catch (error) {
      toast.error('Erreur lors du changement de statut');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Phone className="h-8 w-8 text-blue-600" />
            Agent IA Automatique
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion des appels automatiques via Vapi.ai
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Statut Agent */}
          <div className="flex items-center gap-2">
            <Switch
              checked={config?.is_enabled || false}
              onCheckedChange={toggleAgent}
              disabled={!config}
            />
            <Badge variant={config?.is_enabled ? 'success' : 'secondary'}>
              {config?.is_enabled ? 'Actif' : 'Inactif'}
            </Badge>
          </div>

          {/* Boutons actions */}
          <Dialog open={isCallModalOpen} onOpenChange={setIsCallModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <PhoneCall className="h-4 w-4 mr-2" />
                Appel Manuel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Lancer un Appel Manuel</DialogTitle>
                <DialogDescription>
                  Déclencher un appel via l'Agent IA pour un prospect spécifique
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Numéro de téléphone *</Label>
                  <Input
                    id="phone"
                    placeholder="+33 6 12 34 56 78"
                    value={callForm.phone_number}
                    onChange={(e) => setCallForm({...callForm, phone_number: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="prospect">ID Prospect (optionnel)</Label>
                  <Input
                    id="prospect"
                    placeholder="UUID du prospect si existant"
                    value={callForm.prospect_id}
                    onChange={(e) => setCallForm({...callForm, prospect_id: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Notes pour l'appel..."
                    value={callForm.notes}
                    onChange={(e) => setCallForm({...callForm, notes: e.target.value})}
                  />
                </div>

                <Button onClick={handleManualCall} className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Lancer l'Appel
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configuration
              </Button>
            </DialogTrigger>
            <ConfigurationModal
              config={configForm}
              setConfig={setConfigForm}
              onSave={handleSaveConfig}
              saving={saving}
            />
          </Dialog>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatsCard
          title="Appels Aujourd'hui"
          value={stats?.today.calls_made || 0}
          icon={PhoneCall}
          trend="+12%"
          color="blue"
        />

        <StatsCard
          title="RDV Pris"
          value={stats?.today.appointments_booked || 0}
          icon={Calendar}
          trend="+8%"
          color="green"
        />

        <StatsCard
          title="Taux de Réponse"
          value={`${Math.round(stats?.today.answer_rate || 0)}%`}
          icon={Target}
          trend="-2%"
          color="orange"
        />

        <StatsCard
          title="Coût Total"
          value={`${((stats?.today.cost_total || 0) / 100).toFixed(2)}€`}
          icon={TrendingUp}
          trend="+15%"
          color="purple"
        />
      </div>

      {/* Contenu principal */}
      <Tabs defaultValue="calls" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calls">Appels Récents</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="calls">
          <RecentCallsTable calls={recentCalls} />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsCharts stats={stats} />
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhooksPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ========================================
// COMPOSANTS
// ========================================

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: any;
  trend?: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

function StatsCard({ title, value, icon: Icon, trend, color }: StatsCardProps) {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    purple: 'text-purple-600 bg-purple-50'
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorMap[color]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-gray-600 mt-1">
            {trend} depuis hier
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RecentCallsTable({ calls }: { calls: RecentCall[] }) {
  const getStatusBadge = (status: string) => {
    const statusMap = {
      completed: { variant: 'success' as const, label: 'Terminé' },
      in_progress: { variant: 'default' as const, label: 'En cours' },
      failed: { variant: 'destructive' as const, label: 'Échec' },
      no_answer: { variant: 'secondary' as const, label: 'Pas de réponse' },
      queued: { variant: 'outline' as const, label: 'En file' }
    };

    const config = statusMap[status as keyof typeof statusMap] || statusMap.queued;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getOutcomeBadge = (outcome: string) => {
    const outcomeMap = {
      appointment_booked: { variant: 'success' as const, label: 'RDV Pris', icon: CheckCircle },
      callback_requested: { variant: 'default' as const, label: 'Rappel', icon: Phone },
      not_interested: { variant: 'destructive' as const, label: 'Pas intéressé', icon: XCircle },
      wrong_number: { variant: 'secondary' as const, label: 'Mauvais n°', icon: AlertCircle },
      unknown: { variant: 'outline' as const, label: 'Inconnu', icon: AlertCircle }
    };

    const config = outcomeMap[outcome as keyof typeof outcomeMap] || outcomeMap.unknown;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appels Récents</CardTitle>
        <CardDescription>
          Historique des 10 derniers appels effectués par l'Agent IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        {calls.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun appel récent
          </div>
        ) : (
          <div className="space-y-4">
            {calls.map((call) => (
              <div
                key={call.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {call.prospect_name || 'Prospect inconnu'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {call.phone_number}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {call.duration_minutes ? `${call.duration_minutes}min` : '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(call.created_at).toLocaleString('fr-FR')}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    {getStatusBadge(call.status)}
                    {getOutcomeBadge(call.outcome)}
                  </div>

                  {call.qualification_score && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {call.qualification_score}
                      </div>
                      <div className="text-xs text-gray-500">Score IA</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnalyticsCharts({ stats }: { stats: VoiceDashboardStats | null }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Semaine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Appels effectués</span>
              <span className="font-bold">{stats?.this_week.calls_made || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>RDV pris</span>
              <span className="font-bold text-green-600">
                {stats?.this_week.appointments_booked || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Prospects qualifiés</span>
              <span className="font-bold text-blue-600">
                {stats?.this_week.qualified_prospects || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Taux de conversion</span>
              <span className="font-bold">
                {Math.round(stats?.this_week.conversion_rate || 0)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ROI Mensuel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              +{Math.round(stats?.this_month.roi_percentage || 0)}%
            </div>
            <p className="text-gray-600">Retour sur investissement</p>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Coût total</span>
                <span>{((stats?.this_month.total_cost || 0) / 100).toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>RDV générés</span>
                <span>{stats?.this_month.appointments_booked || 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WebhooksPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Webhooks Configurés
        </CardTitle>
        <CardDescription>
          Configuration des webhooks pour les formulaires et événements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Webhook Formulaires</h4>
                <p className="text-sm text-gray-600">
                  Déclenche des appels automatiques depuis les formulaires web
                </p>
              </div>
              <Badge variant="success">Actif</Badge>
            </div>
            <div className="mt-2 text-xs text-gray-500 font-mono">
              POST /api/voice/ai-agent/webhook
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Webhook Vapi.ai</h4>
                <p className="text-sm text-gray-600">
                  Reçoit les événements des appels en cours
                </p>
              </div>
              <Badge variant="success">Actif</Badge>
            </div>
            <div className="mt-2 text-xs text-gray-500 font-mono">
              POST /api/voice/ai-agent/vapi-webhook
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ConfigurationModal({
  config,
  setConfig,
  onSave,
  saving
}: {
  config: Partial<VoiceConfig>;
  setConfig: (config: Partial<VoiceConfig>) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const voiceOptions: Array<{ value: VapiVoice; label: string }> = [
    { value: 'jennifer', label: 'Jennifer (Féminine, naturelle)' },
    { value: 'alex', label: 'Alex (Masculine, clair)' },
    { value: 'sarah', label: 'Sarah (Féminine, professionnelle)' },
    { value: 'mike', label: 'Mike (Masculine, chaleureux)' },
    { value: 'emma', label: 'Emma (Féminine, jeune)' },
    { value: 'john', label: 'John (Masculine, autoritaire)' },
    { value: 'lisa', label: 'Lisa (Féminine, douce)' },
    { value: 'david', label: 'David (Masculine, mature)' }
  ];

  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Configuration Agent IA</DialogTitle>
        <DialogDescription>
          Paramétrer l'Assistant IA pour les appels automatiques
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Configuration de base */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration de Base
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agent_name">Nom de l'Agent</Label>
              <Input
                id="agent_name"
                value={config.agent_name || ''}
                onChange={(e) => setConfig({...config, agent_name: e.target.value})}
                placeholder="Assistant Ultron"
              />
            </div>

            <div>
              <Label htmlFor="agent_voice">Voix</Label>
              <Select
                value={config.agent_voice}
                onValueChange={(value: VapiVoice) => setConfig({...config, agent_voice: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une voix" />
                </SelectTrigger>
                <SelectContent>
                  {voiceOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Horaires de travail */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horaires de Travail
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Heure de début</Label>
              <Input
                id="start_time"
                type="time"
                value={config.working_hours_start || ''}
                onChange={(e) => setConfig({...config, working_hours_start: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="end_time">Heure de fin</Label>
              <Input
                id="end_time"
                type="time"
                value={config.working_hours_end || ''}
                onChange={(e) => setConfig({...config, working_hours_end: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Prompt système */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Prompt Système
          </h4>

          <div>
            <Label htmlFor="system_prompt">Instructions pour l'IA</Label>
            <Textarea
              id="system_prompt"
              rows={6}
              value={config.system_prompt || ''}
              onChange={(e) => setConfig({...config, system_prompt: e.target.value})}
              placeholder="Vous êtes un assistant commercial pour un cabinet de gestion de patrimoine..."
            />
          </div>
        </div>

        {/* Paramètres avancés */}
        <div className="space-y-4">
          <h4 className="font-medium">Paramètres Avancés</h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max_duration">Durée max (secondes)</Label>
              <Input
                id="max_duration"
                type="number"
                value={config.max_call_duration_seconds || ''}
                onChange={(e) => setConfig({...config, max_call_duration_seconds: parseInt(e.target.value)})}
                placeholder="300"
              />
            </div>

            <div>
              <Label htmlFor="max_retries">Tentatives max</Label>
              <Input
                id="max_retries"
                type="number"
                value={config.max_retry_attempts || ''}
                onChange={(e) => setConfig({...config, max_retry_attempts: parseInt(e.target.value)})}
                placeholder="2"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="retry_no_answer"
              checked={config.retry_on_no_answer || false}
              onCheckedChange={(checked) => setConfig({...config, retry_on_no_answer: checked})}
            />
            <Label htmlFor="retry_no_answer">Réessayer si pas de réponse</Label>
          </div>
        </div>

        <Button onClick={onSave} className="w-full" disabled={saving}>
          {saving ? 'Sauvegarde...' : 'Sauvegarder la Configuration'}
        </Button>
      </div>
    </DialogContent>
  );
}