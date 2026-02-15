'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Mail,
  Calendar,
  AlertCircle,
  Settings,
  RefreshCw,
  X,
  FileText,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { AdvancedFiltersComponent, AdvancedFilters, DEFAULT_FILTERS } from './AdvancedFilters';
import { Pagination, usePagination } from '@/components/ui/pagination';

// Helper to display readable stage names
function getStageDisplayName(stageSlug: string): string {
  const stageNames: Record<string, string> = {
    'nouveau': 'Nouveau',
    'contacte': 'Contacté',
    'en_attente': 'En attente',
    'a_rappeler': 'À rappeler',
    'rdv_valide': 'RDV Validé',
    'rdv_pris': 'RDV Pris',
    'rdv_effectue': 'RDV Effectué',
    'proposition': 'Proposition',
    'negociation': 'Négociation',
    'gagne': 'Gagné',
    'perdu': 'Perdu',
  };
  return stageNames[stageSlug] || stageSlug;
}

type QualificationFilter = 'tous' | 'CHAUD' | 'TIEDE' | 'FROID';

// Interface pour les métadonnées de pagination
interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage?: number;
  prevPage?: number;
  offset: number;
}

// Interface pour la réponse API avec pagination
interface PaginatedProspectsResponse {
  data: UnifiedProspect[];
  pagination: PaginationMeta;
  meta: {
    dataMode: string;
    filters: any;
    totalItems: number;
    currentPage: number;
    pageSize: number;
  };
}

// Unified format from /api/prospects/unified
interface UnifiedProspect {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  stage: string;
  qualification: string | null;
  scoreIa?: number;
  dateRdv?: string;
  patrimoineEstime?: number;
  revenusAnnuels?: number;
  age?: number;
  createdAt: string;
}

interface ProspectDisplay {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  qualification: string;
  score: number;
  statut: string;
  dateRdv: string;
  dateLead: string;
  patrimoineEstime?: number;
  revenusAnnuels?: number;
  age?: number;
}

const qualificationColors: Record<string, string> = {
  CHAUD: 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900 dark:text-red-300',
  TIEDE: 'bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-300',
  FROID: 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
  NON_QUALIFIE: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300',
};

const qualificationLabels: Record<string, string> = {
  CHAUD: 'CHAUD',
  TIEDE: 'TIEDE',
  FROID: 'FROID',
  NON_QUALIFIE: 'Nouveau',
};

function transformProspects(unifiedProspects: UnifiedProspect[]): ProspectDisplay[] {
  // ✅ SÉCURITÉ : Vérifier que unifiedProspects est un array avant .map()
  if (!Array.isArray(unifiedProspects)) {
    return [];
  }
  return unifiedProspects.map((p) => ({
    id: p.id,
    nom: p.lastName,
    prenom: p.firstName,
    email: p.email,
    telephone: p.phone || '',
    qualification: p.qualification?.toUpperCase() || 'NON_QUALIFIE',
    score: p.scoreIa || 0,
    statut: p.stage || 'Nouveau',
    dateRdv: p.dateRdv || '',
    dateLead: p.createdAt,
    patrimoineEstime: p.patrimoineEstime,
    revenusAnnuels: p.revenusAnnuels,
    age: p.age,
  }));
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-[400px]" />
    </div>
  );
}

function NotConnectedMessage() {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 rounded-full bg-amber-50 dark:bg-amber-950 mb-4">
          <AlertCircle className="h-8 w-8 text-amber-500 dark:text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Google Sheet non connectee</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Connectez votre compte Google et configurez votre Google Sheet pour voir vos prospects.
        </p>
        <Link href="/settings">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Settings className="mr-2 h-4 w-4" />
            Configurer dans les parametres
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export function ProspectsContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notConnected, setNotConnected] = useState(false);
  const [prospects, setProspects] = useState<ProspectDisplay[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [qualificationFilter, setQualificationFilter] = useState<QualificationFilter>('tous');
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(DEFAULT_FILTERS);

  // États de pagination
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pagination = usePagination(20); // Page size par défaut: 20

  // Handler: Open default mail client with pre-filled email
  const handleSendEmail = (prospect: ProspectDisplay) => {
    const email = prospect.email;
    const subject = encodeURIComponent(`Suite a notre echange - ${prospect.prenom} ${prospect.nom}`);
    const body = encodeURIComponent(`Bonjour ${prospect.prenom},\n\n`);

    // Use location.href instead of window.open for mailto links
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  // Handler: Open Google Calendar with pre-filled event
  const handleAddToCalendar = (prospect: ProspectDisplay) => {
    const title = encodeURIComponent(`RDV - ${prospect.prenom} ${prospect.nom}`);
    const description = encodeURIComponent(
      `Prospect : ${prospect.prenom} ${prospect.nom}\n` +
      `Email : ${prospect.email}\n` +
      `Telephone : ${prospect.telephone || 'Non renseigne'}\n` +
      `Qualification : ${prospect.qualification || 'Non qualifie'}`
    );

    let dateStart = '';
    let dateEnd = '';

    // If prospect has a RDV date, use it
    if (prospect.dateRdv && prospect.dateRdv.trim() !== '' && prospect.dateRdv !== '-') {
      // Try to parse French date format DD/MM/YYYY HH:mm or DD/MM/YYYY
      const dateStr = prospect.dateRdv;
      let rdvDate: Date | null = null;

      if (dateStr.includes('/')) {
        const [datePart, timePart] = dateStr.split(' ');
        const dateParts = datePart.split('/');

        if (dateParts.length === 3) {
          const [day, month, year] = dateParts.map(Number);
          const [hours, minutes] = (timePart || '10:00').split(':').map(Number);
          rdvDate = new Date(year, month - 1, day, hours || 10, minutes || 0);
        }
      } else {
        rdvDate = new Date(dateStr);
      }

      if (rdvDate && !isNaN(rdvDate.getTime())) {
        dateStart = rdvDate.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, 15) + 'Z';
        const endDate = new Date(rdvDate.getTime() + 60 * 60 * 1000); // +1h
        dateEnd = endDate.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, 15) + 'Z';
      }
    }

    // If no valid date, propose tomorrow at 10h
    if (!dateStart) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      dateStart = tomorrow.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, 15) + 'Z';
      const endDate = new Date(tomorrow.getTime() + 60 * 60 * 1000);
      dateEnd = endDate.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, 15) + 'Z';
    }

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${title}` +
      `&dates=${dateStart}/${dateEnd}` +
      `&details=${description}`;

    window.open(calendarUrl, '_blank');
  };

  // Handler: Reset advanced filters
  const handleResetAdvancedFilters = () => {
    setAdvancedFilters(DEFAULT_FILTERS);
  };

  const fetchData = async (
    page?: number,
    pageSize?: number,
    search?: string,
    qualification?: QualificationFilter
  ) => {
    const currentPage = page ?? pagination.currentPage;
    const currentPageSize = pageSize ?? pagination.pageSize;
    const currentSearch = search ?? searchQuery;
    const currentQualification = qualification ?? qualificationFilter;

    pagination.setLoading(true);
    setError(null);
    setNotConnected(false);

    try {
      // Construire les paramètres de pagination et filtres
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: currentPageSize.toString(),
        sort: 'created_at',
        order: 'desc',
      });

      if (currentSearch) {
        params.append('search', currentSearch);
      }

      if (currentQualification !== 'tous') {
        params.append('qualification', currentQualification);
      }

      const response = await fetch(`/api/prospects/unified?${params}`);
      const data = await response.json();

      if (!response.ok) {
        if (data.connected === false || data.configured === false) {
          setNotConnected(true);
          return;
        }
        throw new Error(data.error || 'Erreur');
      }

      // ✅ TRAITEMENT : Gérer les nouveaux formats de réponse avec pagination
      let unifiedProspects: UnifiedProspect[] = [];
      let paginationMeta: PaginationMeta | null = null;

      if (data.data && data.pagination) {
        // Format paginé complet
        unifiedProspects = data.data;
        paginationMeta = data.pagination;
        setTotalItems(paginationMeta?.total || 0);
        setTotalPages(paginationMeta?.totalPages || 1);
      } else if (Array.isArray(data.data)) {
        // Format avec data array mais pas de pagination (fallback)
        unifiedProspects = data.data;
        setTotalItems(data.data.length);
        setTotalPages(1);
      } else if (Array.isArray(data)) {
        // Format legacy (array direct)
        unifiedProspects = data;
        setTotalItems(data.length);
        setTotalPages(1);
      } else if (data && typeof data === 'object' && !data.error) {
        // Fallback: essayer d'extraire un array de l'objet
        const possibleArrays = Object.values(data).filter(Array.isArray);
        if (possibleArrays.length > 0) {
          unifiedProspects = possibleArrays[0] as UnifiedProspect[];
          setTotalItems(unifiedProspects.length);
          setTotalPages(1);
        }
      }

      setProspects(transformProspects(unifiedProspects));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      setProspects([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      pagination.setLoading(false);
    }
  };

  // Debounce pour la recherche
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Effet pour debouncer la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Effet pour recharger quand la recherche debouncée change
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) return; // Attendre le debounce
    pagination.resetPagination(); // Reset à la page 1
    fetchData(1, pagination.pageSize, debouncedSearchQuery, qualificationFilter);
  }, [debouncedSearchQuery]);

  // Effet pour recharger quand la qualification change
  useEffect(() => {
    pagination.resetPagination(); // Reset à la page 1
    fetchData(1, pagination.pageSize, searchQuery, qualificationFilter);
  }, [qualificationFilter]);

  // Chargement initial
  useEffect(() => {
    fetchData();
  }, []);

  // Handlers de pagination
  const handlePageChange = (page: number) => {
    pagination.handlePageChange(page);
    fetchData(page, pagination.pageSize, searchQuery, qualificationFilter);
  };

  const handlePageSizeChange = (newSize: number) => {
    pagination.handlePageSizeChange(newSize);
    fetchData(1, newSize, searchQuery, qualificationFilter);
  };

  // Pour les filtres avancés, on calcule les valeurs max sur TOUS les prospects (pas seulement la page courante)
  // Note : Idéalement, ces valeurs devraient venir d'une API dédiée pour avoir les vraies valeurs max
  const maxValues = useMemo(() => {
    // Valeurs par défaut raisonnables pour un CGP
    return {
      maxPatrimoine: 2000000, // 2M€
      maxRevenus: 300000, // 300k€
      maxAge: 75,
    };
  }, []);

  // ⚠️ NOTE: Les filtres avancés sont temporairement maintenus côté client
  // Pour une implémentation complète, ils devraient être envoyés à l'API
  const filteredProspects = useMemo(() => {
    return prospects.filter((p) => {
      // Les filtres de recherche et qualification sont déjà appliqués côté serveur
      // On ne filtre ici que les filtres avancés

      // Filtres avancés (patrimoine)
      if (p.patrimoineEstime !== undefined && p.patrimoineEstime !== null) {
        if (p.patrimoineEstime < advancedFilters.patrimoineRange[0] ||
            p.patrimoineEstime > advancedFilters.patrimoineRange[1]) {
          return false;
        }
      } else {
        // Si pas de patrimoine défini, on exclut si le filtre min est > 0
        if (advancedFilters.patrimoineRange[0] > 0) {
          return false;
        }
      }

      // Filtres avancés (revenus annuels)
      if (p.revenusAnnuels !== undefined && p.revenusAnnuels !== null) {
        if (p.revenusAnnuels < advancedFilters.revenusRange[0] ||
            p.revenusAnnuels > advancedFilters.revenusRange[1]) {
          return false;
        }
      } else {
        // Si pas de revenus définis, on exclut si le filtre min est > 0
        if (advancedFilters.revenusRange[0] > 0) {
          return false;
        }
      }

      // Filtres avancés (âge)
      if (p.age !== undefined && p.age !== null) {
        if (p.age < advancedFilters.ageRange[0] ||
            p.age > advancedFilters.ageRange[1]) {
          return false;
        }
      } else {
        // Si pas d'âge défini, on exclut si le filtre min est > 18
        if (advancedFilters.ageRange[0] > 18) {
          return false;
        }
      }

      return true;
    });
  }, [prospects, advancedFilters]);

  const stats = useMemo(() => {
    // Stats basées sur la page courante pour cohérence avec l'affichage
    const chauds = prospects.filter((p) => p.qualification === 'CHAUD').length;
    const tiedes = prospects.filter((p) => p.qualification === 'TIEDE').length;
    const froids = prospects.filter((p) => p.qualification === 'FROID').length;
    return { chauds, tiedes, froids };
  }, [prospects]);

  // Handler pour refresh
  const handleRefresh = () => {
    fetchData(pagination.currentPage, pagination.pageSize, searchQuery, qualificationFilter);
  };

  if (pagination.loading && prospects.length === 0) {
    return <LoadingSkeleton />;
  }

  if (notConnected) {
    return <NotConnectedMessage />;
  }

  if (error) {
    return (
      <Card className="shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-red-50 dark:bg-red-950 mb-4">
            <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
          <Button onClick={() => fetchData()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, prenom ou email..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={qualificationFilter === 'tous' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQualificationFilter('tous')}
            className={qualificationFilter === 'tous' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
          >
            Tous
          </Button>
          <Button
            variant={qualificationFilter === 'CHAUD' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQualificationFilter('CHAUD')}
            className={qualificationFilter === 'CHAUD' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            Chauds
          </Button>
          <Button
            variant={qualificationFilter === 'TIEDE' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQualificationFilter('TIEDE')}
            className={qualificationFilter === 'TIEDE' ? 'bg-amber-600 hover:bg-amber-700' : ''}
          >
            Tiedes
          </Button>
          <Button
            variant={qualificationFilter === 'FROID' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQualificationFilter('FROID')}
            className={qualificationFilter === 'FROID' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            Froids
          </Button>
          {/* Filtres avancés */}
          <AdvancedFiltersComponent
            filters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
            onReset={handleResetAdvancedFilters}
            maxValues={maxValues}
          />
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={pagination.loading}>
          <RefreshCw className={`h-4 w-4 ${pagination.loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className={`border-red-100 dark:border-red-900 cursor-pointer transition-all ${
            qualificationFilter === 'CHAUD' ? 'ring-2 ring-red-500' : ''
          }`}
          onClick={() => setQualificationFilter(qualificationFilter === 'CHAUD' ? 'tous' : 'CHAUD')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chauds</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.chauds}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center">
                <span className="text-lg">🔥</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`border-amber-100 dark:border-amber-900 cursor-pointer transition-all ${
            qualificationFilter === 'TIEDE' ? 'ring-2 ring-amber-500' : ''
          }`}
          onClick={() => setQualificationFilter(qualificationFilter === 'TIEDE' ? 'tous' : 'TIEDE')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tiedes</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.tiedes}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
                <span className="text-lg">🌤</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`border-blue-100 dark:border-blue-900 cursor-pointer transition-all ${
            qualificationFilter === 'FROID' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setQualificationFilter(qualificationFilter === 'FROID' ? 'tous' : 'FROID')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Froids</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.froids}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                <span className="text-lg">❄️</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results count et pagination info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          {(() => {
            const hasAdvancedFilters =
              advancedFilters.patrimoineRange[0] !== 0 ||
              advancedFilters.patrimoineRange[1] !== maxValues.maxPatrimoine ||
              advancedFilters.revenusRange[0] !== 0 ||
              advancedFilters.revenusRange[1] !== maxValues.maxRevenus ||
              advancedFilters.ageRange[0] !== 18 ||
              advancedFilters.ageRange[1] !== maxValues.maxAge;

            const hasFilters = searchQuery || qualificationFilter !== 'tous' || hasAdvancedFilters;

            if (hasFilters) {
              return (
                <p>
                  {filteredProspects.length} sur {totalItems} prospects affichés
                  {searchQuery && ` pour "${searchQuery}"`}
                  {qualificationFilter !== 'tous' && ` (${qualificationFilter})`}
                  {hasAdvancedFilters && ' avec filtres avancés'}
                </p>
              );
            }

            if (totalItems > 0) {
              return (
                <p>
                  {totalItems} prospects au total
                  {totalPages > 1 && ` • Page ${pagination.currentPage} sur ${totalPages}`}
                </p>
              );
            }

            return null;
          })()}
        </div>

        {/* Loading indicator */}
        {pagination.loading && (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Chargement...</span>
          </div>
        )}
      </div>

      {/* Prospects table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Prospects
            {totalPages > 1 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (Page {pagination.currentPage} sur {totalPages})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProspects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {(() => {
                const hasAdvancedFilters =
                  advancedFilters.patrimoineRange[0] !== 0 ||
                  advancedFilters.patrimoineRange[1] !== maxValues.maxPatrimoine ||
                  advancedFilters.revenusRange[0] !== 0 ||
                  advancedFilters.revenusRange[1] !== maxValues.maxRevenus ||
                  advancedFilters.ageRange[0] !== 18 ||
                  advancedFilters.ageRange[1] !== maxValues.maxAge;

                const hasFilters = searchQuery || qualificationFilter !== 'tous' || hasAdvancedFilters;

                return hasFilters
                  ? 'Aucun prospect ne correspond aux filtres'
                  : 'Aucun prospect dans votre base de données';
              })()}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telephone</TableHead>
                    <TableHead>Qualification</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date RDV</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProspects.map((prospect) => (
                    <TableRow
                      key={prospect.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/prospects/${prospect.id}`)}
                    >
                      <TableCell className="font-medium">
                        {prospect.prenom} {prospect.nom}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {prospect.email || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {prospect.telephone || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`flex items-center gap-1 ${qualificationColors[prospect.qualification] || qualificationColors.NON_QUALIFIE}`}
                        >
                          {prospect.qualification === 'NON_QUALIFIE' && (
                            <Sparkles className="w-3 h-3" />
                          )}
                          {qualificationLabels[prospect.qualification] || 'Nouveau'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full"
                              style={{ width: `${Math.min(prospect.score, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {prospect.score}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getStageDisplayName(prospect.statut) || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {prospect.dateRdv || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {prospect.dateRdv && prospect.dateRdv !== '-' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Préparer le RDV"
                              onClick={() => window.open(`/meeting/prepare/${prospect.id}`, '_blank')}
                            >
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">Préparer le RDV</span>
                            </Button>
                          )}
                          {prospect.email && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Envoyer un email"
                              onClick={() => handleSendEmail(prospect)}
                            >
                              <Mail className="h-4 w-4" />
                              <span className="sr-only">Envoyer un email</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Planifier un RDV"
                            onClick={() => handleAddToCalendar(prospect)}
                          >
                            <Calendar className="h-4 w-4" />
                            <span className="sr-only">Ajouter a l agenda</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pagination.pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                loading={pagination.loading}
                showSizeChanger={true}
                showInfo={true}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
