'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import FeaturePageTemplate from '@/components/features/FeaturePageTemplate';

const AssistantMockup = dynamic(() => import('@/components/landing/AssistantMockup').then(m => ({ default: m.AssistantMockup })), { ssr: false });

export default function AIAssistantFeaturePage() {
  useEffect(() => {
    document.title = 'Assistant IA Conversationnel | Ultron';
  }, []);

  return (
    <FeaturePageTemplate
      badge="Intelligence Artificielle"
      title="Assistant IA Conversationnel"
      subtitle="Interrogez vos données en langage naturel"
      description="Posez vos questions en français : 'Combien de prospects chauds ce mois-ci ?'. L'IA traduit, interroge votre base et vous répond avec des tableaux interactifs."
      accentColor="#8b5cf6"
      mockup={<AssistantMockup />}
      currentPath="/features/ai-assistant"
      ctaText="Essayer l'Assistant IA"
      sections={[
        {
          title: 'Requêtes en français naturel',
          description: 'Plus besoin de naviguer dans des menus complexes. Posez votre question comme vous la poseriez à un collègue et obtenez une réponse structurée instantanément.',
          points: [
            '"Quels sont mes 5 meilleurs prospects ?"',
            '"Combien de RDV cette semaine ?"',
            '"Quel est mon taux de conversion par source ?"',
            '"Compare les performances de l\'équipe ce trimestre"',
          ],
        },
        {
          title: 'Analyses et insights métier',
          description: 'L\'IA ne se contente pas de requêter : elle analyse les tendances, identifie les anomalies et suggère des actions pour améliorer vos résultats.',
          points: [
            'Détection automatique des tendances',
            'Identification des goulots d\'étranglement dans le pipeline',
            'Suggestions d\'actions prioritaires',
            'Prédictions basées sur l\'historique',
          ],
        },
        {
          title: 'Sécurité et contrôle',
          description: 'Toutes les requêtes sont filtrées, validées et limitées à votre périmètre de données. L\'IA ne peut accéder qu\'aux données de votre organisation.',
          points: [
            'Requêtes SQL sécurisées et validées',
            'Respect strict du Row Level Security (RLS)',
            'Aucune modification de données possible',
            'Historique complet des conversations',
          ],
        },
      ]}
    />
  );
}
