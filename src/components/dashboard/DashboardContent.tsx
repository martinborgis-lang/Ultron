'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatsCards } from './StatsCards';
import { ProspectsChart } from './ProspectsChart';
import { RecentProspects } from './RecentProspects';
import { ActivityFeed } from './ActivityFeed';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Settings, RefreshCw } from 'lucide-react';
import type { Prospect as ProspectType, Activity, ChartDataPoint } from '@/types';
import type { Prospect as GoogleProspect } from '@/lib/google';

interface Stats {
  total: number;
  chauds: number;
  tiedes: number;
  froids: number;
  mailsEnvoyes: number;
  rdvPris: number;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Try DD/MM/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  // Try ISO format or other formats
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
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
  createdAt: string;
}

// Adapter: Convert unified format to GoogleProspect for helper functions
function unifiedToGoogleFormat(prospects: UnifiedProspect[]): GoogleProspect[] {
  return prospects.map((p, index) => ({
    id: p.id,
    rowNumber: index + 2, // Placeholder - not used for display purposes
    dateLead: p.createdAt,
    nom: p.lastName,
    prenom: p.firstName,
    email: p.email,
    telephone: p.phone || '',
    source: '',
    age: '',
    situationPro: '',
    revenus: '',
    patrimoine: '',
    besoins: '',
    notesAppel: '',
    statutAppel: p.stage,
    dateRdv: p.dateRdv || '',
    rappelSouhaite: '',
    qualificationIA: p.qualification || '',
    scoreIA: p.scoreIa?.toString() || '0',
    prioriteIA: '',
    justificationIA: '',
    rdvPrevu: p.dateRdv ? 'Oui' : '',
    lienRappel: '',
    mailPlaquette: '',
    mailSynthese: '',
    mailRappel: '',
  }));
}

function transformProspects(googleProspects: GoogleProspect[]): ProspectType[] {
  return googleProspects
    .map((p, index) => ({
      id: index + 1,
      nom: p.nom,
      prenom: p.prenom,
      qualification: (p.qualificationIA?.toUpperCase() || 'FROID') as 'CHAUD' | 'TIEDE' | 'FROID',
      score: parseInt(p.scoreIA) || 0,
      statut: p.statutAppel || (p.dateRdv ? `RDV: ${p.dateRdv}` : 'Nouveau'),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function generateRealActivities(prospects: GoogleProspect[]): Activity[] {
  const activities: { date: Date; action: string; target: string }[] = [];

  prospects.forEach((p) => {
    const name = `${p.prenom} ${p.nom}`.trim() || 'Prospect';
    const leadDate = parseDate(p.dateLead);

    // Nouveau prospect (basé sur Date Lead)
    if (leadDate) {
      activities.push({
        date: leadDate,
        action: 'Nouveau prospect',
        target: name,
      });
    }

    // Mails envoyés
    if (p.mailSynthese?.toLowerCase() === 'oui') {
      activities.push({
        date: leadDate || new Date(),
        action: 'Mail de synthese envoye',
        target: name,
      });
    }
    if (p.mailPlaquette?.toLowerCase() === 'oui') {
      activities.push({
        date: leadDate || new Date(),
        action: 'Plaquette envoyee',
        target: name,
      });
    }
    if (p.mailRappel?.toLowerCase() === 'oui') {
      activities.push({
        date: leadDate || new Date(),
        action: 'Mail de rappel envoye',
        target: name,
      });
    }

    // RDV planifié
    const rdvDate = parseDate(p.dateRdv);
    if (rdvDate) {
      activities.push({
        date: rdvDate,
        action: 'RDV planifie',
        target: name,
      });
    }

    // Qualification
    if (p.qualificationIA) {
      activities.push({
        date: leadDate || new Date(),
        action: `Qualifie ${p.qualificationIA.toUpperCase()}`,
        target: name,
      });
    }
  });

  // Trier par date décroissante et limiter à 10
  return activities
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10)
    .map((a, index) => ({
      id: index + 1,
      action: a.action,
      target: a.target,
      time: formatRelativeTime(a.date),
    }));
}

function generateRealChartData(prospects: GoogleProspect[]): ChartDataPoint[] {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  // Créer un map pour compter les prospects par jour
  const countByDate: Record<string, number> = {};

  // Initialiser les 30 derniers jours à 0
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo);
    date.setDate(date.getDate() + i);
    const key = date.toISOString().split('T')[0];
    countByDate[key] = 0;
  }

  // Compter les prospects par Date Lead
  prospects.forEach((p) => {
    const leadDate = parseDate(p.dateLead);
    if (leadDate && leadDate >= thirtyDaysAgo && leadDate <= today) {
      const key = leadDate.toISOString().split('T')[0];
      if (key in countByDate) {
        countByDate[key]++;
      }
    }
  });

  // Convertir en format chart avec cumul
  const data: ChartDataPoint[] = [];
  let cumulative = 0;

  // Compter les prospects avant la période
  prospects.forEach((p) => {
    const leadDate = parseDate(p.dateLead);
    if (leadDate && leadDate < thirtyDaysAgo) {
      cumulative++;
    }
  });

  const sortedDates = Object.keys(countByDate).sort();
  sortedDates.forEach((dateKey) => {
    cumulative += countByDate[dateKey];
    const date = new Date(dateKey);
    data.push({
      date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      chauds: cumulative,
      tiedes: countByDate[dateKey],
      froids: 0,
    });
  });

  return data;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-[350px] w-full rounded-xl" />
        </div>
        <Skeleton className="h-[350px] w-full rounded-xl" />
      </div>
      <Skeleton className="h-[300px] w-full rounded-xl" />
    </div>
  );
}

function NotConnectedMessage() {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 rounded-full bg-amber-50 mb-4">
          <AlertCircle className="h-8 w-8 text-amber-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Google Sheet non connectee</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Connectez votre compte Google et configurez votre Google Sheet pour voir vos prospects en temps reel.
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

export function DashboardContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notConnected, setNotConnected] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [prospects, setProspects] = useState<ProspectType[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setNotConnected(false);

    try {
      const [statsRes, prospectsRes] = await Promise.all([
        fetch('/api/prospects/unified/stats'),
        fetch('/api/prospects/unified'),
      ]);

      const statsData = await statsRes.json();
      const prospectsData = await prospectsRes.json();

      if (!statsRes.ok || !prospectsRes.ok) {
        if (statsData.connected === false || prospectsData.connected === false ||
            statsData.configured === false || prospectsData.configured === false) {
          setNotConnected(true);
          return;
        }
        throw new Error(statsData.error || prospectsData.error || 'Erreur');
      }

      // Format unifie: { total, byQualification: { CHAUD, TIEDE, FROID, NON_QUALIFIE }, byStage, mailsSent }
      setStats({
        total: statsData.total || 0,
        chauds: statsData.byQualification?.CHAUD || 0,
        tiedes: statsData.byQualification?.TIEDE || 0,
        froids: statsData.byQualification?.FROID || 0,
        mailsEnvoyes: statsData.mailsSent || 0,
        rdvPris: (statsData.byStage?.rdv_valide || 0) + (statsData.byStage?.rdv_pris || 0),
      });

      // Convertir les prospects unifies au format Google pour les helpers existants
      // ✅ SÉCURITÉ : Vérifier que prospectsData est bien un array ou un objet paginé
      let unifiedProspects: UnifiedProspect[] = [];

      if (Array.isArray(prospectsData)) {
        unifiedProspects = prospectsData;
      } else if (prospectsData && Array.isArray(prospectsData.data)) {
        // Format paginé: { data: [...], total, offset, limit }
        unifiedProspects = prospectsData.data;
      } else if (prospectsData && typeof prospectsData === 'object' && !prospectsData.error) {
        // Fallback: essayer d'extraire un array de l'objet
        const possibleArrays = Object.values(prospectsData).filter(Array.isArray);
        if (possibleArrays.length > 0) {
          unifiedProspects = possibleArrays[0] as UnifiedProspect[];
        }
      }

      const googleProspects = unifiedToGoogleFormat(unifiedProspects);
      setProspects(transformProspects(googleProspects));
      setActivities(generateRealActivities(googleProspects));
      setChartData(generateRealChartData(googleProspects));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (notConnected) {
    return <NotConnectedMessage />;
  }

  if (error) {
    return (
      <Card className="shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-red-50 mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  const displayStats = stats
    ? {
        chauds: stats.chauds,
        tiedes: stats.tiedes,
        froids: stats.froids,
        mailsEnvoyes: stats.mailsEnvoyes,
      }
    : { chauds: 0, tiedes: 0, froids: 0, mailsEnvoyes: 0 };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      </div>

      <StatsCards stats={displayStats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProspectsChart data={chartData} />
        </div>
        <div>
          <ActivityFeed activities={activities} />
        </div>
      </div>

      <RecentProspects prospects={prospects} />
    </div>
  );
}
