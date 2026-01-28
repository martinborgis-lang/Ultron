'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Copy, Phone, User, Mail, Building, MessageSquare, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company?: string;
  job_title?: string;
  subject?: string;
  message?: string;
  patrimoine_estime?: string;
  revenus_annuels?: string;
  situation_familiale?: string;
  nb_enfants?: string;
}

interface OrganizationInfo {
  id: string;
  name: string;
  webhookUrl: string;
}

export default function FormTestPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    subject: '',
    message: '',
    patrimoine_estime: '',
    revenus_annuels: '',
    situation_familiale: '',
    nb_enfants: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orgInfo, setOrgInfo] = useState<OrganizationInfo | null>(null);

  // Charger les infos organisation au montage
  useState(() => {
    loadOrganizationInfo();
  });

  const loadOrganizationInfo = async () => {
    try {
      const response = await fetch('/api/voice/form/organization');
      if (response.ok) {
        const data = await response.json();
        setOrgInfo(data);
      }
    } catch (error) {
      console.error('Erreur chargement organisation:', error);
    }
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgInfo) {
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les informations d'organisation",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Préparer les données pour le webhook
      const webhookData = {
        source: 'form_test',
        prospect_data: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          job_title: formData.job_title,
          patrimoine_estime: formData.patrimoine_estime ? parseInt(formData.patrimoine_estime) : undefined,
          revenus_annuels: formData.revenus_annuels ? parseInt(formData.revenus_annuels) : undefined,
          situation_familiale: formData.situation_familiale,
          nb_enfants: formData.nb_enfants ? parseInt(formData.nb_enfants) : undefined,
          organization_slug: orgInfo.id // Assurer la liaison à l'organisation
        },
        metadata: {
          subject: formData.subject,
          message: formData.message,
          form_version: '1.0',
          submitted_at: new Date().toISOString()
        },
        utm_params: {
          source: 'form_test',
          medium: 'web',
          campaign: 'test_prospect'
        }
      };

      // Envoyer vers le webhook
      const response = await fetch('/api/voice/ai-agent/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgInfo.id
        },
        body: JSON.stringify(webhookData)
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitted(true);
        toast({
          title: "Formulaire envoyé !",
          description: "Le prospect a été créé et l'appel automatique va être déclenché.",
        });
      } else {
        throw new Error(result.error || 'Erreur lors de l\'envoi');
      }

    } catch (error) {
      console.error('Erreur submission:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'envoi du formulaire",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyWebhookUrl = () => {
    if (orgInfo?.webhookUrl) {
      navigator.clipboard.writeText(orgInfo.webhookUrl);
      toast({
        title: "URL copiée !",
        description: "L'URL du webhook a été copiée dans le presse-papier",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company: '',
      job_title: '',
      subject: '',
      message: '',
      patrimoine_estime: '',
      revenus_annuels: '',
      situation_familiale: '',
      nb_enfants: ''
    });
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Formulaire envoyé avec succès !</h2>
              <p className="text-muted-foreground mb-6">
                Le prospect a été créé et l'agent IA va le contacter automatiquement.
              </p>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Prochaines étapes :</strong>
                </p>
                <ul className="text-sm text-left space-y-1">
                  <li>• Le prospect est créé en stage "Nouveau"</li>
                  <li>• L'agent IA va l'appeler dans les minutes qui suivent</li>
                  <li>• Après l'appel, qualification automatique</li>
                  <li>• Le prospect sera déplacé selon le résultat</li>
                </ul>
              </div>
              <Button onClick={resetForm} className="mt-6">
                Tester un autre prospect
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Formulaire de Test - Agent IA</h1>
          <p className="text-muted-foreground">
            Testez le workflow complet : formulaire → prospect → appel automatique → qualification
          </p>
        </div>

        {/* Informations webhook */}
        {orgInfo && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Configuration Webhook
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Organisation</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{orgInfo.name}</Badge>
                    <Badge variant="secondary">{orgInfo.id}</Badge>
                  </div>
                </div>
                <div>
                  <Label>URL Webhook</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={orgInfo.webhookUrl}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyWebhookUrl}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cette URL peut être utilisée pour les webhooks externes (Calendly, TypeForm, etc.)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulaire */}
        <Card>
          <CardHeader>
            <CardTitle>Informations Prospect</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Informations personnelles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Prénom *</Label>
                  <Input
                    id="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => updateFormData('first_name', e.target.value)}
                    required
                    placeholder="Jean"
                  />
                </div>

                <div>
                  <Label htmlFor="last_name">Nom *</Label>
                  <Input
                    id="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => updateFormData('last_name', e.target.value)}
                    required
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    required
                    placeholder="jean.dupont@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    required
                    placeholder="+33123456789"
                  />
                </div>
              </div>

              {/* Informations professionnelles */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Informations Professionnelles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Entreprise</Label>
                    <Input
                      id="company"
                      type="text"
                      value={formData.company}
                      onChange={(e) => updateFormData('company', e.target.value)}
                      placeholder="SARL Dupont"
                    />
                  </div>

                  <div>
                    <Label htmlFor="job_title">Poste</Label>
                    <Input
                      id="job_title"
                      type="text"
                      value={formData.job_title}
                      onChange={(e) => updateFormData('job_title', e.target.value)}
                      placeholder="Directeur Commercial"
                    />
                  </div>
                </div>
              </div>

              {/* Informations financières */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Profil Patrimonial (Optionnel)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patrimoine_estime">Patrimoine estimé (€)</Label>
                    <Select value={formData.patrimoine_estime} onValueChange={(value) => updateFormData('patrimoine_estime', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une tranche" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50000">Moins de 50 000 €</SelectItem>
                        <SelectItem value="100000">50 000 - 100 000 €</SelectItem>
                        <SelectItem value="200000">100 000 - 200 000 €</SelectItem>
                        <SelectItem value="500000">200 000 - 500 000 €</SelectItem>
                        <SelectItem value="1000000">Plus de 500 000 €</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="revenus_annuels">Revenus annuels (€)</Label>
                    <Select value={formData.revenus_annuels} onValueChange={(value) => updateFormData('revenus_annuels', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une tranche" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30000">Moins de 30 000 €</SelectItem>
                        <SelectItem value="50000">30 000 - 50 000 €</SelectItem>
                        <SelectItem value="75000">50 000 - 75 000 €</SelectItem>
                        <SelectItem value="100000">75 000 - 100 000 €</SelectItem>
                        <SelectItem value="150000">Plus de 100 000 €</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="situation_familiale">Situation familiale</Label>
                    <Select value={formData.situation_familiale} onValueChange={(value) => updateFormData('situation_familiale', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="celibataire">Célibataire</SelectItem>
                        <SelectItem value="marie">Marié(e)</SelectItem>
                        <SelectItem value="pacs">Pacsé(e)</SelectItem>
                        <SelectItem value="divorce">Divorcé(e)</SelectItem>
                        <SelectItem value="veuf">Veuf/Veuve</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="nb_enfants">Nombre d'enfants</Label>
                    <Select value={formData.nb_enfants} onValueChange={(value) => updateFormData('nb_enfants', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4 ou plus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Message (Optionnel)</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Sujet</Label>
                    <Input
                      id="subject"
                      type="text"
                      value={formData.subject}
                      onChange={(e) => updateFormData('subject', e.target.value)}
                      placeholder="Demande d'information sur vos services"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => updateFormData('message', e.target.value)}
                      placeholder="Bonjour, je souhaiterais avoir des informations sur vos services de gestion de patrimoine..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="border-t pt-6">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading || !formData.first_name || !formData.last_name || !formData.email || !formData.phone}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      Envoyer et déclencher l'appel automatique
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-2">
                  En envoyant ce formulaire, vous déclenchez la création du prospect et l'appel automatique par l'agent IA.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}