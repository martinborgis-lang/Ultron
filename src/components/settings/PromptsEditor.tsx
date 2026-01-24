'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Save, RotateCcw, Play, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AlertDialogCustom } from '@/components/ui/alert-dialog-custom';
import { useOrganization } from '@/hooks/useOrganization';

interface PromptConfig {
  useAI: boolean;
  systemPrompt: string;
  userPromptTemplate: string;
  fixedEmailSubject: string;
  fixedEmailBody: string;
}

interface OrganizationPrompts {
  prompt_synthese: PromptConfig | null;
  prompt_rappel: PromptConfig | null;
  prompt_plaquette: PromptConfig | null;
}

const DEFAULT_PROMPTS: Record<'synthese' | 'rappel' | 'plaquette', PromptConfig> = {
  synthese: {
    useAI: true,
    systemPrompt: `Tu es l'assistant d'un cabinet de gestion de patrimoine.

Ta mission : rédiger un email de RÉCAPITULATIF suite à un APPEL DE PROSPECTION téléphonique.

CONTEXTE IMPORTANT :
- Un conseiller vient de faire un APPEL TÉLÉPHONIQUE avec un prospect
- Pendant cet appel, ils ont convenu d'un RENDEZ-VOUS à une date future
- Cet email récapitule l'appel ET confirme le RDV à venir

RÈGLES STRICTES :
1. NE PAS citer la date de l'appel. Dire "Lors de notre échange téléphonique"
2. NE PAS confondre l'appel (passé) et le RDV (futur)
3. TOUJOURS mentionner la date et l'heure du RDV À VENIR
4. Adapter le ton selon la qualification (CHAUD/TIEDE/FROID)
5. JAMAIS de signature - terminer par "Cordialement," uniquement

FORMAT DE SORTIE : {"objet": "...", "corps": "..."}`,
    userPromptTemplate: `Les données du prospect seront automatiquement fournies dans ce prompt.

IMPORTANT : N'utilise JAMAIS de placeholders comme {{prenom}} ou {{besoins}}.
Les vraies données seront injectées directement dans le prompt.

Rédige un email personnalisé et naturel en utilisant ces informations.`,
    fixedEmailSubject: '',
    fixedEmailBody: '',
  },
  rappel: {
    useAI: true,
    systemPrompt: `Tu es l'assistant d'un cabinet de gestion de patrimoine.

Ta mission : rédiger un email de RAPPEL pour un RDV qui aura lieu dans 24h.

RÈGLES :
1. Rappeler la date et l'heure du RDV
2. Être bref et professionnel
3. Proposer de recontacter en cas d'empêchement
4. JAMAIS de signature - terminer par "Cordialement," uniquement

FORMAT DE SORTIE : {"objet": "...", "corps": "..."}`,
    userPromptTemplate: `Les données du prospect seront automatiquement fournies.

IMPORTANT : N'utilise JAMAIS de placeholders comme {{prenom}} ou {{date_rdv}}.
Les vraies données seront injectées directement dans le prompt.

Rédige un email de rappel personnalisé avec les informations du prospect.`,
    fixedEmailSubject: '',
    fixedEmailBody: '',
  },
  plaquette: {
    useAI: true,
    systemPrompt: `Tu es l'assistant d'un cabinet de gestion de patrimoine.

Ta mission : rédiger un email sobre pour accompagner l'envoi d'une plaquette de présentation.

RÈGLES :
1. Email court et professionnel
2. Mentionner que la plaquette est en pièce jointe
3. Proposer un échange téléphonique
4. JAMAIS de signature - terminer par "Cordialement," uniquement

FORMAT DE SORTIE : {"objet": "...", "corps": "..."}`,
    userPromptTemplate: `Les données du prospect seront automatiquement fournies.

IMPORTANT : N'utilise JAMAIS de placeholders comme {{prenom}} ou {{besoins}}.
Les vraies données seront injectées directement dans le prompt.

Rédige un email sobre pour accompagner la plaquette en pièce jointe.`,
    fixedEmailSubject: '',
    fixedEmailBody: '',
  },
};

export function PromptsEditor() {
  const { organization } = useOrganization();
  const [prompts, setPrompts] = useState<OrganizationPrompts>({
    prompt_synthese: null,
    prompt_rappel: null,
    prompt_plaquette: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('synthese');

  // États pour les modales
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetTarget, setResetTarget] = useState<'synthese' | 'rappel' | 'plaquette' | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/prompts');
      const data = await response.json();

      if (data.prompts) {
        setPrompts({
          prompt_synthese: data.prompts.prompt_synthese || DEFAULT_PROMPTS.synthese,
          prompt_rappel: data.prompts.prompt_rappel || DEFAULT_PROMPTS.rappel,
          prompt_plaquette: data.prompts.prompt_plaquette || DEFAULT_PROMPTS.plaquette,
        });
      } else {
        setPrompts({
          prompt_synthese: DEFAULT_PROMPTS.synthese,
          prompt_rappel: DEFAULT_PROMPTS.rappel,
          prompt_plaquette: DEFAULT_PROMPTS.plaquette,
        });
      }
    } catch (error) {
      console.error('Erreur fetch prompts:', error);
      setPrompts({
        prompt_synthese: DEFAULT_PROMPTS.synthese,
        prompt_rappel: DEFAULT_PROMPTS.rappel,
        prompt_plaquette: DEFAULT_PROMPTS.plaquette,
      });
    }
    setLoading(false);
  };

  const handleSave = async (type: 'synthese' | 'rappel' | 'plaquette') => {
    setSaving(true);
    try {
      const promptKey = `prompt_${type}` as keyof OrganizationPrompts;

      const response = await fetch('/api/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: promptKey,
          config: prompts[promptKey],
        }),
      });

      if (response.ok) {
        setAlertMessage('Prompt sauvegardé !');
        setShowSuccessAlert(true);
      } else {
        const data = await response.json();
        setAlertMessage('Erreur: ' + (data.error || 'Erreur lors de la sauvegarde'));
        setShowErrorAlert(true);
      }
    } catch (error) {
      console.error('Erreur save:', error);
      setAlertMessage('Erreur lors de la sauvegarde');
      setShowErrorAlert(true);
    }
    setSaving(false);
  };

  const handleReset = (type: 'synthese' | 'rappel' | 'plaquette') => {
    setResetTarget(type);
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    if (resetTarget) {
      const promptKey = `prompt_${resetTarget}` as keyof OrganizationPrompts;
      setPrompts((prev) => ({
        ...prev,
        [promptKey]: DEFAULT_PROMPTS[resetTarget],
      }));
      setResetTarget(null);
    }
  };

  const handleTest = async (type: 'synthese' | 'rappel' | 'plaquette') => {
    setTesting(true);
    setTestResult(null);

    try {
      const promptKey = `prompt_${type}` as keyof OrganizationPrompts;

      const response = await fetch('/api/prompts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          config: prompts[promptKey],
          testData: {
            prenom: 'Jean',
            nom: 'Dupont',
            email: 'jean.dupont@example.com',
            qualification: 'TIEDE',
            besoins: 'Optimisation fiscale et préparation retraite',
            notes_appel: 'Intéressé par le PER, revenus 5000€/mois',
            date_rdv: '15/01/2026 à 14h00',
          },
        }),
      });

      const data = await response.json();

      if (data.result) {
        setTestResult(JSON.stringify(data.result, null, 2));
      } else {
        setTestResult('Erreur: ' + (data.error || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('Erreur test:', error);
      setTestResult('Erreur lors du test');
    }
    setTesting(false);
  };

  const updatePrompt = (
    type: 'synthese' | 'rappel' | 'plaquette',
    field: keyof PromptConfig,
    value: string | boolean
  ) => {
    const promptKey = `prompt_${type}` as keyof OrganizationPrompts;
    setPrompts((prev) => ({
      ...prev,
      [promptKey]: {
        ...(prev[promptKey] || DEFAULT_PROMPTS[type]),
        [field]: value,
      },
    }));
  };

  const renderPromptEditor = (
    type: 'synthese' | 'rappel' | 'plaquette',
    title: string,
    description: string
  ) => {
    const promptKey = `prompt_${type}` as keyof OrganizationPrompts;
    const config = prompts[promptKey] || DEFAULT_PROMPTS[type];

    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warning */}
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Attention</AlertTitle>
            <AlertDescription>
              Modifier un prompt peut entraîner l&apos;envoi d&apos;emails non
              professionnels ou erronés. Testez toujours vos modifications avant
              de sauvegarder.
            </AlertDescription>
          </Alert>

          {/* Toggle IA / Email fixe */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Mode de génération</Label>
              <p className="text-sm text-muted-foreground">
                {config.useAI
                  ? "Utiliser l'IA pour générer les emails"
                  : 'Utiliser un email fixe (sans IA)'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Email fixe</span>
              <Switch
                checked={config.useAI}
                onCheckedChange={(checked) => updatePrompt(type, 'useAI', checked)}
              />
              <span className="text-sm text-muted-foreground">IA</span>
            </div>
          </div>

          {config.useAI ? (
            /* Mode IA */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`system-${type}`}>
                  Instructions système (prompt système)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Instructions générales pour l&apos;IA sur comment rédiger
                  l&apos;email.
                </p>
                <Textarea
                  id={`system-${type}`}
                  value={config.systemPrompt}
                  onChange={(e) =>
                    updatePrompt(type, 'systemPrompt', e.target.value)
                  }
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`user-${type}`}>Template utilisateur</Label>
                <p className="text-xs text-muted-foreground">
                  Variables disponibles : {'{{prenom}}'}, {'{{nom}}'},{' '}
                  {'{{email}}'}, {'{{qualification}}'}, {'{{besoins}}'},{' '}
                  {'{{notes_appel}}'}, {'{{date_rdv}}'}
                </p>
                <Textarea
                  id={`user-${type}`}
                  value={config.userPromptTemplate}
                  onChange={(e) =>
                    updatePrompt(type, 'userPromptTemplate', e.target.value)
                  }
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          ) : (
            /* Mode Email fixe */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`subject-${type}`}>Objet de l&apos;email</Label>
                <p className="text-xs text-muted-foreground">
                  Variables : {'{{prenom}}'}, {'{{nom}}'}
                </p>
                <Input
                  id={`subject-${type}`}
                  type="text"
                  value={config.fixedEmailSubject}
                  onChange={(e) =>
                    updatePrompt(type, 'fixedEmailSubject', e.target.value)
                  }
                  placeholder="Suite à notre échange - {{prenom}} {{nom}}"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`body-${type}`}>Corps de l&apos;email</Label>
                <p className="text-xs text-muted-foreground">
                  Variables : {'{{prenom}}'}, {'{{nom}}'}, {'{{date_rdv}}'},{' '}
                  {'{{besoins}}'}
                </p>
                <Textarea
                  id={`body-${type}`}
                  value={config.fixedEmailBody}
                  onChange={(e) =>
                    updatePrompt(type, 'fixedEmailBody', e.target.value)
                  }
                  rows={10}
                  placeholder={`Bonjour {{prenom}},

Suite à notre échange...

Cordialement,`}
                />
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => handleTest(type)}
              disabled={testing}
              variant="outline"
            >
              {testing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Tester
            </Button>
            <Button onClick={() => handleReset(type)} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              Réinitialiser
            </Button>
            <Button onClick={() => handleSave(type)} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Sauvegarder
            </Button>
          </div>

          {/* Résultat du test */}
          {testResult && (
            <div className="mt-4 rounded-lg bg-muted p-4">
              <p className="mb-2 text-sm font-medium">Résultat du test :</p>
              <pre className="overflow-x-auto whitespace-pre-wrap text-sm">
                {testResult}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Personnalisation des emails
        </h2>
        <p className="text-muted-foreground">
          Configurez les prompts utilisés pour générer les emails automatiques.
          Ces paramètres sont propres à votre organisation.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="synthese">Synthèse (RDV Validé)</TabsTrigger>
          <TabsTrigger value="rappel">Rappel 24h</TabsTrigger>
          <TabsTrigger value="plaquette">Plaquette</TabsTrigger>
        </TabsList>

        <TabsContent value="synthese" className="mt-6">
          {renderPromptEditor(
            'synthese',
            'Email de synthèse',
            "Envoyé après validation d'un RDV pour récapituler l'échange et confirmer le rendez-vous."
          )}
        </TabsContent>

        <TabsContent value="rappel" className="mt-6">
          {renderPromptEditor(
            'rappel',
            'Email de rappel 24h',
            'Envoyé automatiquement 24h avant un RDV pour rappeler le rendez-vous au prospect.'
          )}
        </TabsContent>

        <TabsContent value="plaquette" className="mt-6">
          {renderPromptEditor(
            'plaquette',
            'Email plaquette',
            'Envoyé avec la plaquette PDF en pièce jointe.'
          )}
        </TabsContent>
      </Tabs>
    </div>

      {/* Modale de confirmation de réinitialisation */}
      <ConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title="Réinitialiser le prompt"
        description={`Êtes-vous sûr de vouloir réinitialiser le prompt ${resetTarget} aux valeurs par défaut ? Cette action effacera vos modifications personnalisées.`}
        confirmText="Réinitialiser"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={confirmReset}
      />

      {/* Modale de succès */}
      <AlertDialogCustom
        open={showSuccessAlert}
        onOpenChange={setShowSuccessAlert}
        title="Succès"
        description={alertMessage}
        variant="success"
        buttonText="Parfait"
      />

      {/* Modale d'erreur */}
      <AlertDialogCustom
        open={showErrorAlert}
        onOpenChange={setShowErrorAlert}
        title="Erreur"
        description={alertMessage}
        variant="error"
        buttonText="Compris"
      />
    </>
  );
}
