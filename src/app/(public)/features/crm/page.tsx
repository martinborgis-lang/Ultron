import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import FeaturePageTemplate from '@/components/features/FeaturePageTemplate';

const PipelineMockup = dynamic(() => import('@/components/landing/PipelineMockup').then(m => ({ default: m.PipelineMockup })), { ssr: false });

export const metadata: Metadata = {
  title: 'Pipeline CRM Intelligent',
  description: 'Gérez vos prospects dans un pipeline CRM visuel avec Kanban, qualification IA automatique, drag & drop et gestion des commissions. Conçu pour les CGP.',
  keywords: ['CRM gestion patrimoine', 'pipeline commercial CGP', 'Kanban prospects', 'qualification IA'],
  openGraph: {
    title: 'Pipeline CRM Intelligent | Ultron',
    description: 'Le CRM intelligent conçu pour les conseillers en gestion de patrimoine.',
  },
};

export default function CRMFeaturePage() {
  return (
    <FeaturePageTemplate
      badge="Pipeline CRM"
      title="Pipeline CRM Intelligent"
      subtitle="Un Kanban visuel qui s'adapte à votre métier"
      description="Gérez l'ensemble de votre cycle de vente dans un pipeline intuitif. Chaque prospect est suivi, qualifié et accompagné automatiquement de A à Z."
      accentColor="#22c55e"
      mockup={<PipelineMockup />}
      sections={[
        {
          title: 'Vue Kanban drag & drop',
          description: 'Déplacez vos prospects d\'une étape à l\'autre en un glisser-déposer. Chaque transition peut déclencher des actions automatiques : envoi d\'email, création de tâche, notification.',
          points: [
            'Étapes personnalisables par organisation',
            'Actions automatiques sur chaque transition',
            'Badges de qualification IA (CHAUD/TIÈDE/FROID)',
            'Valeur totale du pipeline en temps réel',
          ],
        },
        {
          title: 'Gestion des produits et commissions',
          description: 'Configurez votre catalogue de produits financiers avec des commissions flexibles. Chaque vente est automatiquement liée au prospect, au conseiller et au produit.',
          points: [
            'Produits à bénéfice fixe ou à commission variable',
            'Taux de commission personnalisé par conseiller',
            'Calcul automatique du CA et des commissions',
            'Tableau de bord financier pour dirigeants',
          ],
        },
        {
          title: 'Qualification IA automatique',
          description: 'L\'intelligence artificielle analyse chaque prospect et attribue un score de qualification. Les critères sont personnalisables selon votre stratégie commerciale.',
          points: [
            'Scoring multicritère : revenus, patrimoine, comportement',
            'Classification CHAUD/TIÈDE/FROID automatique',
            'Seuils configurables par organisation',
            'Justification détaillée du score IA',
          ],
        },
      ]}
    />
  );
}
