import { logger } from '@/lib/logger';

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
import { Loader2, User } from 'lucide-react';
import { PipelineStage } from '@/types/crm';

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  gmail_connected: boolean;
}

interface ProspectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  stages: PipelineStage[];
}

export function ProspectForm({ open, onOpenChange, onSuccess, stages }: ProspectFormProps) {
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const { toast } = useToast();

  // Filtrer les stages actifs (pas gagne/perdu)
  const activeStages = stages.filter((s) => !s.is_won && !s.is_lost);
  const defaultStage = activeStages.find((s) => s.slug === 'nouveau') || activeStages[0];

  const getInitialFormData = () => ({
    // Identite (colonnes C, D, E, F)
    first_name: '',
    last_name: '',
    email: '',
    phone: '',

    // Source (colonne G)
    source: '',

    // Situation (colonnes H, I)
    age: '',
    profession: '',

    // Financier (colonnes J, K)
    revenus_mensuels: '',
    patrimoine: '',

    // Besoins (colonne L)
    besoins: '',

    // Stage par defaut
    stage_slug: defaultStage?.slug || 'nouveau',

    // Conseiller assigne
    assigned_to: '',
  });

  const [formData, setFormData] = useState(getInitialFormData);

  // Fetch team members and current user when form opens
  useEffect(() => {
    if (open) {
      // Fetch team members
      fetch('/api/team')
        .then((res) => res.json())
        .then((data) => {
          if (data.members) {
            setTeamMembers(data.members);
          }
        })
        .catch((err) => console.error('Error fetching team:', err));

      // Fetch current user
      fetch('/api/user/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.id) {
            setCurrentUserId(data.id);
            // Set default assigned_to to current user
            setFormData((prev) => ({
              ...prev,
              assigned_to: data.id,
            }));
          }
        })
        .catch((err) => console.error('Error fetching current user:', err));
    }
  }, [open]);

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
      // Map form fields to unified API fields
      const unifiedData = {
        firstName: formData.first_name,
        lastName: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        source: formData.source || 'manuel',
        age: formData.age ? parseInt(formData.age) : undefined,
        situationPro: formData.profession,
        revenusMensuels: formData.revenus_mensuels ? parseFloat(formData.revenus_mensuels) : undefined,
        patrimoine: formData.patrimoine ? parseFloat(formData.patrimoine) : undefined,
        besoins: formData.besoins,
        stage: formData.stage_slug || 'nouveau',
        assignedTo: formData.assigned_to || undefined,
      };

      logger.debug('ProspectForm - Creating prospect:', unifiedData);

      // Use unified API which supports both CRM and Sheet modes
      const response = await fetch('/api/prospects/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unifiedData),
      });

      const data = await response.json();
      logger.debug('ProspectForm - API response:', { ok: response.ok, status: response.status, data });

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
                <Label htmlFor="last_name">Nom *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => updateField('last_name', e.target.value)}
                  placeholder="Dupont"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="first_name">Prenom *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => updateField('first_name', e.target.value)}
                  placeholder="Jean"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="jean@exemple.fr"
                  required
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

          {/* Section Source & Attribution */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Origine & Attribution
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Source du lead</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => updateField('source', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner une source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manuel">Ajout manuel</SelectItem>
                    <SelectItem value="site_web">Site web</SelectItem>
                    <SelectItem value="recommandation">Recommandation</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="evenement">Evenement</SelectItem>
                    <SelectItem value="partenaire">Partenaire</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Conseiller</Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(value) => updateField('assigned_to', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner un conseiller" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{member.full_name || member.email}</span>
                          {member.id === currentUserId && (
                            <span className="text-xs text-muted-foreground">(moi)</span>
                          )}
                          {!member.gmail_connected && (
                            <span className="text-xs text-amber-500">(Gmail non connecte)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label htmlFor="profession">Situation professionnelle</Label>
                <Input
                  id="profession"
                  value={formData.profession}
                  onChange={(e) => updateField('profession', e.target.value)}
                  placeholder="Cadre, Independant, Retraite..."
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
                <Label htmlFor="revenus_mensuels">Revenus mensuels (EUR)</Label>
                <Input
                  id="revenus_mensuels"
                  type="number"
                  value={formData.revenus_mensuels}
                  onChange={(e) => updateField('revenus_mensuels', e.target.value)}
                  placeholder="5000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patrimoine">Patrimoine (EUR)</Label>
                <Input
                  id="patrimoine"
                  type="number"
                  value={formData.patrimoine}
                  onChange={(e) => updateField('patrimoine', e.target.value)}
                  placeholder="200000"
                />
              </div>
            </div>
          </div>

          {/* Section Besoins */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Besoins
            </h3>
            <Textarea
              id="besoins"
              value={formData.besoins}
              onChange={(e) => updateField('besoins', e.target.value)}
              placeholder="Quels sont les besoins exprimes par le prospect ? (epargne, retraite, immobilier, defiscalisation...)"
              rows={4}
            />
          </div>

          {/* Section Stage */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Pipeline
            </h3>
            <div className="space-y-2">
              <Label htmlFor="stage_slug">Stage initial</Label>
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
