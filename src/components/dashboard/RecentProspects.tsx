'use client';

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
import type { Prospect } from '@/types';

interface RecentProspectsProps {
  prospects: Prospect[];
}

const qualificationColors: Record<string, string> = {
  CHAUD: 'bg-red-100 text-red-700 hover:bg-red-100',
  TIEDE: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  FROID: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
};

export function RecentProspects({ prospects }: RecentProspectsProps) {
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
              <TableRow key={prospect.id}>
                <TableCell className="font-medium">
                  {prospect.prenom} {prospect.nom}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={qualificationColors[prospect.qualification]}
                  >
                    {prospect.qualification}
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
                  {prospect.statut}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
