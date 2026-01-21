import { Suspense } from 'react';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { redirect } from 'next/navigation';
import { ProductsManager } from '@/components/settings/ProductsManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getProductsData() {
  const context = await getCurrentUserAndOrganization();

  if (!context) {
    redirect('/login');
  }

  // Vérifier que l'utilisateur est admin
  if (context.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return {
    organization: context.organization,
    user: context.user
  };
}

function ProductsManagerSkeleton() {
  return (
    <div className="space-y-6">
      {Array(3).fill(0).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array(3).fill(0).map((_, j) => (
              <div key={j} className="flex items-center justify-between p-3 border rounded">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function ProductsPage() {
  const data = await getProductsData();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingCart className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Gestion des Produits</h1>
          <p className="text-muted-foreground">
            Configurez les produits vendus et les taux de commission de vos conseillers
          </p>
        </div>
      </div>

      <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-300">
              Configuration des Produits et Commissions
            </p>
            <div className="text-blue-700 dark:text-blue-400 mt-1 space-y-1">
              <p><strong>Produits à Bénéfice Fixe :</strong> L'entreprise gagne un montant fixe par vente</p>
              <p><strong>Produits à Commission :</strong> L'entreprise gagne un % du montant investi par le client</p>
              <p><strong>Commissions Conseillers :</strong> % sur le CA généré, configurable par produit/conseiller</p>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<ProductsManagerSkeleton />}>
        <ProductsManager
          organizationId={data.organization.id}
        />
      </Suspense>
    </div>
  );
}