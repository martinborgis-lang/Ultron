'use client';

import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface QueryResultTableProps {
  data: Record<string, unknown>[];
  dataType: 'table' | 'count' | 'list';
}

export function QueryResultTable({ data, dataType }: QueryResultTableProps) {
  if (!data || data.length === 0) return null;

  // For count type, show a simple card
  if (dataType === 'count' && data.length === 1) {
    const value = Object.values(data[0])[0];
    const label = Object.keys(data[0])[0];

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {formatLabel(label)}
          </p>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {formatValue(value, label)}
          </p>
        </Card>
      </motion.div>
    );
  }

  // For table type, show a proper table
  const columns = Object.keys(data[0]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-2"
    >
      <Card className="overflow-hidden border-border/50">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {columns.map((col) => (
                  <TableHead
                    key={col}
                    className="text-xs font-semibold whitespace-nowrap"
                  >
                    {formatLabel(col)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 10).map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col}
                      className="text-sm py-2 whitespace-nowrap"
                    >
                      {renderCellValue(row[col], col)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {data.length > 10 && (
          <div className="px-4 py-2 bg-muted/30 text-xs text-muted-foreground text-center border-t">
            Affichage de 10 sur {data.length} resultats
          </div>
        )}
      </Card>
    </motion.div>
  );
}

/**
 * Format column label for display
 */
function formatLabel(label: string): string {
  // Common French labels
  const labelMap: Record<string, string> = {
    prenom: 'Prenom',
    nom: 'Nom',
    email: 'Email',
    telephone: 'Telephone',
    patrimoine: 'Patrimoine',
    patrimoine_estime: 'Patrimoine',
    revenus: 'Revenus',
    revenus_annuels: 'Revenus',
    qualification: 'Qualification',
    score: 'Score',
    score_ia: 'Score IA',
    etape: 'Etape',
    stage_slug: 'Etape',
    date_creation: 'Cree le',
    created_at: 'Cree le',
    updated_at: 'Modifie le',
    dernier_contact: 'Dernier contact',
    last_activity_at: 'Dernier contact',
    total: 'Total',
    total_rdv: 'Total RDV',
    count: 'Nombre',
    conseiller: 'Conseiller',
    full_name: 'Nom complet',
  };

  return labelMap[label.toLowerCase()] || label.replace(/_/g, ' ');
}

/**
 * Format cell value for display
 */
function formatValue(value: unknown, column: string): string {
  if (value === null || value === undefined) return '-';

  const colLower = column.toLowerCase();

  // Money formatting
  if (
    colLower.includes('patrimoine') ||
    colLower.includes('revenu') ||
    colLower.includes('deal')
  ) {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(value);
    }
  }

  // Date formatting
  if (
    colLower.includes('date') ||
    colLower.includes('_at') ||
    colLower.includes('created') ||
    colLower.includes('updated')
  ) {
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      try {
        const date = new Date(value);
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      } catch {
        return String(value);
      }
    }
  }

  // Numbers
  if (typeof value === 'number') {
    return new Intl.NumberFormat('fr-FR').format(value);
  }

  return String(value);
}

/**
 * Render cell value with special formatting for certain types
 */
function renderCellValue(value: unknown, column: string): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">-</span>;
  }

  const colLower = column.toLowerCase();
  const formatted = formatValue(value, column);

  // Qualification badge
  if (colLower === 'qualification') {
    const qual = String(value).toLowerCase();
    return (
      <Badge
        variant="outline"
        className={cn(
          'text-[10px]',
          qual === 'chaud' && 'bg-red-500/20 text-red-500 border-red-500/30',
          qual === 'tiede' && 'bg-orange-500/20 text-orange-500 border-orange-500/30',
          qual === 'froid' && 'bg-blue-500/20 text-blue-500 border-blue-500/30',
          qual === 'non_qualifie' && 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
        )}
      >
        {qual === 'non_qualifie' ? 'Nouveau' : formatted}
      </Badge>
    );
  }

  // Stage badge
  if (colLower === 'etape' || colLower === 'stage_slug') {
    const stageLabels: Record<string, string> = {
      nouveau: 'Nouveau',
      en_attente: 'En attente',
      rdv_pris: 'RDV Pris',
      rdv_effectue: 'RDV Effectue',
      negociation: 'Negociation',
      gagne: 'Gagne',
      perdu: 'Perdu',
    };
    return (
      <Badge variant="secondary" className="text-[10px]">
        {stageLabels[String(value)] || formatted}
      </Badge>
    );
  }

  // Score with color
  if (colLower.includes('score')) {
    const score = Number(value);
    return (
      <span
        className={cn(
          'font-semibold',
          score >= 70 && 'text-red-500',
          score >= 40 && score < 70 && 'text-orange-500',
          score < 40 && 'text-blue-500'
        )}
      >
        {score}
      </span>
    );
  }

  // Email with truncation
  if (colLower === 'email') {
    return (
      <span className="truncate max-w-[150px] block" title={String(value)}>
        {formatted}
      </span>
    );
  }

  // Money values
  if (
    colLower.includes('patrimoine') ||
    colLower.includes('revenu') ||
    colLower.includes('deal')
  ) {
    return <span className="text-green-600 dark:text-green-400 font-medium">{formatted}</span>;
  }

  return formatted;
}
