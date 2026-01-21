'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Euro, TrendingUp, AlertCircle, CheckCircle2, Settings } from 'lucide-react';
import Link from 'next/link';

interface RevenueExplanationProps {
  totalRevenue: number;
  totalDealsWon: number;
  className?: string;
}

export function RevenueExplanation({
  totalRevenue,
  totalDealsWon,
  className = ''
}: RevenueExplanationProps) {
  const hasRevenue = totalRevenue > 0;
  const hasWonDeals = totalDealsWon > 0;

  // Si tout va bien, ne pas afficher l'explication
  if (hasRevenue && hasWonDeals) {
    return null;
  }

  return (
    <Card className={`border-amber-200 dark:border-amber-800 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <Euro className="h-5 w-5" />
          Configuration des Revenus
        </CardTitle>
        <CardDescription className="text-amber-700 dark:text-amber-300">
          {!hasWonDeals ?
            "Aucun deal gagné détecté dans votre pipeline" :
            "Des deals sont gagnés mais sans valeur financière configurée"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Pourquoi les revenus sont à 0 ?</strong>
            <br />
            Le calcul des revenus se base sur les prospects avec :
            <ul className="mt-2 space-y-1 text-sm">
              <li className="flex items-center gap-2">
                {hasWonDeals ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
                Stage = "Gagné" ({totalDealsWon} deals trouvés)
              </li>
              <li className="flex items-center gap-2">
                {hasRevenue ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
                Champ "deal_value" rempli ({hasRevenue ? 'OK' : 'Manquant'})
              </li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Comment configurer les revenus :</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded border">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">1. Pipeline</Badge>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Déplacez vos prospects dans le stage <strong>"Gagné"</strong> quand ils signent
              </p>
            </div>

            <div className="p-3 bg-green-50/50 dark:bg-green-900/20 rounded border">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">2. Valeur</Badge>
                <Euro className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-sm text-green-800 dark:text-green-200">
                Renseignez la <strong>valeur du deal</strong> dans la fiche prospect
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Link href="/prospects">
              <Button size="sm" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Configurer mes prospects
              </Button>
            </Link>
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-900/30 p-3 rounded">
          <strong>Note CGP :</strong> En gestion de patrimoine, les revenus varient selon les produits
          (AuM, commissions, honoraires). Configurez les valeurs après signature pour un suivi précis.
        </div>
      </CardContent>
    </Card>
  );
}