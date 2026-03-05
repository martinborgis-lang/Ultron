'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import FeaturePageTemplate from '@/components/features/FeaturePageTemplate';

const LeadFinderMockup = dynamic(() => import('@/components/landing/LeadFinderMockup'), { ssr: false });

export default function LeadFinderFeaturePage() {
  useEffect(() => {
    document.title = 'Moteur de Recherche Prospects | Ultron';
  }, []);
  return (
    <FeaturePageTemplate
      badge="Lead Finder"
      title="Moteur de Recherche Prospects"
      subtitle="Trouvez vos futurs clients en quelques clics"
      description="Recherchez parmi 5 millions de professionnels. Commerçants, professions libérales, dirigeants d'entreprises — avec données de contact enrichies et import direct vers votre CRM."
      accentColor="#10b981"
      mockup={<LeadFinderMockup />}
      sections={[
        {
          title: '3 catégories de prospects',
          description: 'Ciblez précisément le type de client que vous recherchez. Chaque catégorie utilise des sources de données spécialisées pour garantir la qualité.',
          points: [
            'Commerçants & Artisans via Google Maps',
            'Professions libérales (médecins, avocats, architectes)',
            'Dirigeants d\'entreprises via Pappers (SIREN, capital, effectif)',
            'Recherche par ville, code postal ou rayon',
          ],
        },
        {
          title: 'Données enrichies et vérifiées',
          description: 'Chaque prospect est accompagné de coordonnées complètes et d\'un score de qualité. Les données sont vérifiées automatiquement avant import.',
          points: [
            'Téléphone, email, adresse complète',
            'Site web et informations légales',
            'Score de qualité automatique',
            'Détection des doublons dans votre CRM',
          ],
        },
        {
          title: 'Système de crédits transparent',
          description: 'Consommez des crédits uniquement pour les recherches effectuées. Suivi détaillé de votre consommation avec historique complet.',
          points: [
            'Tarification transparente par recherche',
            'Suivi consommation en temps réel',
            'Historique complet des recherches',
            'Statistiques de qualité par source',
          ],
        },
      ]}
    />
  );
}
