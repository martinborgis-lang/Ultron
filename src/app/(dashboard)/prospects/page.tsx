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
import { Search, Filter, Mail, Calendar } from 'lucide-react';

const mockProspects = [
  { id: 1, nom: 'Martin', prenom: 'Thomas', email: 'thomas.martin@email.com', telephone: '06 12 34 56 78', qualification: 'CHAUD', score: 85, statut: 'RDV demain', dateAjout: '2024-01-15' },
  { id: 2, nom: 'Durand', prenom: 'Marie', email: 'marie.durand@email.com', telephone: '06 23 45 67 89', qualification: 'CHAUD', score: 78, statut: 'A rappeler', dateAjout: '2024-01-14' },
  { id: 3, nom: 'Dubois', prenom: 'Pierre', email: 'pierre.dubois@email.com', telephone: '06 34 56 78 90', qualification: 'TIEDE', score: 62, statut: 'Plaquette envoyee', dateAjout: '2024-01-13' },
  { id: 4, nom: 'Bernard', prenom: 'Sophie', email: 'sophie.bernard@email.com', telephone: '06 45 67 89 01', qualification: 'TIEDE', score: 55, statut: 'En attente', dateAjout: '2024-01-12' },
  { id: 5, nom: 'Petit', prenom: 'Lucas', email: 'lucas.petit@email.com', telephone: '06 56 78 90 12', qualification: 'FROID', score: 35, statut: 'Nouveau', dateAjout: '2024-01-11' },
  { id: 6, nom: 'Leroy', prenom: 'Emma', email: 'emma.leroy@email.com', telephone: '06 67 89 01 23', qualification: 'FROID', score: 28, statut: 'Nouveau', dateAjout: '2024-01-10' },
  { id: 7, nom: 'Moreau', prenom: 'Hugo', email: 'hugo.moreau@email.com', telephone: '06 78 90 12 34', qualification: 'TIEDE', score: 48, statut: 'Mail envoye', dateAjout: '2024-01-09' },
  { id: 8, nom: 'Simon', prenom: 'Lea', email: 'lea.simon@email.com', telephone: '06 89 01 23 45', qualification: 'CHAUD', score: 72, statut: 'RDV planifie', dateAjout: '2024-01-08' },
];

const qualificationColors: Record<string, string> = {
  CHAUD: 'bg-red-100 text-red-700 hover:bg-red-100',
  TIEDE: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  FROID: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
};

export default function ProspectsPage() {
  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un prospect..."
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtres
        </Button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chauds</p>
                <p className="text-2xl font-bold text-red-600">3</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                <span className="text-lg">🔥</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tiedes</p>
                <p className="text-2xl font-bold text-amber-600">3</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                <span className="text-lg">🌤</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Froids</p>
                <p className="text-2xl font-bold text-blue-600">2</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                <span className="text-lg">❄️</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prospects table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Tous les prospects</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telephone</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockProspects.map((prospect) => (
                <TableRow key={prospect.id}>
                  <TableCell className="font-medium">
                    {prospect.prenom} {prospect.nom}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {prospect.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {prospect.telephone}
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
                      <div className="w-12 h-2 bg-zinc-100 rounded-full overflow-hidden">
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
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
