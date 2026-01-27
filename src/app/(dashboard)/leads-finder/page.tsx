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
  Search,
  UserPlus,
  Building2,
  User,
  MapPin,
  Briefcase,
  Phone,
  Mail,
  Globe,
  Loader2,
  CheckCircle,
  Filter,
  RefreshCw
} from 'lucide-react';
import type {
  LeadResult,
  LeadSearchRequest,
  LeadSearchResponse,
  LeadCreditsResponse,
  LeadImportResponse
} from '@/types/leads';

export default function LeadsFinderPage() {
  // États du formulaire
  const [searchType, setSearchType] = useState<'particulier' | 'entreprise'>('entreprise');
  const [profession, setProfession] = useState('');
  const [location, setLocation] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [leadsCount, setLeadsCount] = useState('20');

  // États des résultats
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LeadResult[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [creditsBalance, setCreditsBalance] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);

  // Charger les crédits au montage
  useEffect(() => {
    loadCredits();
  }, []);

  async function loadCredits() {
    try {
      const res = await fetch('/api/leads/credits');
      if (res.ok) {
        const data: LeadCreditsResponse = await res.json();
        setCreditsBalance(data.available);
      } else {
        console.error('Erreur lors du chargement des crédits');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des crédits:', error);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    // Validation
    if (!profession.trim()) {
      toast.error('Veuillez entrer une profession ou activité');
      return;
    }

    if (!location.trim() && !postalCode.trim()) {
      toast.error('Veuillez entrer une ville ou un code postal');
      return;
    }

    const requestedCount = parseInt(leadsCount);
    if (creditsBalance !== null && creditsBalance < requestedCount) {
      toast.error(`Crédits insuffisants. Disponible: ${creditsBalance}, Demandé: ${requestedCount}`);
      return;
    }

    setLoading(true);
    setResults([]);
    setSelectedLeads(new Set());

    try {
      const searchRequest: LeadSearchRequest = {
        type: searchType,
        profession: profession.trim(),
        location: location.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        count: requestedCount,
      };

      console.log('Recherche de leads:', searchRequest);

      const res = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchRequest),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de la recherche');
      }

      const data: LeadSearchResponse = await res.json();
      setResults(data.leads);
      setCreditsBalance(data.creditsRemaining);

      toast.success(`${data.leads.length} leads trouvés ! (${data.creditsUsed} crédits utilisés)`);

    } catch (error: unknown) {
      console.error('Erreur de recherche:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  function toggleLead(id: string) {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLeads(newSelected);
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
      toast.error('Sélectionnez au moins un lead à importer');
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

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de l\'import');
      }

      const data: LeadImportResponse = await res.json();
      toast.success(`${data.imported} leads importés dans le CRM !`);

      // Marquer comme importés dans l'UI
      setResults(results.map(r => ({
        ...r,
        imported_to_crm: selectedLeads.has(r.id) ? true : r.imported_to_crm,
      })));
      setSelectedLeads(new Set());

    } catch (error: unknown) {
      console.error('Erreur d\'import:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setImporting(false);
    }
  }

  const availableLeads = results.filter(r => !r.imported_to_crm);
  const selectedAvailableLeads = Array.from(selectedLeads).filter(id =>
    availableLeads.some(r => r.id === id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Search className="w-8 h-8 text-blue-500" />
            Lead Finder
          </h1>
          <p className="text-gray-400 mt-1">
            Trouvez de nouveaux prospects qualifiés
          </p>
        </div>
        {creditsBalance !== null && (
          <Badge variant="outline" className="text-lg px-4 py-2">
            <RefreshCw className="w-4 h-4 mr-2" />
            {creditsBalance} crédits disponibles
          </Badge>
        )}
      </div>

      {/* Formulaire de recherche */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Rechercher des leads
          </CardTitle>
          <CardDescription>
            Trouvez des professionnels ou entreprises par activité et zone géographique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Type */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Type de cible
                </label>
                <Select value={searchType} onValueChange={(v: 'particulier' | 'entreprise') => setSearchType(v)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="entreprise" className="text-white">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Entreprise
                      </div>
                    </SelectItem>
                    <SelectItem value="particulier" className="text-white">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Particulier
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Profession */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Profession / Activité
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Ex: Dentiste, Avocat, Plombier..."
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              {/* Ville */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Ville
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Ex: Paris, Lyon, Marseille..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              {/* Code postal */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Code postal
                </label>
                <Input
                  placeholder="Ex: 75015"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              {/* Nombre de leads */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Nombre de leads
                </label>
                <Select value={leadsCount} onValueChange={setLeadsCount}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="10" className="text-white">10</SelectItem>
                    <SelectItem value="20" className="text-white">20</SelectItem>
                    <SelectItem value="50" className="text-white">50</SelectItem>
                    <SelectItem value="100" className="text-white">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bouton de recherche */}
              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Recherche en cours...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Rechercher
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Résultats */}
      {results.length > 0 && (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">
                {results.length} leads trouvés
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={selectAll}
                  disabled={availableLeads.length === 0}
                  className="text-white border-gray-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {selectedLeads.size === availableLeads.length ? 'Désélectionner tout' : 'Sélectionner tout'}
                </Button>
                <Button
                  onClick={importToCRM}
                  disabled={selectedAvailableLeads.length === 0 || importing}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {importing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Importer {selectedAvailableLeads.length > 0 && `(${selectedAvailableLeads.length})`}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-gray-300 font-medium">
                      <Checkbox
                        checked={selectedLeads.size === availableLeads.length && availableLeads.length > 0}
                        onCheckedChange={selectAll}
                        disabled={availableLeads.length === 0}
                      />
                    </th>
                    <th className="text-left p-3 text-gray-300 font-medium">Nom / Entreprise</th>
                    <th className="text-left p-3 text-gray-300 font-medium">Adresse</th>
                    <th className="text-left p-3 text-gray-300 font-medium">Téléphone</th>
                    <th className="text-left p-3 text-gray-300 font-medium">Email</th>
                    <th className="text-left p-3 text-gray-300 font-medium">Site web</th>
                    <th className="text-left p-3 text-gray-300 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((lead) => (
                    <tr key={lead.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-3">
                        {!lead.imported_to_crm ? (
                          <Checkbox
                            checked={selectedLeads.has(lead.id)}
                            onCheckedChange={() => toggleLead(lead.id)}
                          />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-white font-medium">
                          {lead.company_name || lead.name}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {lead.profession}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-gray-300 text-sm">
                          {lead.address}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {lead.postal_code} {lead.city}
                        </div>
                      </td>
                      <td className="p-3">
                        {lead.phone ? (
                          <div className="flex items-center gap-1 text-gray-300 text-sm">
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {lead.email ? (
                          <div className="flex items-center gap-1 text-gray-300 text-sm">
                            <Mail className="w-3 h-3" />
                            {lead.email}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {lead.website ? (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
                          >
                            <Globe className="w-3 h-3" />
                            Voir
                          </a>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {lead.imported_to_crm ? (
                          <Badge className="bg-green-900 text-green-300 border-green-700">
                            Importé
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-300 border-gray-600">
                            Nouveau
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message si aucun résultat */}
      {!loading && results.length === 0 && (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="text-center py-12">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-300 mb-2">
              Aucune recherche effectuée
            </h3>
            <p className="text-gray-400">
              Utilisez le formulaire ci-dessus pour rechercher des leads
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}