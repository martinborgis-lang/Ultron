'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  AlertTriangle, Target, Activity, TrendingUp, Palette, BarChart3, Save, RotateCcw
} from 'lucide-react';

interface ThresholdConfig {
  // Alertes
  alert_low_conversion: number;
  alert_inactive_days: number;
  alert_no_show_rate: number;

  // Performance badges
  performance_excellent_conversion: number;
  performance_good_conversion: number;
  performance_high_activity_7d: number;
  performance_high_activity_30d: number;
  performance_high_activity_90d: number;
  performance_medium_activity_7d: number;
  performance_medium_activity_30d: number;
  performance_medium_activity_90d: number;

  // Couleurs entonnoir
  funnel_excellent: number;
  funnel_very_good: number;
  funnel_good: number;
  funnel_medium: number;
  funnel_poor: number;

  // Activity heatmap
  activity_weak_max: number;
  activity_moderate_max: number;
  activity_high_max: number;

  // Tendances
  trend_positive_threshold: number;
  trend_negative_threshold: number;

  // Dashboard insights
  dashboard_excellent_conversion: number;
  dashboard_good_conversion: number;
}

interface ThresholdConfigFormProps {
  organizationId: string;
  initialThresholds: ThresholdConfig;
}

export function ThresholdConfigForm({ organizationId, initialThresholds }: ThresholdConfigFormProps) {
  const [thresholds, setThresholds] = useState<ThresholdConfig>(initialThresholds);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          thresholds
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      toast.success('Seuils mis à jour avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour des seuils');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setThresholds(initialThresholds);
    toast.info('Seuils réinitialisés aux valeurs par défaut');
  };

  const updateThreshold = (key: keyof ThresholdConfig, value: number) => {
    setThresholds(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Alertes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Seuils d'Alertes
          </CardTitle>
          <CardDescription>
            Configurez quand des alertes doivent être déclenchées dans le dashboard admin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Conversion faible (%)</Label>
              <Input
                type="number"
                value={thresholds.alert_low_conversion}
                onChange={(e) => updateThreshold('alert_low_conversion', parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Alerte si conversion RDV→Deals &lt; ce seuil
              </p>
            </div>
            <div>
              <Label>Jours d'inactivité</Label>
              <Input
                type="number"
                value={thresholds.alert_inactive_days}
                onChange={(e) => updateThreshold('alert_inactive_days', parseInt(e.target.value) || 0)}
                min="1"
                max="30"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Alerte si conseiller inactif depuis X jours
              </p>
            </div>
            <div>
              <Label>Taux no-show RDV (%)</Label>
              <Input
                type="number"
                value={thresholds.alert_no_show_rate}
                onChange={(e) => updateThreshold('alert_no_show_rate', parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Alerte si taux RDV ratés &gt; ce seuil
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Badges de Performance
          </CardTitle>
          <CardDescription>
            Seuils pour attribuer les badges "Excellent" et "Bon" aux conseillers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">Conversion (RDV → Deals)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Excellent (%)</Label>
                <Input
                  type="number"
                  value={thresholds.performance_excellent_conversion}
                  onChange={(e) => updateThreshold('performance_excellent_conversion', parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div>
                <Label>Bon (%)</Label>
                <Input
                  type="number"
                  value={thresholds.performance_good_conversion}
                  onChange={(e) => updateThreshold('performance_good_conversion', parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-3">Activité (jours actifs par période)</h4>
            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-2">7 jours</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Activité élevée</Label>
                    <Input
                      type="number"
                      value={thresholds.performance_high_activity_7d}
                      onChange={(e) => updateThreshold('performance_high_activity_7d', parseInt(e.target.value) || 0)}
                      min="1"
                      max="7"
                    />
                  </div>
                  <div>
                    <Label>Activité moyenne</Label>
                    <Input
                      type="number"
                      value={thresholds.performance_medium_activity_7d}
                      onChange={(e) => updateThreshold('performance_medium_activity_7d', parseInt(e.target.value) || 0)}
                      min="1"
                      max="7"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-2">30 jours</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Activité élevée</Label>
                    <Input
                      type="number"
                      value={thresholds.performance_high_activity_30d}
                      onChange={(e) => updateThreshold('performance_high_activity_30d', parseInt(e.target.value) || 0)}
                      min="1"
                      max="30"
                    />
                  </div>
                  <div>
                    <Label>Activité moyenne</Label>
                    <Input
                      type="number"
                      value={thresholds.performance_medium_activity_30d}
                      onChange={(e) => updateThreshold('performance_medium_activity_30d', parseInt(e.target.value) || 0)}
                      min="1"
                      max="30"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-2">90 jours</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Activité élevée</Label>
                    <Input
                      type="number"
                      value={thresholds.performance_high_activity_90d}
                      onChange={(e) => updateThreshold('performance_high_activity_90d', parseInt(e.target.value) || 0)}
                      min="1"
                      max="90"
                    />
                  </div>
                  <div>
                    <Label>Activité moyenne</Label>
                    <Input
                      type="number"
                      value={thresholds.performance_medium_activity_90d}
                      onChange={(e) => updateThreshold('performance_medium_activity_90d', parseInt(e.target.value) || 0)}
                      min="1"
                      max="90"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Couleurs Entonnoir */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-green-500" />
            Couleurs Entonnoir de Conversion
          </CardTitle>
          <CardDescription>
            Seuils pour le dégradé vert → rouge dans l'entonnoir (ordre décroissant)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <Label className="text-green-700 dark:text-green-300">Excellent (%)</Label>
              <Input
                type="number"
                value={thresholds.funnel_excellent}
                onChange={(e) => updateThreshold('funnel_excellent', parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                className="border-green-300"
              />
            </div>
            <div>
              <Label className="text-lime-700 dark:text-lime-300">Très bon (%)</Label>
              <Input
                type="number"
                value={thresholds.funnel_very_good}
                onChange={(e) => updateThreshold('funnel_very_good', parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                className="border-lime-300"
              />
            </div>
            <div>
              <Label className="text-yellow-700 dark:text-yellow-300">Bon (%)</Label>
              <Input
                type="number"
                value={thresholds.funnel_good}
                onChange={(e) => updateThreshold('funnel_good', parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                className="border-yellow-300"
              />
            </div>
            <div>
              <Label className="text-orange-700 dark:text-orange-300">Moyen (%)</Label>
              <Input
                type="number"
                value={thresholds.funnel_medium}
                onChange={(e) => updateThreshold('funnel_medium', parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                className="border-orange-300"
              />
            </div>
            <div>
              <Label className="text-red-700 dark:text-red-300">Faible (%)</Label>
              <Input
                type="number"
                value={thresholds.funnel_poor}
                onChange={(e) => updateThreshold('funnel_poor', parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                className="border-red-300"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Valeurs ≥ Excellent = vert foncé, ≥ Très bon = vert, ≥ Bon = vert clair, ≥ Moyen = orange, ≥ Faible = rouge clair, &lt; Faible = rouge foncé
          </p>
        </CardContent>
      </Card>

      {/* Activity Heatmap & Tendances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              Heatmap d'Activité
            </CardTitle>
            <CardDescription>
              Seuils pour les niveaux d'activité (score = appels×2 + emails×1 + meetings×3)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Activité faible (max)</Label>
              <Input
                type="number"
                value={thresholds.activity_weak_max}
                onChange={(e) => updateThreshold('activity_weak_max', parseInt(e.target.value) || 0)}
                min="0"
                max="50"
              />
            </div>
            <div>
              <Label>Activité modérée (max)</Label>
              <Input
                type="number"
                value={thresholds.activity_moderate_max}
                onChange={(e) => updateThreshold('activity_moderate_max', parseInt(e.target.value) || 0)}
                min="0"
                max="50"
              />
            </div>
            <div>
              <Label>Activité élevée (max)</Label>
              <Input
                type="number"
                value={thresholds.activity_high_max}
                onChange={(e) => updateThreshold('activity_high_max', parseInt(e.target.value) || 0)}
                min="0"
                max="50"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Au-delà = Activité intense. 0 = Aucune activité.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Indicateurs de Tendance
            </CardTitle>
            <CardDescription>
              Seuils pour les flèches de tendance (croissance/décroissance)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tendance positive (%)</Label>
              <Input
                type="number"
                value={thresholds.trend_positive_threshold}
                onChange={(e) => updateThreshold('trend_positive_threshold', parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Croissance ≥ ce seuil = flèche verte ↗
              </p>
            </div>
            <div>
              <Label>Tendance négative (%)</Label>
              <Input
                type="number"
                value={thresholds.trend_negative_threshold}
                onChange={(e) => updateThreshold('trend_negative_threshold', parseFloat(e.target.value) || 0)}
                min="-100"
                max="0"
                step="0.1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Décroissance ≤ ce seuil = flèche rouge ↘
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-500" />
            Insights Dashboard
          </CardTitle>
          <CardDescription>
            Seuils pour les insights globaux affichés dans le dashboard admin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Conversion excellente (%)</Label>
              <Input
                type="number"
                value={thresholds.dashboard_excellent_conversion}
                onChange={(e) => updateThreshold('dashboard_excellent_conversion', parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div>
              <Label>Conversion bonne (%)</Label>
              <Input
                type="number"
                value={thresholds.dashboard_good_conversion}
                onChange={(e) => updateThreshold('dashboard_good_conversion', parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-6">
        <Button onClick={handleSave} disabled={isLoading} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={isLoading} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Réinitialiser
        </Button>
      </div>
    </div>
  );
}