import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';

export const dynamic = 'force-dynamic';
import { ThresholdConfigForm } from '@/components/settings/ThresholdConfigForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, AlertTriangle } from 'lucide-react';

async function getThresholdData() {
  const context = await getCurrentUserAndOrganization();

  if (!context) {
    redirect('/login');
  }

  // Vérifier que l'utilisateur est admin
  if (context.user.role !== 'admin') {
    redirect('/dashboard');
  }

  // Récupérer les seuils de l'organisation (stockés dans scoring_config)
  const supabase = await createClient();

  const { data: organization } = await supabase
    .from('organizations')
    .select('scoring_config')
    .eq('id', context.organization.id)
    .single();

  // Seuils par défaut si pas configurés
  const defaultThresholds = {
    // Alertes
    alert_low_conversion: 10,
    alert_inactive_days: 5,
    alert_no_show_rate: 30,

    // Performance badges
    performance_excellent_conversion: 15,
    performance_good_conversion: 10,
    performance_high_activity_7d: 6,
    performance_high_activity_30d: 20,
    performance_high_activity_90d: 60,
    performance_medium_activity_7d: 4,
    performance_medium_activity_30d: 15,
    performance_medium_activity_90d: 40,

    // Couleurs entonnoir
    funnel_excellent: 80,
    funnel_very_good: 65,
    funnel_good: 50,
    funnel_medium: 35,
    funnel_poor: 20,

    // Activity heatmap
    activity_weak_max: 3,
    activity_moderate_max: 8,
    activity_high_max: 15,

    // Tendances
    trend_positive_threshold: 5,
    trend_negative_threshold: -5,

    // Dashboard insights
    dashboard_excellent_conversion: 15,
    dashboard_good_conversion: 10
  };

  const currentThresholds = organization?.scoring_config?.admin_thresholds || defaultThresholds;

  return {
    organization: context.organization,
    thresholds: { ...defaultThresholds, ...currentThresholds }
  };
}

function ThresholdConfigSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-6">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default async function ThresholdConfigPage() {
  const data = await getThresholdData();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Configuration des Seuils</h1>
          <p className="text-muted-foreground">
            Configurez les seuils pour les alertes, badges de performance et codes couleurs du dashboard admin
          </p>
        </div>
      </div>

      <div className="bg-yellow-50/50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-800 dark:text-yellow-300">
              Configuration Administrateur
            </p>
            <p className="text-yellow-700 dark:text-yellow-400 mt-1">
              Cette page est accessible uniquement aux administrateurs.
              Les modifications affectent immédiatement les alertes, couleurs et badges de performance pour tous les conseillers.
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<ThresholdConfigSkeleton />}>
        <ThresholdConfigForm
          organizationId={data.organization.id}
          initialThresholds={data.thresholds}
        />
      </Suspense>
    </div>
  );
}