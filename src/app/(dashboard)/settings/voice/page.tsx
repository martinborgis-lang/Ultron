'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, Settings, Clock, MessageSquare, Webhook } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VoiceConfigPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [twilioAvailable, setTwilioAvailable] = useState(false);
  const [deepgramAvailable, setDeepgramAvailable] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/voice/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        setTwilioAvailable(data.twilio_available);
        setDeepgramAvailable(data.deepgram_available);
      } else {
        console.error('Failed to fetch voice config');
        toast({
          title: "Erreur",
          description: "Impossible de charger la configuration voice",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching voice config:', error);
      toast({
        title: "Erreur",
        description: "Erreur de chargement",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/voice/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast({
          title: 'Configuration sauvegardée',
          description: 'La configuration Voice a été mise à jour avec succès.',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Erreur',
          description: error.error || 'Erreur lors de la sauvegarde',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la sauvegarde de la configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Phone className="h-8 w-8 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold">Configuration Voice</h1>
          <p className="text-muted-foreground">
            Configurez l'Agent IA automatique et les paramètres de téléphonie
          </p>
        </div>
      </div>

      {/* Statut des services */}
      <Card>
        <CardHeader>
          <CardTitle>Statut des Services</CardTitle>
          <CardDescription>
            Vérifiez l'état de vos intégrations voice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="font-medium">Twilio</span>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                twilioAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {twilioAvailable ? '✅ Configuré' : '❌ Non configuré'}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="font-medium">Deepgram</span>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                deepgramAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {deepgramAvailable ? '✅ Configuré' : '❌ Non configuré'}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium">Module Voice</span>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                config?.is_enabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {config?.is_enabled ? '✅ Activé' : '❌ Désactivé'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Général
          </TabsTrigger>
          <TabsTrigger value="vapi" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Vapi.ai
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horaires
          </TabsTrigger>
          <TabsTrigger value="scripts" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Scripts
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        {/* Configuration Générale */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Générale</CardTitle>
              <CardDescription>
                Paramètres globaux du module voice et click-to-call
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_enabled">Activer le module Voice</Label>
                  <p className="text-sm text-muted-foreground">Active toutes les fonctionnalités d'appel</p>
                </div>
                <Switch
                  id="is_enabled"
                  checked={config?.is_enabled || false}
                  onCheckedChange={(checked) => updateConfig('is_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="click_to_call_enabled">Click-to-Call</Label>
                  <p className="text-sm text-muted-foreground">Permet d'appeler directement depuis l'interface</p>
                </div>
                <Switch
                  id="click_to_call_enabled"
                  checked={config?.click_to_call_enabled !== false}
                  onCheckedChange={(checked) => updateConfig('click_to_call_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto_recording">Enregistrement automatique</Label>
                  <p className="text-sm text-muted-foreground">Enregistre automatiquement tous les appels</p>
                </div>
                <Switch
                  id="auto_recording"
                  checked={config?.auto_recording !== false}
                  onCheckedChange={(checked) => updateConfig('auto_recording', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto_transcription">Transcription automatique</Label>
                  <p className="text-sm text-muted-foreground">Transcrit automatiquement les appels avec Deepgram</p>
                </div>
                <Switch
                  id="auto_transcription"
                  checked={config?.auto_transcription !== false}
                  onCheckedChange={(checked) => updateConfig('auto_transcription', checked)}
                  disabled={!deepgramAvailable}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ai_agent_enabled">Agent IA automatique</Label>
                  <p className="text-sm text-muted-foreground">Active l'agent IA pour les appels automatiques</p>
                </div>
                <Switch
                  id="ai_agent_enabled"
                  checked={config?.ai_agent_enabled || false}
                  onCheckedChange={(checked) => updateConfig('ai_agent_enabled', checked)}
                />
              </div>

              {config?.ai_agent_enabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai_agent_name">Nom de l'agent IA</Label>
                      <Input
                        id="ai_agent_name"
                        value={config?.ai_agent_name || 'Assistant IA'}
                        onChange={(e) => updateConfig('ai_agent_name', e.target.value)}
                        placeholder="Assistant IA"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ai_agent_voice">Voix de l'agent</Label>
                      <Select
                        value={config?.ai_agent_voice || 'alloy'}
                        onValueChange={(value) => updateConfig('ai_agent_voice', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alloy">Alloy (Neutre)</SelectItem>
                          <SelectItem value="echo">Echo (Masculin)</SelectItem>
                          <SelectItem value="fable">Fable (Britannique)</SelectItem>
                          <SelectItem value="onyx">Onyx (Grave)</SelectItem>
                          <SelectItem value="nova">Nova (Féminin)</SelectItem>
                          <SelectItem value="shimmer">Shimmer (Doux)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ai_agent_prompt">Prompt de l'agent IA</Label>
                    <Textarea
                      id="ai_agent_prompt"
                      value={config?.ai_agent_prompt || ''}
                      onChange={(e) => updateConfig('ai_agent_prompt', e.target.value)}
                      placeholder="Instructions pour l'agent IA..."
                      rows={4}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Vapi.ai */}
        <TabsContent value="vapi" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Vapi.ai</CardTitle>
              <CardDescription>
                Paramètres de connexion et configuration de l'assistant IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="vapi_api_key">Clé API Vapi *</Label>
                  <Input
                    id="vapi_api_key"
                    type="password"
                    value={config?.vapi_api_key || ''}
                    onChange={(e) => updateConfig('vapi_api_key', e.target.value)}
                    placeholder="sk-..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vapi_phone_number">Numéro de téléphone Vapi</Label>
                  <Input
                    id="vapi_phone_number"
                    value={config?.vapi_phone_number || ''}
                    onChange={(e) => updateConfig('vapi_phone_number', e.target.value)}
                    placeholder="+33123456789"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vapi_assistant_id">ID Assistant Vapi</Label>
                <Input
                  id="vapi_assistant_id"
                  value={config?.vapi_assistant_id || ''}
                  onChange={(e) => updateConfig('vapi_assistant_id', e.target.value)}
                  placeholder="assistant-..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="agent_name">Nom de l'agent</Label>
                  <Input
                    id="agent_name"
                    value={config?.agent_name || ''}
                    onChange={(e) => updateConfig('agent_name', e.target.value)}
                    placeholder="Assistant Ultron"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent_voice">Voix de l'agent</Label>
                  <Select
                    value={config?.agent_voice}
                    onValueChange={(value) => updateConfig('agent_voice', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une voix" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jennifer">Jennifer (Femme)</SelectItem>
                      <SelectItem value="alex">Alex (Homme)</SelectItem>
                      <SelectItem value="sarah">Sarah (Femme)</SelectItem>
                      <SelectItem value="david">David (Homme)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent_language">Langue</Label>
                  <Select
                    value={config?.agent_language}
                    onValueChange={(value) => updateConfig('agent_language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une langue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr-FR">Français</SelectItem>
                      <SelectItem value="en-US">Anglais (US)</SelectItem>
                      <SelectItem value="en-GB">Anglais (UK)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_enabled"
                  checked={config?.is_enabled || false}
                  onCheckedChange={(checked) => updateConfig('is_enabled', checked)}
                />
                <Label htmlFor="is_enabled">Activer l'Agent IA automatique</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Horaires */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Horaires d'appel</CardTitle>
              <CardDescription>
                Définissez les créneaux horaires pour les appels automatiques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="working_hours_start">Heure de début</Label>
                  <Input
                    id="working_hours_start"
                    type="time"
                    value={config?.working_hours_start || ''}
                    onChange={(e) => updateConfig('working_hours_start', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="working_hours_end">Heure de fin</Label>
                  <Input
                    id="working_hours_end"
                    type="time"
                    value={config?.working_hours_end || ''}
                    onChange={(e) => updateConfig('working_hours_end', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuseau horaire</Label>
                  <Select
                    value={config?.timezone}
                    onValueChange={(value) => updateConfig('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Fuseau horaire" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Jours de travail</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 1, label: 'Lundi' },
                    { value: 2, label: 'Mardi' },
                    { value: 3, label: 'Mercredi' },
                    { value: 4, label: 'Jeudi' },
                    { value: 5, label: 'Vendredi' },
                    { value: 6, label: 'Samedi' },
                    { value: 7, label: 'Dimanche' },
                  ].map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`day-${day.value}`}
                        checked={config?.working_days?.includes(day.value) || false}
                        onChange={(e) => {
                          const currentDays = config?.working_days || [];
                          if (e.target.checked) {
                            updateConfig('working_days', [...currentDays, day.value]);
                          } else {
                            updateConfig(
                              'working_days',
                              currentDays.filter((d: number) => d !== day.value)
                            );
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`day-${day.value}`} className="text-sm font-normal">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Scripts */}
        <TabsContent value="scripts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scripts de conversation</CardTitle>
              <CardDescription>
                Configurez les prompts et questions de l'agent IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="system_prompt">Prompt système</Label>
                <Textarea
                  id="system_prompt"
                  rows={4}
                  value={config?.system_prompt || ''}
                  onChange={(e) => updateConfig('system_prompt', e.target.value)}
                  placeholder="Instructions pour l'agent IA..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualification_questions">Questions de qualification (une par ligne)</Label>
                <Textarea
                  id="qualification_questions"
                  rows={6}
                  value={config?.qualification_questions?.join('\n') || ''}
                  onChange={(e) => updateConfig(
                    'qualification_questions',
                    e.target.value.split('\n').filter(q => q.trim())
                  )}
                  placeholder="Quel est votre situation professionnelle actuelle ?\nAvez-vous déjà des placements ou investissements ?"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="max_call_duration_seconds">Durée max d'appel (secondes)</Label>
                  <Input
                    id="max_call_duration_seconds"
                    type="number"
                    value={config?.max_call_duration_seconds || ''}
                    onChange={(e) => updateConfig('max_call_duration_seconds', parseInt(e.target.value))}
                    placeholder="300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_retry_attempts">Tentatives de rappel max</Label>
                  <Input
                    id="max_retry_attempts"
                    type="number"
                    value={config?.max_retry_attempts || ''}
                    onChange={(e) => updateConfig('max_retry_attempts', parseInt(e.target.value))}
                    placeholder="2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delay_between_retries_minutes">Délai entre rappels (minutes)</Label>
                  <Input
                    id="delay_between_retries_minutes"
                    type="number"
                    value={config?.delay_between_retries_minutes || ''}
                    onChange={(e) => updateConfig('delay_between_retries_minutes', parseInt(e.target.value))}
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="retry_on_no_answer"
                  checked={config?.retry_on_no_answer || false}
                  onCheckedChange={(checked) => updateConfig('retry_on_no_answer', checked)}
                />
                <Label htmlFor="retry_on_no_answer">Rappeler si pas de réponse</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Webhooks */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Webhooks</CardTitle>
              <CardDescription>
                URLs pour recevoir les événements des appels et formulaires
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="webhook_url">URL Webhook</Label>
                <Input
                  id="webhook_url"
                  value={config?.webhook_url || ''}
                  onChange={(e) => updateConfig('webhook_url', e.target.value)}
                  placeholder="https://votre-domaine.com/api/voice/ai-agent/vapi-webhook"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook_secret">Secret Webhook</Label>
                <Input
                  id="webhook_secret"
                  type="password"
                  value={config?.webhook_secret || ''}
                  onChange={(e) => updateConfig('webhook_secret', e.target.value)}
                  placeholder="Secret pour sécuriser les webhooks"
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">URLs Webhook Ultron :</h4>
                <div className="space-y-1 text-sm font-mono">
                  <div>• Vapi Events: <code>/api/voice/ai-agent/vapi-webhook</code></div>
                  <div>• Form Submissions: <code>/api/voice/ai-agent/webhook</code></div>
                  <div>• Twilio Events: <code>/api/voice/click-to-call/twilio-webhook</code></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={fetchConfig} disabled={loading}>
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
        </Button>
      </div>
    </div>
  );
}