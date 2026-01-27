'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Search, UserPlus, Store, Stethoscope, Briefcase,
  MapPin, Phone, Mail, Globe, Loader2, Building2,
  ArrowLeft, Users, CheckCircle2
} from 'lucide-react';

// Types de catégories
type LeadCategory = 'commercants' | 'professions_liberales' | 'dirigeants' | null;

interface LeadResult {
  id: string;
  name: string;
  company_name?: string;
  position?: string; // Pour dirigeants
  profession?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  source: string;
  siren?: string; // Pour dirigeants
  capital?: string; // Pour dirigeants
  effectif?: string; // Pour dirigeants
  imported_to_crm?: boolean;
}

// Suggestions par catégorie
const SUGGESTIONS = {
  commercants: [
    'Plombier', 'Électricien', 'Boulangerie', 'Restaurant', 'Coiffeur',
    'Garagiste', 'Menuisier', 'Peintre', 'Maçon', 'Fleuriste',
    'Boucher', 'Pressing', 'Pizzeria', 'Café', 'Épicerie'
  ],
  professions_liberales: [
    'Médecin généraliste', 'Dentiste', 'Avocat', 'Notaire', 'Architecte',
    'Pharmacien', 'Kinésithérapeute', 'Expert-comptable', 'Ostéopathe',
    'Ophtalmologue', 'Dermatologue', 'Vétérinaire', 'Psychologue', 'Chirurgien'
  ],
  dirigeants: [
    'BTP', 'Immobilier', 'Restauration', 'Commerce', 'Services',
    'Industrie', 'Transport', 'Informatique', 'Santé', 'Finance'
  ]
};

export default function LeadsFinderPage() {
  // États
  const [category, setCategory] = useState<LeadCategory>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [leadsCount, setLeadsCount] = useState('20');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<LeadResult[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [creditsBalance, setCreditsBalance] = useState<number | null>(null);

  useEffect(() => {
    loadCredits();
  }, []);

  async function loadCredits() {
    try {
      const res = await fetch('/api/leads/credits');
      if (res.ok) {
        const data = await res.json();
        setCreditsBalance(data.available);
      }
    } catch (error) {
      console.error('Erreur chargement crédits:', error);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    if (!category) {
      toast.error('Veuillez sélectionner une catégorie');
      return;
    }

    if (!searchTerm.trim()) {
      toast.error('Veuillez entrer une activité ou profession');
      return;
    }

    if (!location.trim() && !postalCode.trim()) {
      toast.error('Veuillez entrer une ville ou un code postal');
      return;
    }

    setLoading(true);
    setResults([]);
    setSelectedLeads(new Set());

    try {
      const res = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          searchTerm: searchTerm.trim(),
          location: location.trim(),
          postalCode: postalCode.trim(),
          count: parseInt(leadsCount),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la recherche');
      }

      setResults(data.leads || []);
      setCreditsBalance(data.creditsRemaining);

      if (data.leads?.length > 0) {
        toast.success(`${data.leads.length} leads trouvés !`);
      } else {
        toast.info('Aucun résultat trouvé pour cette recherche');
      }

    } catch (error: unknown) {
      console.error('Erreur recherche:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  function toggleLead(id: string) {
    setSelectedLeads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  function selectAll() {
    if (selectedLeads.size === results.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(results.map(r => r.id)));
    }
  }

  async function importToCRM() {
    if (selectedLeads.size === 0) {
      toast.error('Sélectionnez au moins un lead');
      return;
    }

    setImporting(true);

    try {
      const res = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: Array.from(selectedLeads),
        }),
      });

      if (!res.ok) throw new Error('Erreur import');

      const data = await res.json();
      toast.success(`${data.imported} leads importés dans le CRM !`);

      // Marquer comme importés
      setResults(prev => prev.map(r => ({
        ...r,
        imported_to_crm: selectedLeads.has(r.id) ? true : r.imported_to_crm,
      })));
      setSelectedLeads(new Set());

    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'import');
    } finally {
      setImporting(false);
    }
  }

  function resetSearch() {
    setCategory(null);
    setSearchTerm('');
    setLocation('');
    setPostalCode('');
    setResults([]);
    setSelectedLeads(new Set());
  }

  // ══════════════════════════════════════════════════════════════
  // ÉCRAN 1 : Sélection de catégorie
  // ══════════════════════════════════════════════════════════════
  if (!category) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Lead Finder</h1>
            <p className="text-muted-foreground">Trouvez de nouveaux prospects qualifiés</p>
          </div>
          {creditsBalance !== null && (
            <Badge variant="outline" className="text-lg px-4 py-2">
              {creditsBalance} crédits disponibles
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Commerçants & Artisans */}
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setCategory('commercants')}
          >
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 mx-auto bg-orange-500/10 rounded-full flex items-center justify-center mb-4">
                <Store className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Commerçants & Artisans</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Plombiers, électriciens, restaurants, commerces de proximité...
              </p>
              <Badge variant="secondary">Google Maps</Badge>
            </CardContent>
          </Card>

          {/* Professions Libérales */}
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setCategory('professions_liberales')}
          >
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                <Stethoscope className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Professions Libérales</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Médecins, avocats, notaires, architectes, experts-comptables...
              </p>
              <Badge variant="secondary">Google Maps</Badge>
            </CardContent>
          </Card>

          {/* Dirigeants d'entreprises */}
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setCategory('dirigeants')}
          >
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Dirigeants d'Entreprises</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Gérants, PDG, directeurs avec infos légales (SIREN, capital...)
              </p>
              <Badge variant="secondary">Pappers API</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // ÉCRAN 2 : Formulaire de recherche
  // ══════════════════════════════════════════════════════════════
  const categoryConfig = {
    commercants: {
      title: 'Commerçants & Artisans',
      icon: Store,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      placeholder: 'Ex: Plombier, Restaurant, Boulangerie...',
      label: 'Type de commerce / métier',
    },
    professions_liberales: {
      title: 'Professions Libérales',
      icon: Stethoscope,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      placeholder: 'Ex: Dentiste, Avocat, Notaire...',
      label: 'Profession',
    },
    dirigeants: {
      title: 'Dirigeants d\'Entreprises',
      icon: Briefcase,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      placeholder: 'Ex: BTP, Immobilier, Restauration...',
      label: 'Secteur d\'activité',
    },
  };

  const config = categoryConfig[category];
  const IconComponent = config.icon;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={resetSearch}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 ${config.bgColor} rounded-full flex items-center justify-center`}>
                <IconComponent className={`w-4 h-4 ${config.color}`} />
              </div>
              <h1 className="text-2xl font-bold">{config.title}</h1>
            </div>
            <p className="text-muted-foreground">Recherchez des leads qualifiés</p>
          </div>
        </div>
        {creditsBalance !== null && (
          <Badge variant="outline" className="text-lg px-4 py-2">
            {creditsBalance} crédits
          </Badge>
        )}
      </div>

      {/* Formulaire */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Activité/Profession */}
              <div className="lg:col-span-2">
                <label className="text-sm font-medium mb-1 block">{config.label}</label>
                <Input
                  placeholder={config.placeholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {/* Suggestions */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {SUGGESTIONS[category].slice(0, 5).map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setSearchTerm(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Ville */}
              <div>
                <label className="text-sm font-medium mb-1 block">Ville</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Paris, Lyon..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Code postal */}
              <div>
                <label className="text-sm font-medium mb-1 block">Code postal</label>
                <Input
                  placeholder="75015"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Nombre de résultats :</label>
                <Select value={leadsCount} onValueChange={setLeadsCount}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={loading} size="lg">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Recherche...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Rechercher
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Résultats */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {results.length} leads trouvés
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={selectAll}>
                  {selectedLeads.size === results.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </Button>
                <Button onClick={importToCRM} disabled={selectedLeads.size === 0 || importing}>
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Import...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Importer {selectedLeads.size > 0 && `(${selectedLeads.size})`}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-3 text-left w-10">
                        <Checkbox
                          checked={selectedLeads.size === results.length && results.length > 0}
                          onCheckedChange={selectAll}
                        />
                      </th>
                      <th className="p-3 text-left">
                        {category === 'dirigeants' ? 'Dirigeant / Entreprise' : 'Nom / Entreprise'}
                      </th>
                      <th className="p-3 text-left">Adresse</th>
                      <th className="p-3 text-left">Téléphone</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">
                        {category === 'dirigeants' ? 'SIREN' : 'Site web'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((lead) => (
                      <tr key={lead.id} className="border-t hover:bg-muted/50">
                        <td className="p-3">
                          <Checkbox
                            checked={selectedLeads.has(lead.id)}
                            onCheckedChange={() => toggleLead(lead.id)}
                            disabled={lead.imported_to_crm}
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{lead.name}</div>
                          {lead.company_name && (
                            <div className="text-sm text-muted-foreground">{lead.company_name}</div>
                          )}
                          {lead.position && (
                            <Badge variant="outline" className="mt-1 text-xs">{lead.position}</Badge>
                          )}
                          {lead.imported_to_crm && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Importé
                            </Badge>
                          )}
                        </td>
                        <td className="p-3">
                          {lead.address && (
                            <div className="text-sm">{lead.address}</div>
                          )}
                          <div className="text-sm text-muted-foreground">
                            {lead.postal_code} {lead.city}
                          </div>
                        </td>
                        <td className="p-3">
                          {lead.phone ? (
                            <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                              <Phone className="w-3 h-3" />
                              {lead.phone}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {lead.email ? (
                            <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-primary hover:underline">
                              <Mail className="w-3 h-3" />
                              {lead.email}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {category === 'dirigeants' ? (
                            lead.siren ? (
                              <span className="font-mono text-sm">{lead.siren}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )
                          ) : (
                            lead.website ? (
                              <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                                <Globe className="w-3 h-3" />
                                Voir
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}