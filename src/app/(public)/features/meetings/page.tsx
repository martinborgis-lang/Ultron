import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import FeaturePageTemplate from '@/components/features/FeaturePageTemplate';

const ExtensionMockup = dynamic(
  () =>
    import('@/components/landing/ExtensionMockup').then((m) => ({
      default: m.ExtensionMockup,
    })),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Transcription & Analyse IA de RDV',
  description:
    'Transcrivez automatiquement vos RDV Google Meet. Obtenez des résumés IA, points clés, objections détectées et prochaines actions.',
  keywords: [
    'transcription RDV CGP',
    'analyse meeting IA',
    'compte-rendu automatique',
    'Google Meet CGP',
  ],
  openGraph: {
    title: 'Transcription & Analyse IA de RDV | Ultron',
    description:
      'Transformez vos RDV en insights actionnables grâce à l\'IA.',
    type: 'website',
  },
};

export default function MeetingsFeaturePage() {
  return (
    <FeaturePageTemplate
      badge="Meetings & Transcription"
      title="Transcription & Analyse IA"
      subtitle="Transformez chaque RDV en insights actionnables"
      description="Enregistrez vos rendez-vous Google Meet et obtenez automatiquement une transcription structurée, un résumé intelligent et des actions suggérées par l'IA."
      accentColor="#f97316"
      mockup={<ExtensionMockup />}
      sections={[
        {
          title: 'Transcription automatique',
          description:
            "L'audio de votre meeting est converti en texte structuré avec identification des interlocuteurs. Support du français optimisé pour le vocabulaire financier.",
          points: [
            'Conversion audio → texte en temps réel',
            'Identification automatique des speakers',
            'Vocabulaire financier et CGP optimisé',
            'Support formats MP3, WAV, M4A',
          ],
        },
        {
          title: 'Analyse IA post-meeting',
          description:
            "L'IA analyse la transcription et extrait les informations clés : résumé, points importants, objections détectées et prochaines actions à mener.",
          points: [
            'Résumé intelligent en quelques lignes',
            'Points clés et informations financières détectées',
            'Objections identifiées avec réponses suggérées',
            'Liste d\'actions prioritaires pour le suivi',
          ],
        },
        {
          title: 'Export et suivi',
          description:
            'Générez un rapport PDF professionnel complet. Chaque transcription est liée au prospect dans votre CRM pour un suivi sans faille.',
          points: [
            'Export PDF avec branding personnalisé',
            'Liaison automatique prospect ↔ meeting',
            'Historique complet par prospect',
            'Préparation IA du prochain RDV',
          ],
        },
      ]}
    />
  );
}
