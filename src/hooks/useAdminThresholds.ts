import { useEffect, useState } from 'react';

export interface AdminThresholds {
  // Alertes
  alert_low_conversion: number;
  alert_inactive_days: number;
  alert_no_show_rate: number;

  // Performance badges
  performance_excellent_conversion: number;
  performance_good_conversion: number;
  performance_high_activity_7d: number;
  performance_high_activity_30d: number;
  performance_high_activity_90d: number;
  performance_medium_activity_7d: number;
  performance_medium_activity_30d: number;
  performance_medium_activity_90d: number;

  // Couleurs entonnoir
  funnel_excellent: number;
  funnel_very_good: number;
  funnel_good: number;
  funnel_medium: number;
  funnel_poor: number;

  // Activity heatmap
  activity_weak_max: number;
  activity_moderate_max: number;
  activity_high_max: number;

  // Tendances
  trend_positive_threshold: number;
  trend_negative_threshold: number;

  // Dashboard insights
  dashboard_excellent_conversion: number;
  dashboard_good_conversion: number;
}

// Seuils par défaut
const DEFAULT_THRESHOLDS: AdminThresholds = {
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

export function useAdminThresholds() {
  const [thresholds, setThresholds] = useState<AdminThresholds>(DEFAULT_THRESHOLDS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        const response = await fetch('/api/admin/thresholds');

        if (!response.ok) {
          // Si pas admin ou autre erreur, utiliser les seuils par défaut
          setThresholds(DEFAULT_THRESHOLDS);
          setLoading(false);
          return;
        }

        const data = await response.json();
        setThresholds({ ...DEFAULT_THRESHOLDS, ...data.thresholds });
      } catch (err) {
        console.error('Erreur récupération seuils:', err);
        setError('Erreur lors de la récupération des seuils');
        setThresholds(DEFAULT_THRESHOLDS);
      } finally {
        setLoading(false);
      }
    };

    fetchThresholds();
  }, []);

  return { thresholds, loading, error };
}

// Hook pour accès direct aux seuils sans loading (utilise les valeurs par défaut)
export function getDefaultThresholds(): AdminThresholds {
  return DEFAULT_THRESHOLDS;
}