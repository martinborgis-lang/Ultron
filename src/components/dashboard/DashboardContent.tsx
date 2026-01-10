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

function transformProspects(googleProspects: GoogleProspect[]): ProspectType[] {
  return googleProspects
    .map((p, index) => ({
      id: index + 1,
      nom: p.nom,
      prenom: p.prenom,
      qualification: (p.qualificationIA?.toUpperCase() || 'FROID') as 'CHAUD' | 'TIEDE' | 'FROID',
      score: parseInt(p.scoreIA) || 0,
      statut: p.statutAppel || p.dateRdv ? `RDV: ${p.dateRdv}` : 'Nouveau',
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function generateMockActivity(prospects: GoogleProspect[]): Activity[] {
  const activities: Activity[] = [];
  let id = 1;

  prospects.slice(0, 8).forEach((p, i) => {
    const times = ['Il y a 5 min', 'Il y a 15 min', 'Il y a 1h', 'Il y a 2h', 'Il y a 3h', 'Il y a 4h', 'Il y a 5h', 'Il y a 6h'];
    const actions = [
      p.mailSynthese === 'oui' ? 'Mail de synthese envoye' : null,
      p.mailPlaquette === 'oui' ? 'Plaquette envoyee' : null,
      p.mailRappel === 'oui' ? 'Mail de rappel envoye' : null,
      p.qualificationIA ? `Qualifie ${p.qualificationIA}` : 'Nouveau prospect ajoute',
      p.dateRdv ? 'RDV planifie' : null,
    ].filter(Boolean);

    if (actions.length > 0) {
      activities.push({
        id: id++,
        action: actions[0]!,
        target: `${p.prenom} ${p.nom}`,
        time: times[i] || 'Recemment',
      });
    }
  });

  return activities.slice(0, 8);
}

function generateChartData(): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    data.push({
      date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      chauds: Math.floor(Math.random() * 8) + 5,
      tiedes: Math.floor(Math.random() * 15) + 10,
      froids: Math.floor(Math.random() * 20) + 20,
    });
  }

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
  const [chartData] = useState<ChartDataPoint[]>(generateChartData());

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setNotConnected(false);

    try {
      const [statsRes, prospectsRes] = await Promise.all([
        fetch('/api/sheets/stats'),
        fetch('/api/sheets/prospects'),
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

      setStats(statsData.stats);
      const transformedProspects = transformProspects(prospectsData.prospects);
      setProspects(transformedProspects);
      setActivities(generateMockActivity(prospectsData.prospects));
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
