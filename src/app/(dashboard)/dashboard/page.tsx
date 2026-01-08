import { StatsCards } from '@/components/dashboard/StatsCards';
import { ProspectsChart } from '@/components/dashboard/ProspectsChart';
import { RecentProspects } from '@/components/dashboard/RecentProspects';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import type { Prospect, Activity, ChartDataPoint } from '@/types';

// Mock data
const mockStats = {
  chauds: 12,
  tiedes: 28,
  froids: 45,
  mailsEnvoyes: 89,
};

const mockProspects: Prospect[] = [
  { id: 1, nom: 'Martin', prenom: 'Thomas', qualification: 'CHAUD', score: 85, statut: 'RDV demain' },
  { id: 2, nom: 'Durand', prenom: 'Marie', qualification: 'CHAUD', score: 78, statut: 'A rappeler' },
  { id: 3, nom: 'Dubois', prenom: 'Pierre', qualification: 'TIEDE', score: 62, statut: 'Plaquette envoyee' },
  { id: 4, nom: 'Bernard', prenom: 'Sophie', qualification: 'TIEDE', score: 55, statut: 'En attente' },
  { id: 5, nom: 'Petit', prenom: 'Lucas', qualification: 'FROID', score: 35, statut: 'Nouveau' },
];

const mockActivity: Activity[] = [
  { id: 1, action: 'Mail de synthese envoye', target: 'Thomas Martin', time: 'Il y a 5 min' },
  { id: 2, action: 'Nouveau prospect qualifie', target: 'Marie Durand', time: 'Il y a 15 min' },
  { id: 3, action: 'RDV confirme', target: 'Pierre Dubois', time: 'Il y a 1h' },
  { id: 4, action: 'Plaquette envoyee', target: 'Sophie Bernard', time: 'Il y a 2h' },
  { id: 5, action: 'Mail de rappel envoye', target: 'Lucas Petit', time: 'Il y a 3h' },
  { id: 6, action: 'Nouveau prospect ajoute', target: 'Emma Leroy', time: 'Il y a 4h' },
  { id: 7, action: 'Qualification mise a jour', target: 'Hugo Moreau', time: 'Il y a 5h' },
  { id: 8, action: 'RDV planifie', target: 'Lea Simon', time: 'Il y a 6h' },
];

// Generate 30 days of chart data
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

const mockChartData = generateChartData();

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <StatsCards stats={mockStats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProspectsChart data={mockChartData} />
        </div>
        <div>
          <ActivityFeed activities={mockActivity} />
        </div>
      </div>

      <RecentProspects prospects={mockProspects} />
    </div>
  );
}
