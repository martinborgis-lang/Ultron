'use client';

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
import { Sparkles } from 'lucide-react';
import type { Prospect } from '@/types';

interface RecentProspectsProps {
  prospects: Prospect[];
}

const qualificationColors: Record<string, string> = {
  CHAUD: 'bg-red-100 text-red-700 hover:bg-red-100',
  TIEDE: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  FROID: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  NON_QUALIFIE: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  '': 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
};

const qualificationLabels: Record<string, string> = {
  CHAUD: 'CHAUD',
  TIEDE: 'TIEDE',
  FROID: 'FROID',
  NON_QUALIFIE: 'Nouveau',
  '': 'Nouveau',
};

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

export function RecentProspects({ prospects }: RecentProspectsProps) {
  const router = useRouter();

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Prospects prioritaires</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Qualification</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prospects.map((prospect) => (
              <TableRow
                key={prospect.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => router.push(`/prospects/${prospect.id}`)}
              >
                <TableCell className="font-medium">
                  {prospect.prenom} {prospect.nom}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`flex items-center gap-1 ${qualificationColors[prospect.qualification] || qualificationColors['']}`}
                  >
                    {(!prospect.qualification || prospect.qualification === 'NON_QUALIFIE') && (
                      <Sparkles className="w-3 h-3" />
                    )}
                    {qualificationLabels[prospect.qualification] || qualificationLabels['']}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${prospect.score}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {prospect.score}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {getStageDisplayName(prospect.statut)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
