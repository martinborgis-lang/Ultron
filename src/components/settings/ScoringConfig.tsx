'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, RotateCcw, AlertTriangle, Info } from 'lucide-react';

interface ScoringConfigData {
  poids_analyse_ia: number;
  poids_patrimoine: number;
  poids_revenus: number;
  seuil_patrimoine_min: number;
  seuil_patrimoine_max: number;
  seuil_revenus_min: number;
  seuil_revenus_max: number;
  seuil_chaud: number;
  seuil_tiede: number;
}

const DEFAULT_CONFIG: ScoringConfigData = {
  poids_analyse_ia: 50,
  poids_patrimoine: 25,
  poids_revenus: 25,
  seuil_patrimoine_min: 30000,
  seuil_patrimoine_max: 300000,
  seuil_revenus_min: 2500,
  seuil_revenus_max: 10000,
  seuil_chaud: 70,
  seuil_tiede: 40,
};

export function ScoringConfig() {
  const [config, setConfig] = useState<ScoringConfigData>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/organization/scoring');
      const data = await response.json();
      if (data.config) {
        setConfig({ ...DEFAULT_CONFIG, ...data.config });
      }
    } catch (error) {
      console.error('Erreur fetch config:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    const totalPoids = config.poids_analyse_ia + config.poids_patrimoine + config.poids_revenus;
    if (totalPoids !== 100) {
      setMessage({
        type: 'error',
        text: `La somme des poids doit être égale à 100% (actuellement ${totalPoids}%)`,
      });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/organization/scoring', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Configuration sauvegardée. Les nouvelles pondérations seront appliquées aux prochaines qualifications.',
        });
      } else {
        throw new Error('Erreur sauvegarde');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Impossible de sauvegarder la configuration',
      });
    }
    setSaving(false);
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    setMessage({
      type: 'success',
      text: "Configuration réinitialisée. N'oubliez pas de sauvegarder.",
    });
  };

  const updatePoids = (
    field: 'poids_analyse_ia' | 'poids_patrimoine' | 'poids_revenus',
    value: number
  ) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const totalPoids = config.poids_analyse_ia + config.poids_patrimoine + config.poids_revenus;
  const poidsValid = totalPoids === 100;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calcul exemple
  const exemplePatrimoine = 150000;
  const exempleRevenus = 5000;
  const exempleAI = 75;

  const scorePatrimoineExemple = Math.round(
    Math.min(
      100,
      Math.max(
        0,
        ((exemplePatrimoine - config.seuil_patrimoine_min) /
          (config.seuil_patrimoine_max - config.seuil_patrimoine_min)) *
          100
      )
    )
  );

  const scoreRevenusExemple = Math.round(
    Math.min(
      100,
      Math.max(
        0,
        ((exempleRevenus - config.seuil_revenus_min) /
          (config.seuil_revenus_max - config.seuil_revenus_min)) *
          100
      )
    )
  );

  const scoreFinalExemple = Math.round(
    exempleAI * (config.poids_analyse_ia / 100) +
      scorePatrimoineExemple * (config.poids_patrimoine / 100) +
      scoreRevenusExemple * (config.poids_revenus / 100)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuration du Scoring</h1>
          <p className="text-muted-foreground">
            Personnalisez la pondération de la qualification des prospects
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button onClick={handleSave} disabled={saving || !poidsValid}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Le score final (0-100) détermine la qualification : <strong>CHAUD</strong> (≥
          {config.seuil_chaud}),<strong> TIÈDE</strong> (≥{config.seuil_tiede}),{' '}
          <strong>FROID</strong> (&lt;{config.seuil_tiede}). Les modifications
          s&apos;appliqueront aux prochaines qualifications.
        </AlertDescription>
      </Alert>

      {/* Pondération des critères */}
      <Card>
        <CardHeader>
          <CardTitle>Pondération des critères</CardTitle>
          <CardDescription>
            Répartissez l&apos;importance de chaque critère dans le score final (total = 100%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!poidsValid && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                La somme des poids doit être égale à 100% (actuellement {totalPoids}%)
              </AlertDescription>
            </Alert>
          )}

          {/* Poids Analyse IA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Analyse IA de la conversation</Label>
              <span className="text-2xl font-bold text-primary">
                {config.poids_analyse_ia}%
              </span>
            </div>
            <Slider
              value={[config.poids_analyse_ia]}
              onValueChange={([value]) => updatePoids('poids_analyse_ia', value)}
              max={100}
              step={5}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Basé sur les besoins exprimés, les notes d&apos;appel, et l&apos;intention
              détectée par l&apos;IA
            </p>
          </div>

          {/* Poids Patrimoine */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Patrimoine déclaré</Label>
              <span className="text-2xl font-bold text-primary">
                {config.poids_patrimoine}%
              </span>
            </div>
            <Slider
              value={[config.poids_patrimoine]}
              onValueChange={([value]) => updatePoids('poids_patrimoine', value)}
              max={100}
              step={5}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Basé sur le patrimoine renseigné par le prospect
            </p>
          </div>

          {/* Poids Revenus */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Revenus mensuels</Label>
              <span className="text-2xl font-bold text-primary">{config.poids_revenus}%</span>
            </div>
            <Slider
              value={[config.poids_revenus]}
              onValueChange={([value]) => updatePoids('poids_revenus', value)}
              max={100}
              step={5}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Basé sur les revenus mensuels du prospect
            </p>
          </div>

          {/* Récap visuel */}
          <div className="flex items-center gap-1 pt-4 border-t">
            <div
              className="h-4 bg-primary rounded-l"
              style={{ width: `${config.poids_analyse_ia}%` }}
              title={`Analyse IA: ${config.poids_analyse_ia}%`}
            />
            <div
              className="h-4 bg-green-500"
              style={{ width: `${config.poids_patrimoine}%` }}
              title={`Patrimoine: ${config.poids_patrimoine}%`}
            />
            <div
              className="h-4 bg-blue-500 rounded-r"
              style={{ width: `${config.poids_revenus}%` }}
              title={`Revenus: ${config.poids_revenus}%`}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Analyse IA ({config.poids_analyse_ia}%)</span>
            <span>Patrimoine ({config.poids_patrimoine}%)</span>
            <span>Revenus ({config.poids_revenus}%)</span>
          </div>
        </CardContent>
      </Card>

      {/* Seuils financiers */}
      <Card>
        <CardHeader>
          <CardTitle>Seuils financiers</CardTitle>
          <CardDescription>
            Définissez ce que vous considérez comme un patrimoine/revenus
            &quot;intéressant&quot;
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Patrimoine */}
            <div className="space-y-4">
              <h4 className="font-medium">Patrimoine</h4>
              <div className="space-y-2">
                <Label htmlFor="patrimoine_min">Seuil minimum (score 0%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="patrimoine_min"
                    type="number"
                    value={config.seuil_patrimoine_min}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        seuil_patrimoine_min: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full"
                  />
                  <span className="text-muted-foreground">€</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  En dessous de {formatCurrency(config.seuil_patrimoine_min)}, le score
                  patrimoine = 0%
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="patrimoine_max">Seuil maximum (score 100%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="patrimoine_max"
                    type="number"
                    value={config.seuil_patrimoine_max}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        seuil_patrimoine_max: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full"
                  />
                  <span className="text-muted-foreground">€</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Au dessus de {formatCurrency(config.seuil_patrimoine_max)}, le score
                  patrimoine = 100%
                </p>
              </div>
            </div>

            {/* Revenus */}
            <div className="space-y-4">
              <h4 className="font-medium">Revenus mensuels</h4>
              <div className="space-y-2">
                <Label htmlFor="revenus_min">Seuil minimum (score 0%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="revenus_min"
                    type="number"
                    value={config.seuil_revenus_min}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        seuil_revenus_min: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full"
                  />
                  <span className="text-muted-foreground">€/mois</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  En dessous de {formatCurrency(config.seuil_revenus_min)}/mois, le score
                  revenus = 0%
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="revenus_max">Seuil maximum (score 100%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="revenus_max"
                    type="number"
                    value={config.seuil_revenus_max}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        seuil_revenus_max: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full"
                  />
                  <span className="text-muted-foreground">€/mois</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Au dessus de {formatCurrency(config.seuil_revenus_max)}/mois, le score
                  revenus = 100%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seuils de qualification */}
      <Card>
        <CardHeader>
          <CardTitle>Seuils de qualification</CardTitle>
          <CardDescription>
            Définissez les scores qui déterminent CHAUD, TIÈDE ou FROID
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="seuil_chaud" className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                Seuil CHAUD (score minimum)
              </Label>
              <Input
                id="seuil_chaud"
                type="number"
                min={0}
                max={100}
                value={config.seuil_chaud}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    seuil_chaud: parseInt(e.target.value) || 70,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Score ≥ {config.seuil_chaud} → Prospect CHAUD
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seuil_tiede" className="flex items-center gap-2">
                <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                Seuil TIÈDE (score minimum)
              </Label>
              <Input
                id="seuil_tiede"
                type="number"
                min={0}
                max={100}
                value={config.seuil_tiede}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    seuil_tiede: parseInt(e.target.value) || 40,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Score ≥ {config.seuil_tiede} et &lt; {config.seuil_chaud} → Prospect TIÈDE
              </p>
            </div>
          </div>

          {/* Visualisation des seuils */}
          <div className="pt-4 border-t">
            <div className="relative h-8 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-blue-500"
                style={{ width: `${config.seuil_tiede}%` }}
              />
              <div
                className="absolute top-0 h-full bg-orange-500"
                style={{
                  left: `${config.seuil_tiede}%`,
                  width: `${config.seuil_chaud - config.seuil_tiede}%`,
                }}
              />
              <div
                className="absolute top-0 h-full bg-red-500"
                style={{
                  left: `${config.seuil_chaud}%`,
                  width: `${100 - config.seuil_chaud}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs mt-2">
              <span>0 - FROID</span>
              <span>{config.seuil_tiede} - TIÈDE</span>
              <span>{config.seuil_chaud} - CHAUD</span>
              <span>100</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exemple de calcul */}
      <Card>
        <CardHeader>
          <CardTitle>Exemple de calcul</CardTitle>
          <CardDescription>Avec votre configuration actuelle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <p>
              <strong>Prospect exemple :</strong>
            </p>
            <p>
              • Patrimoine : 150 000€ → Score patrimoine : {scorePatrimoineExemple}%
            </p>
            <p>
              • Revenus : 5 000€/mois → Score revenus : {scoreRevenusExemple}%
            </p>
            <p>• Analyse IA : 75% (besoins clairs, intention forte)</p>
            <p className="pt-2 border-t font-medium">
              Score final = ({exempleAI} × {config.poids_analyse_ia / 100}) + (
              {scorePatrimoineExemple} × {config.poids_patrimoine / 100}) + (
              {scoreRevenusExemple} × {config.poids_revenus / 100}) ={' '}
              <strong>{scoreFinalExemple}</strong> →{' '}
              <strong>
                {scoreFinalExemple >= config.seuil_chaud
                  ? 'CHAUD'
                  : scoreFinalExemple >= config.seuil_tiede
                    ? 'TIÈDE'
                    : 'FROID'}
              </strong>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
