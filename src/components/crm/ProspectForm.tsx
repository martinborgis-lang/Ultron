'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { PipelineStage } from '@/types/crm';

interface ProspectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  stages: PipelineStage[];
}

export function ProspectForm({ open, onOpenChange, onSuccess, stages }: ProspectFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Filtrer les stages actifs (pas gagne/perdu)
  const activeStages = stages.filter((s) => !s.is_won && !s.is_lost);
  const defaultStage = activeStages.find((s) => s.slug === 'nouveau') || activeStages[0];

  const getInitialFormData = () => ({
    // Identite
    first_name: '',
    last_name: '',
    email: '',
    phone: '',

    // Coordonnees
    address: '',
    postal_code: '',
    city: '',

    // Professionnel
    company: '',
    job_title: '',
    profession: '',

    // Situation personnelle
    age: '',
    situation_familiale: '',
    nb_enfants: '',

    // Financier
    revenus_annuels: '',
    patrimoine_estime: '',

    // Commercial
    stage_slug: defaultStage?.slug || 'nouveau',
    deal_value: '',
    source: 'manual',

    // Notes
    notes: '',
  });

  const [formData, setFormData] = useState(getInitialFormData);

  // Reset le stage quand les stages changent ou quand le form s'ouvre
  useEffect(() => {
    if (open && defaultStage) {
      setFormData((prev) => ({
        ...prev,
        stage_slug: defaultStage.slug,
      }));
    }
  }, [open, defaultStage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Map form fields (snake_case) to unified API fields (camelCase)
      const unifiedData = {
        firstName: formData.first_name,
        lastName: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        source: formData.source,
        age: formData.age ? parseInt(formData.age) : undefined,
        situationPro: formData.profession || formData.job_title,
        revenusMensuels: formData.revenus_annuels ? Math.round(parseFloat(formData.revenus_annuels) / 12) : undefined,
        patrimoine: formData.patrimoine_estime ? parseFloat(formData.patrimoine_estime) : undefined,
        besoins: formData.notes,
        stage: formData.stage_slug || 'nouveau',
      };

      console.log('🔧 ProspectForm - Creating prospect:', unifiedData);

      // Use unified API which supports both CRM and Sheet modes
      const response = await fetch('/api/prospects/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unifiedData),
      });

      const data = await response.json();
      console.log('🔧 ProspectForm - API response:', { ok: response.ok, status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la creation');
      }

      toast({
        title: 'Prospect cree',
        description: `${formData.first_name} ${formData.last_name} a ete ajoute`,
      });

      // Reset form
      setFormData(getInitialFormData());

      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Form error:', error);
      const message = error instanceof Error ? error.message : 'Impossible de creer le prospect';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Nouveau prospect</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section Identite */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Identite
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Prenom</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => updateField('first_name', e.target.value)}
                  placeholder="Jean"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Nom</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => updateField('last_name', e.target.value)}
                  placeholder="Dupont"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="jean@exemple.fr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telephone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>
          </div>

          {/* Section Coordonnees */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Coordonnees
            </h3>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="123 rue de Paris"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postal_code">Code postal</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => updateField('postal_code', e.target.value)}
                  placeholder="75001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="Paris"
                />
              </div>
            </div>
          </div>

          {/* Section Situation */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Situation
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => updateField('age', e.target.value)}
                  placeholder="45"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="situation_familiale">Situation familiale</Label>
                <Select
                  value={formData.situation_familiale}
                  onValueChange={(value) => updateField('situation_familiale', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="celibataire">Celibataire</SelectItem>
                    <SelectItem value="marie">Marie(e)</SelectItem>
                    <SelectItem value="pacse">Pacse(e)</SelectItem>
                    <SelectItem value="divorce">Divorce(e)</SelectItem>
                    <SelectItem value="veuf">Veuf/Veuve</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nb_enfants">Nombre d'enfants</Label>
                <Input
                  id="nb_enfants"
                  type="number"
                  value={formData.nb_enfants}
                  onChange={(e) => updateField('nb_enfants', e.target.value)}
                  placeholder="2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profession">Profession</Label>
                <Input
                  id="profession"
                  value={formData.profession}
                  onChange={(e) => updateField('profession', e.target.value)}
                  placeholder="Cadre superieur"
                />
              </div>
            </div>
          </div>

          {/* Section Professionnel */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Professionnel
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Entreprise</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => updateField('company', e.target.value)}
                  placeholder="Societe SAS"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_title">Poste</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => updateField('job_title', e.target.value)}
                  placeholder="Directeur"
                />
              </div>
            </div>
          </div>

          {/* Section Financier */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Situation financiere
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="revenus_annuels">Revenus annuels (EUR)</Label>
                <Input
                  id="revenus_annuels"
                  type="number"
                  value={formData.revenus_annuels}
                  onChange={(e) => updateField('revenus_annuels', e.target.value)}
                  placeholder="80000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patrimoine_estime">Patrimoine estime (EUR)</Label>
                <Input
                  id="patrimoine_estime"
                  type="number"
                  value={formData.patrimoine_estime}
                  onChange={(e) => updateField('patrimoine_estime', e.target.value)}
                  placeholder="500000"
                />
              </div>
            </div>
          </div>

          {/* Section Commercial */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Commercial
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stage_slug">Stage</Label>
                <Select
                  value={formData.stage_slug}
                  onValueChange={(value) => updateField('stage_slug', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner un stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeStages.length > 0 ? (
                      activeStages.map((stage) => (
                        <SelectItem key={stage.slug} value={stage.slug}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: stage.color }}
                            />
                            {stage.name}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="nouveau">Nouveau</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deal_value">Valeur deal (EUR)</Label>
                <Input
                  id="deal_value"
                  type="number"
                  value={formData.deal_value}
                  onChange={(e) => updateField('deal_value', e.target.value)}
                  placeholder="50000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => updateField('source', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner une source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Ajout manuel</SelectItem>
                  <SelectItem value="website">Site web</SelectItem>
                  <SelectItem value="referral">Recommandation</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="event">Evenement</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section Notes */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Notes
            </h3>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Informations complementaires sur le prospect..."
              rows={4}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Creer le prospect
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
