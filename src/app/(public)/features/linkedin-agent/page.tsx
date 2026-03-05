'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import FeaturePageTemplate from '@/components/features/FeaturePageTemplate';

const LinkedInAgentMockup = dynamic(
  () => import('@/components/landing/LinkedInAgentMockup'),
  { ssr: false }
);

export default function LinkedInAgentFeaturePage() {
  useEffect(() => {
    document.title = 'Générateur de Posts LinkedIn IA | Ultron';
  }, []);
  return (
    <FeaturePageTemplate
      badge="LinkedIn Agent"
      title="Générateur de Posts LinkedIn"
      subtitle="Du contenu expert en 30 secondes"
      description="L'IA analyse l'actualité financière et génère des posts LinkedIn adaptés à votre identité de cabinet. Renforcez votre autorité et attirez de nouveaux clients."
      accentColor="#0077b5"
      mockup={<LinkedInAgentMockup />}
      sections={[
        {
          title: '8 thèmes spécialisés',
          description:
            "Choisissez le sujet qui correspond à votre expertise et à l'actualité du moment. L'IA sélectionne les informations les plus pertinentes.",
          points: [
            'Marchés financiers et tendances économiques',
            'Épargne et placements : conseils pratiques',
            'Fiscalité : optimisation et actualités',
            'Immobilier, retraite, succession et plus',
          ],
        },
        {
          title: 'Personnalisation complète',
          description:
            "Configurez l'identité de votre cabinet : spécialités, ton de communication, chiffres clés. L'IA s'adapte à votre style.",
          points: [
            'Nom du cabinet, description et valeurs',
            'Nombre de clients, rendement moyen, encours',
            '4 tons disponibles : professionnel, accessible, expert, décontracté',
            'Hashtags personnalisés et CTA intégrés',
          ],
        },
        {
          title: 'Workflow optimisé',
          description:
            'Preview LinkedIn en temps réel, régénération en un clic, historique complet. Copiez et publiez directement sur LinkedIn.',
          points: [
            'Preview fidèle au rendu LinkedIn',
            'Régénération et variation instantanées',
            'Historique et archive des posts générés',
            'Copie en un clic pour publication',
          ],
        },
      ]}
    />
  );
}
