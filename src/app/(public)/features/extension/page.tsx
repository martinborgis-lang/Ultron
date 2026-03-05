'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import FeaturePageTemplate from '@/components/features/FeaturePageTemplate';

const ExtensionMockup = dynamic(
  () =>
    import('@/components/landing/ExtensionMockup').then((m) => ({
      default: m.ExtensionMockup,
    })),
  { ssr: false }
);

export default function ExtensionFeaturePage() {
  useEffect(() => {
    document.title = 'Extension Chrome Side Panel | Ultron';
  }, []);
  return (
    <FeaturePageTemplate
      badge="Extension Chrome"
      title="Extension Chrome Side Panel"
      subtitle="Votre copilote IA pendant les appels"
      description="Installez l'extension Chrome Ultron et accédez à un panneau latéral intelligent pendant vos appels Google Meet. Suggestions de questions, analyse en temps réel et sync CRM automatique."
      accentColor="#f97316"
      mockup={<ExtensionMockup />}
      sections={[
        {
          title: 'Analyse temps réel pendant l\'appel',
          description:
            "L'extension analyse la conversation en cours et suggère des questions pertinentes, des arguments commerciaux et des réponses aux objections — le tout en temps réel.",
          points: [
            'Questions suggérées adaptées au profil prospect',
            'Détection d\'objections avec réponses recommandées',
            'Arguments de vente contextuels',
            'Score de qualification mis à jour en direct',
          ],
        },
        {
          title: 'Préparation RDV intelligente',
          description:
            'Avant chaque appel, l\'extension prépare automatiquement un brief complet basé sur l\'historique du prospect dans votre CRM.',
          points: [
            'Fiche prospect complète en un coup d\'œil',
            'Historique des interactions précédentes',
            'Événements calendrier liés (Google Calendar)',
            'Suggestions de stratégie pour ce RDV',
          ],
        },
        {
          title: 'Synchronisation CRM automatique',
          description:
            'Toutes les données captées pendant l\'appel sont automatiquement synchronisées avec votre CRM. Aucune saisie manuelle requise.',
          points: [
            'Notes d\'appel sauvegardées automatiquement',
            'Activités CRM créées en temps réel',
            'Mise à jour statut prospect après l\'appel',
            'Transcription liée à la fiche prospect',
          ],
        },
      ]}
    />
  );
}
