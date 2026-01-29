'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calculator,
  HelpCircle,
  RotateCcw,
  Search,
  User,
  FileText,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Percent,
  Euro,
  Users
} from 'lucide-react';
import {
  ProspectProfile,
  InvestmentProject,
  SituationFamiliale,
  ProductType,
  FiscalSimulationOutput,
  ProspectForFiscal,
  MissingFieldConfig,
  ChartDataPoint
} from '@/types/fiscalite';

const SITUATION_FAMILIALE_OPTIONS = [
  { value: 'CELIB', label: 'Célibataire' },
  { value: 'MARIE_PACSE', label: 'Marié(e) / Pacsé(e)' },
  { value: 'DIV_SEP', label: 'Divorcé(e) / Séparé(e)' },
  { value: 'VEUF', label: 'Veuf/Veuve' },
  { value: 'CONCUB', label: 'Union libre (déclarations séparées)' },
] as const;

const PRODUCT_OPTIONS = [
  { value: 'CTO', label: 'CTO', description: 'Compte-Titres Ordinaire' },
  { value: 'PEA', label: 'PEA', description: 'Plan d\'Épargne en Actions' },
  { value: 'AV', label: 'Assurance-Vie', description: 'Contrat d\'assurance-vie' },
  { value: 'PER', label: 'PER', description: 'Plan d\'Épargne Retraite' },
  { value: 'SCPI', label: 'SCPI', description: 'Société Civile Placement Immobilier' },
  { value: 'MALRAUX', label: 'Malraux', description: 'Investissement Malraux' },
] as const;

const DEFAULT_PROFILE: ProspectProfile = {
  residence_fiscale_fr: true,
  situation_famille: 'CELIB',
  nb_enfants_charge: 0,
  revenu_net_imposable_foyer: 50000,
  revenus_activite_nets: 50000,
  revenus_fonciers_existants: 0,
};

const DEFAULT_INVESTMENT: InvestmentProject = {
  montant_invest: 10000,
  horizon_years: 10,
  hyp_r: 0.04,
  scpi_rendement_yield: 0.045,
  av_primes_total_estime: '<150k',
  malraux_taux: 22,
  malraux_travaux_eligibles: 100000,
  tmi_sortie_mode: 'TMI_ACTUEL',
};

const MISSING_FIELD_CONFIGS: MissingFieldConfig[] = [
  {
    field_name: 'revenus_activite_nets',
    label: 'Revenus d\'activité nets',
    type: 'number',
    required: true,
    tooltip: 'Revenus salariaux nets de frais professionnels (pour calcul plafond PER)',
    min: 0,
  },
  {
    field_name: 'revenus_fonciers_existants',
    label: 'Revenus fonciers existants',
    type: 'number',
    required: false,
    tooltip: 'Revenus fonciers bruts actuels (pour micro-foncier)',
    min: 0,
  },
  {
    field_name: 'plafond_per_disponible',
    label: 'Plafond PER disponible',
    type: 'number',
    required: false,
    tooltip: 'Plafond PER selon avis d\'impôt (plus précis)',
    min: 0,
  },
  {
    field_name: 'parent_isole_case_T',
    label: 'Parent isolé (case T)',
    type: 'boolean',
    required: false,
    tooltip: 'Case T cochée sur déclaration (demi-part supplémentaire)',
  },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function TooltipLabel({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Label>{label}</Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

interface ProspectSearchProps {
  onSelectProspect: (prospect: ProspectForFiscal | null) => void;
  selectedProspect: ProspectForFiscal | null;
}

function ProspectSearch({ onSelectProspect, selectedProspect }: ProspectSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [prospects, setProspects] = useState<ProspectForFiscal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchProspects = async () => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    try {
      // Recherche dans les prospects existants
      const response = await fetch(`/api/prospects/unified?search=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data); // Debug

        // L'API unified retourne soit un array direct, soit un objet avec data
        let prospectsData = [];
        if (Array.isArray(data)) {
          prospectsData = data;
        } else if (data.data && Array.isArray(data.data)) {
          prospectsData = data.data;
        } else if (data.prospects && Array.isArray(data.prospects)) {
          prospectsData = data.prospects;
        }

        // Mapper vers le format ProspectForFiscal attendu
        const mappedProspects = prospectsData.map((prospect: any) => ({
          id: prospect.id,
          first_name: prospect.firstName || prospect.first_name,
          last_name: prospect.lastName || prospect.last_name,
          email: prospect.email,
          phone: prospect.phone,
          revenus_annuels: prospect.revenusAnnuels || prospect.revenus_annuels,
          patrimoine_estime: prospect.patrimoineEstime || prospect.patrimoine_estime,
          situation_familiale: prospect.situationFamiliale || prospect.situation_familiale,
          nb_enfants: prospect.nbEnfants || prospect.nb_enfants,
          age: prospect.age,
          profession: prospect.profession,
          missing_fiscal_data: [] // À compléter selon les champs manquants
        }));

        setProspects(mappedProspects);
      } else {
        console.error('Erreur API:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Erreur recherche prospects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Nom, email ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchProspects()}
          />
        </div>
        <Button onClick={searchProspects} disabled={isLoading}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {selectedProspect && (
        <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/30">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">
                {selectedProspect.first_name} {selectedProspect.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{selectedProspect.email}</p>
              {selectedProspect.missing_fiscal_data && selectedProspect.missing_fiscal_data.length > 0 && (
                <Badge variant="outline" className="mt-2">
                  {selectedProspect.missing_fiscal_data.length} champs à compléter
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => onSelectProspect(null)}>
              Changer
            </Button>
          </div>
        </div>
      )}

      {prospects.length > 0 && !selectedProspect && (
        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
          {prospects.map((prospect) => (
            <div
              key={prospect.id}
              className="p-2 hover:bg-muted rounded cursor-pointer"
              onClick={() => onSelectProspect(prospect)}
            >
              <p className="font-medium text-sm">
                {prospect.first_name} {prospect.last_name}
              </p>
              <p className="text-xs text-muted-foreground">{prospect.email}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface MissingFieldsFormProps {
  missingFields: string[];
  profile: ProspectProfile;
  onUpdateProfile: (updates: Partial<ProspectProfile>) => void;
}

function MissingFieldsForm({ missingFields, profile, onUpdateProfile }: MissingFieldsFormProps) {
  if (missingFields.length === 0) return null;

  const relevantConfigs = MISSING_FIELD_CONFIGS.filter(config =>
    missingFields.includes(config.field_name)
  );

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader>
        <CardTitle className="text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Champs manquants pour calcul fiscal
        </CardTitle>
        <CardDescription>
          Complétez ces informations pour améliorer la précision du calcul
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {relevantConfigs.map((config) => (
          <div key={config.field_name} className="space-y-2">
            <TooltipLabel label={config.label} tooltip={config.tooltip} />

            {config.type === 'number' && (
              <div className="relative">
                <Input
                  type="number"
                  min={config.min}
                  max={config.max}
                  value={
                    typeof profile[config.field_name as keyof ProspectProfile] === 'number'
                      ? String(profile[config.field_name as keyof ProspectProfile])
                      : ''
                  }
                  onChange={(e) => onUpdateProfile({
                    [config.field_name]: e.target.value ? Number(e.target.value) : undefined
                  })}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  €
                </span>
              </div>
            )}

            {config.type === 'boolean' && (
              <Select
                value={profile[config.field_name as keyof ProspectProfile] ? 'true' : 'false'}
                onValueChange={(value: string) => onUpdateProfile({
                  [config.field_name]: value === 'true'
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Non</SelectItem>
                  <SelectItem value="true">Oui</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function FiscalCalculator() {
  const [activeTab, setActiveTab] = useState<'prospect' | 'manual'>('prospect');
  const [selectedProspect, setSelectedProspect] = useState<ProspectForFiscal | null>(null);
  const [profile, setProfile] = useState<ProspectProfile>(DEFAULT_PROFILE);
  const [investment, setInvestment] = useState<InvestmentProject>(DEFAULT_INVESTMENT);
  const [selectedProducts, setSelectedProducts] = useState<ProductType[]>(['CTO', 'PEA', 'AV', 'PER']);
  const [simulationResult, setSimulationResult] = useState<FiscalSimulationOutput | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calcul automatique des champs manquants
  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (!profile.revenus_activite_nets) missing.push('revenus_activite_nets');
    if (profile.revenus_fonciers_existants === undefined) missing.push('revenus_fonciers_existants');
    if (!profile.plafond_per_disponible) missing.push('plafond_per_disponible');
    return missing;
  }, [profile]);

  // Mise à jour du profil depuis prospect sélectionné
  useEffect(() => {
    if (selectedProspect) {
      setProfile(prev => ({
        ...prev,
        revenu_net_imposable_foyer: selectedProspect.revenus_annuels || prev.revenu_net_imposable_foyer,
        revenus_activite_nets: selectedProspect.revenus_annuels || prev.revenus_activite_nets,
        nb_enfants_charge: selectedProspect.nb_enfants || 0,
        age: selectedProspect.age,
        profession: selectedProspect.profession,
        situation_famille: (selectedProspect.situation_familiale as SituationFamiliale) || 'CELIB',
      }));
    }
  }, [selectedProspect]);

  const runSimulation = async () => {
    setIsCalculating(true);
    try {
      const response = await fetch('/api/fiscal/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospect_profile: profile,
          investment_project: investment,
          products: selectedProducts,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSimulationResult(result);
      } else {
        console.error('Erreur simulation fiscale');
      }
    } catch (error) {
      console.error('Erreur simulation:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const resetForm = () => {
    setProfile(DEFAULT_PROFILE);
    setInvestment(DEFAULT_INVESTMENT);
    setSelectedProspect(null);
    setSimulationResult(null);
  };

  const handleNumberInput = (
    value: string,
    setter: (val: number) => void,
    min = 0,
    max = Infinity
  ) => {
    const num = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!isNaN(num)) {
      setter(Math.min(Math.max(num, min), max));
    } else if (value === '') {
      setter(0);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Calculateur de Défiscalisation
          </h1>
          <p className="text-muted-foreground mt-1">
            Simulez l&apos;impact fiscal de vos produits d&apos;épargne par profil client
          </p>
        </div>
        <Button variant="outline" onClick={resetForm} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Réinitialiser
        </Button>
      </div>

      {/* Disclaimer */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="pt-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>⚠️ Estimation indicative</strong> - Ne constitue pas un conseil fiscal.
            Hypothèse rendement utilisée uniquement pour comparer l&apos;assiette taxable.
            Certaines règles dépendent de plafonds/encours spécifiques.
          </p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Configuration */}
        <div className="lg:col-span-5 space-y-6">
          {/* Sélection prospect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Prospect
              </CardTitle>
              <CardDescription>
                Sélectionnez un prospect existant ou saisissez manuellement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'prospect' | 'manual')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="prospect">Prospect CRM</TabsTrigger>
                  <TabsTrigger value="manual">Saisie manuelle</TabsTrigger>
                </TabsList>

                <TabsContent value="prospect" className="mt-4">
                  <ProspectSearch
                    onSelectProspect={setSelectedProspect}
                    selectedProspect={selectedProspect}
                  />
                </TabsContent>

                <TabsContent value="manual" className="mt-4">
                  <div className="text-center py-4">
                    <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Mode saisie manuelle - configurez le profil ci-dessous
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Champs manquants */}
          <MissingFieldsForm
            missingFields={missingFields}
            profile={profile}
            onUpdateProfile={(updates) => setProfile(prev => ({ ...prev, ...updates }))}
          />

          {/* Profil fiscal */}
          <Card>
            <CardHeader>
              <CardTitle>Profil fiscal</CardTitle>
              <CardDescription>Paramètres obligatoires pour le calcul</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Situation familiale */}
              <div className="space-y-2">
                <TooltipLabel
                  label="Situation familiale"
                  tooltip="Situation pour la déclaration fiscale"
                />
                <Select
                  value={profile.situation_famille}
                  onValueChange={(v) => setProfile(prev => ({ ...prev, situation_famille: v as SituationFamiliale }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SITUATION_FAMILIALE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Enfants */}
              <div className="space-y-3">
                <TooltipLabel
                  label={`Enfants à charge : ${profile.nb_enfants_charge}`}
                  tooltip="Nombre d'enfants à charge (résidence principale)"
                />
                <Slider
                  value={[profile.nb_enfants_charge]}
                  onValueChange={(value) => setProfile(prev => ({ ...prev, nb_enfants_charge: value[0] }))}
                  min={0}
                  max={8}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>8+</span>
                </div>
              </div>

              {/* Revenu imposable */}
              <div className="space-y-2">
                <TooltipLabel
                  label="Revenu net imposable du foyer"
                  tooltip="Revenu net imposable total du foyer fiscal"
                />
                <div className="relative">
                  <Input
                    type="text"
                    value={profile.revenu_net_imposable_foyer.toLocaleString('fr-FR')}
                    onChange={(e) => handleNumberInput(
                      e.target.value,
                      (v) => setProfile(prev => ({ ...prev, revenu_net_imposable_foyer: v })),
                      0,
                      10000000
                    )}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    €
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projet d'investissement */}
          <Card>
            <CardHeader>
              <CardTitle>Projet d&apos;investissement</CardTitle>
              <CardDescription>Paramètres de simulation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Montant */}
              <div className="space-y-2">
                <TooltipLabel
                  label="Montant d'investissement"
                  tooltip="Montant à investir (versement unique)"
                />
                <div className="relative">
                  <Input
                    type="text"
                    value={investment.montant_invest.toLocaleString('fr-FR')}
                    onChange={(e) => handleNumberInput(
                      e.target.value,
                      (v) => setInvestment(prev => ({ ...prev, montant_invest: v })),
                      100,
                      10000000
                    )}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    €
                  </span>
                </div>
              </div>

              {/* Horizon */}
              <div className="space-y-3">
                <TooltipLabel
                  label={`Horizon de placement : ${investment.horizon_years} ans`}
                  tooltip="Durée de détention envisagée"
                />
                <Slider
                  value={[investment.horizon_years]}
                  onValueChange={(value) => setInvestment(prev => ({ ...prev, horizon_years: value[0] }))}
                  min={1}
                  max={30}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 an</span>
                  <span>30 ans</span>
                </div>
              </div>

              {/* Rendement hypothétique */}
              <div className="space-y-2">
                <TooltipLabel
                  label="Rendement hypothétique"
                  tooltip="Uniquement pour générer une base taxable de comparaison"
                />
                <div className="relative">
                  <Input
                    type="text"
                    value={(investment.hyp_r * 100).toFixed(1)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setInvestment(prev => ({ ...prev, hyp_r: val / 100 }));
                    }}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Produits à comparer */}
          <Card>
            <CardHeader>
              <CardTitle>Produits à comparer</CardTitle>
              <CardDescription>Sélectionnez les produits pour la comparaison fiscale</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {PRODUCT_OPTIONS.map((product) => (
                  <label
                    key={product.value}
                    className={`
                      flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors
                      ${selectedProducts.includes(product.value as ProductType)
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                        : 'border-border hover:bg-muted'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.value as ProductType)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(prev => [...prev, product.value as ProductType]);
                        } else {
                          setSelectedProducts(prev => prev.filter(p => p !== product.value));
                        }
                      }}
                      className="rounded"
                    />
                    <div>
                      <p className="font-medium text-sm">{product.label}</p>
                      <p className="text-xs text-muted-foreground">{product.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bouton calcul */}
          <Button
            onClick={runSimulation}
            disabled={isCalculating || selectedProducts.length === 0}
            className="w-full"
            size="lg"
          >
            {isCalculating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Calcul en cours...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                Calculer l&apos;impact fiscal
              </>
            )}
          </Button>
        </div>

        {/* Résultats */}
        <div className="lg:col-span-7 space-y-6">
          {simulationResult ? (
            <>
              {/* Situation actuelle */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Impôt actuel du foyer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(simulationResult.fiscal_comparison.current_tax.ir_net)}
                      </div>
                      <p className="text-sm text-muted-foreground">IR net annuel</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {simulationResult.fiscal_comparison.current_tax.tmi.toFixed(0)}%
                      </div>
                      <p className="text-sm text-muted-foreground">TMI</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {simulationResult.fiscal_comparison.current_tax.taux_moyen.toFixed(1)}%
                      </div>
                      <p className="text-sm text-muted-foreground">Taux moyen</p>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    {simulationResult.fiscal_comparison.current_tax.parts_fiscales} parts fiscales •
                    QF: {formatCurrency(simulationResult.fiscal_comparison.current_tax.quotient_familial)}
                  </div>
                </CardContent>
              </Card>

              {/* Comparaison produits */}
              <Card>
                <CardHeader>
                  <CardTitle>Comparaison fiscale (à {investment.horizon_years} ans)</CardTitle>
                  <CardDescription>
                    Impact fiscal uniquement - rendement {(investment.hyp_r * 100).toFixed(1)}% hypothétique
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3">Produit</th>
                          <th className="text-right py-2 px-3">Taxe IR</th>
                          <th className="text-right py-2 px-3">Taxe PS</th>
                          <th className="text-right py-2 px-3">Total fiscalité</th>
                          <th className="text-right py-2 px-3">Gain vs CTO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {simulationResult.fiscal_comparison.products.map((product) => {
                          const gain_vs_cto = simulationResult.fiscal_comparison.savings_vs_cto[product.product_type] || 0;
                          const is_positive = gain_vs_cto > 0;

                          return (
                            <tr key={product.product_type} className="border-b">
                              <td className="py-3 px-3">
                                <div>
                                  <p className="font-medium">{product.product_type}</p>
                                  {product.conditions.length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      {product.conditions[0]}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="text-right py-3 px-3">
                                {formatCurrency(product.tax_ir)}
                              </td>
                              <td className="text-right py-3 px-3">
                                {formatCurrency(product.tax_ps)}
                              </td>
                              <td className="text-right py-3 px-3 font-medium">
                                {formatCurrency(product.tax_total)}
                              </td>
                              <td className={`text-right py-3 px-3 font-medium flex items-center justify-end gap-1 ${
                                is_positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                              }`}>
                                {is_positive ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                {formatCurrency(Math.abs(gain_vs_cto))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Graphique fiscalité cumulée */}
              {simulationResult.chart_data && simulationResult.chart_data.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Fiscalité cumulée par horizon</CardTitle>
                    <CardDescription>
                      Évolution des taxes selon l&apos;horizon de détention (hypothèse {(investment.hyp_r * 100).toFixed(1)}%)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={simulationResult.chart_data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <defs>
                            <linearGradient id="cto" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="pea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="av" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="per" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="scpi" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="year"
                            tickFormatter={(value) => `${value} an${value > 1 ? 's' : ''}`}
                            className="text-xs"
                          />
                          <YAxis
                            tickFormatter={(value) =>
                              new Intl.NumberFormat('fr-FR', {
                                notation: 'compact',
                                compactDisplay: 'short',
                              }).format(value) + ' €'
                            }
                            className="text-xs"
                          />
                          <RechartsTooltip
                            formatter={(value, name) => [
                              formatCurrency(value as number),
                              name === 'cto_tax' ? 'CTO' :
                              name === 'pea_tax' ? 'PEA' :
                              name === 'av_tax' ? 'Assurance-Vie' :
                              name === 'per_tax_conservateur' ? 'PER (conservateur)' :
                              name === 'per_tax_optimiste' ? 'PER (optimiste)' :
                              name === 'scpi_tax_cumule' ? 'SCPI' : name
                            ]}
                            labelFormatter={(label) => `Année ${label}`}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              borderColor: 'hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Legend
                            formatter={(value) =>
                              value === 'cto_tax' ? 'CTO (référence)' :
                              value === 'pea_tax' ? 'PEA' :
                              value === 'av_tax' ? 'Assurance-Vie' :
                              value === 'per_tax_conservateur' ? 'PER (conservateur)' :
                              value === 'per_tax_optimiste' ? 'PER (optimiste)' :
                              value === 'scpi_tax_cumule' ? 'SCPI (cumulé)' : value
                            }
                          />

                          {/* Lignes pour chaque produit sélectionné */}
                          {selectedProducts.includes('CTO') && (
                            <Line
                              type="monotone"
                              dataKey="cto_tax"
                              stroke="#dc2626"
                              strokeWidth={3}
                              strokeDasharray="5 5"
                              dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
                            />
                          )}
                          {selectedProducts.includes('PEA') && (
                            <Line
                              type="monotone"
                              dataKey="pea_tax"
                              stroke="#16a34a"
                              strokeWidth={2}
                              dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                            />
                          )}
                          {selectedProducts.includes('AV') && (
                            <Line
                              type="monotone"
                              dataKey="av_tax"
                              stroke="#2563eb"
                              strokeWidth={2}
                              dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                            />
                          )}
                          {selectedProducts.includes('PER') && (
                            <>
                              <Line
                                type="monotone"
                                dataKey="per_tax_conservateur"
                                stroke="#7c3aed"
                                strokeWidth={2}
                                strokeDasharray="3 3"
                                dot={{ fill: '#7c3aed', strokeWidth: 2, r: 3 }}
                              />
                              <Line
                                type="monotone"
                                dataKey="per_tax_optimiste"
                                stroke="#a855f7"
                                strokeWidth={2}
                                strokeDasharray="2 2"
                                dot={{ fill: '#a855f7', strokeWidth: 2, r: 3 }}
                              />
                            </>
                          )}
                          {selectedProducts.includes('SCPI') && (
                            <Line
                              type="monotone"
                              dataKey="scpi_tax_cumule"
                              stroke="#ea580c"
                              strokeWidth={2}
                              dot={{ fill: '#ea580c', strokeWidth: 2, r: 4 }}
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Graphique économies fiscales */}
              {simulationResult.fiscal_comparison.products.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Économies fiscales vs CTO</CardTitle>
                    <CardDescription>
                      Gain ou perte fiscale par rapport au CTO de référence (à {investment.horizon_years} ans)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={simulationResult.fiscal_comparison.products
                            .filter(p => p.product_type !== 'CTO')
                            .map(product => ({
                              product: product.product_type,
                              savings: simulationResult.fiscal_comparison.savings_vs_cto[product.product_type] || 0,
                              label: product.product_type === 'AV' ? 'Assurance-Vie' :
                                    product.product_type === 'PER' ? 'PER' :
                                    product.product_type === 'PEA' ? 'PEA' :
                                    product.product_type === 'SCPI' ? 'SCPI' :
                                    product.product_type === 'MALRAUX' ? 'Malraux' :
                                    product.product_type
                            }))
                          }
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="label" className="text-xs" />
                          <YAxis
                            tickFormatter={(value) => formatCurrency(value)}
                            className="text-xs"
                          />
                          <RechartsTooltip
                            formatter={(value) => {
                              const numValue = Number(value || 0);
                              return [
                                `${numValue >= 0 ? '+' : ''}${formatCurrency(numValue)}`,
                                numValue >= 0 ? 'Économie vs CTO' : 'Surcoût vs CTO'
                              ];
                            }}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              borderColor: 'hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Bar
                            dataKey="savings"
                            radius={[4, 4, 0, 0]}
                          >
                            {simulationResult.fiscal_comparison.products
                              .filter(p => p.product_type !== 'CTO')
                              .map((product, index) => {
                                const savings = simulationResult.fiscal_comparison.savings_vs_cto[product.product_type] || 0;
                                return (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={savings >= 0 ? '#16a34a' : '#dc2626'}
                                  />
                                );
                              })
                            }
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Warnings et conditions */}
              {simulationResult.precision_warnings.length > 0 && (
                <Card className="border-amber-200 dark:border-amber-800">
                  <CardHeader>
                    <CardTitle className="text-amber-700 dark:text-amber-400 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Points d&apos;attention
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      {simulationResult.precision_warnings.map((warning, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-600 dark:text-amber-400">•</span>
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Calculator className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-medium">Prêt pour le calcul</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configurez le profil et lancez la simulation fiscale
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}