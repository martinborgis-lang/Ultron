'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, Clock, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface EmailRecapSettings {
  email_recap_enabled: boolean;
  email_recap_delay_hours: number;
}

interface ScheduledEmailStats {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  cancelled: number;
}

export function EmailRecapConfig() {
  const [settings, setSettings] = useState<EmailRecapSettings>({
    email_recap_enabled: true,
    email_recap_delay_hours: 2
  });
  const [stats, setStats] = useState<ScheduledEmailStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', content: string } | null>(null);

  // Charger les paramètres actuels au montage
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/organization/email-settings');

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des paramètres');
      }

      const data = await response.json();
      setSettings(data);
    } catch (error: any) {
      setMessage({ type: 'error', content: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      setMessage(null);

      const response = await fetch('/api/organization/email-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la sauvegarde');
      }

      const result = await response.json();
      setSettings(result.settings);
      setMessage({ type: 'success', content: 'Paramètres sauvegardés avec succès !' });

      // Auto-clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);

    } catch (error: any) {
      setMessage({ type: 'error', content: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof EmailRecapSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getDelayLabel = (hours: number) => {
    if (hours < 24) {
      return `${hours}h après le RDV`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      if (remainingHours === 0) {
        return `${days} jour${days > 1 ? 's' : ''} après le RDV`;
      } else {
        return `${days}j ${remainingHours}h après le RDV`;
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Emails récapitulatifs post-RDV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Emails récapitulatifs post-RDV
          </CardTitle>
          <CardDescription>
            Configuration de l'envoi automatique d'emails récapitulatifs avec délai personnalisable après les rendez-vous
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Message de feedback */}
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message.content}</AlertDescription>
            </Alert>
          )}

          {/* Activation/Désactivation */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label htmlFor="email-recap-enabled" className="text-base font-medium">
                Activer les emails récapitulatifs
              </Label>
              <p className="text-sm text-muted-foreground">
                Envoie automatiquement un email de synthèse aux prospects après un RDV
              </p>
            </div>
            <Switch
              id="email-recap-enabled"
              checked={settings.email_recap_enabled}
              onCheckedChange={(checked) => updateSetting('email_recap_enabled', checked)}
            />
          </div>

          {/* Configuration du délai */}
          {settings.email_recap_enabled && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Délai d'envoi après le RDV
                </Label>
                <Select
                  value={settings.email_recap_delay_hours.toString()}
                  onValueChange={(value) => updateSetting('email_recap_delay_hours', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 heure après</SelectItem>
                    <SelectItem value="2">2 heures après</SelectItem>
                    <SelectItem value="4">4 heures après</SelectItem>
                    <SelectItem value="8">8 heures après</SelectItem>
                    <SelectItem value="12">12 heures après</SelectItem>
                    <SelectItem value="24">24 heures après (1 jour)</SelectItem>
                    <SelectItem value="48">48 heures après (2 jours)</SelectItem>
                    <SelectItem value="72">72 heures après (3 jours)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Email prévu: <strong>{getDelayLabel(settings.email_recap_delay_hours)}</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium text-green-700">✅ Contenu de l'email :</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                    <li>Résumé et analyse IA du prospect</li>
                    <li>Qualification automatique (CHAUD/TIÈDE/FROID)</li>
                    <li>Lien Google Meet si RDV programmé</li>
                    <li>Envoyé avec l'adresse du conseiller</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-700">ℹ️ Informations techniques :</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                    <li>Emails traités toutes les 15 minutes</li>
                    <li>3 tentatives automatiques en cas d'échec</li>
                    <li>Historique complet dans les logs</li>
                    <li>Désactivable à tout moment</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button
              onClick={saveSettings}
              disabled={isSaving}
              className="min-w-[120px]"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  Sauvegarde...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Sauvegarder
                </div>
              )}
            </Button>
            <Button variant="outline" onClick={loadSettings} disabled={isLoading || isSaving}>
              Annuler les modifications
            </Button>
          </div>

          {/* Aide contextuelle */}
          {!settings.email_recap_enabled && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Les emails récapitulatifs sont désactivés. Les prospects ne recevront pas d'email automatique après les RDV.
                Vous pouvez toujours envoyer des emails manuellement depuis le CRM.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Statistiques des emails programmés (pour les admins) */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4" />
              Statistiques emails programmés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">En attente</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
                <div className="text-xs text-muted-foreground">Envoyés</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <div className="text-xs text-muted-foreground">Échecs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.cancelled}</div>
                <div className="text-xs text-muted-foreground">Annulés</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}