'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import FeaturePageTemplate from '@/components/features/FeaturePageTemplate';

const VoiceAIAgentMockup = dynamic(() => import('@/components/landing/VoiceAIAgentMockup'), { ssr: false });

export default function VoiceFeaturePage() {
  useEffect(() => {
    document.title = 'Agent Vocal IA & Click-to-Call | Ultron';
  }, []);
  return (
    <FeaturePageTemplate
      badge="Agent Vocal & Téléphonie"
      title="Agent Vocal IA & Click-to-Call"
      subtitle="La prospection téléphonique automatisée"
      description="Combinez la puissance de l'IA conversationnelle avec des appels WebRTC intégrés. L'agent vocal qualifie automatiquement vos leads, et le Click-to-Call vous permet d'appeler en un clic."
      accentColor="#ef4444"
      mockup={<VoiceAIAgentMockup />}
      sections={[
        {
          title: 'Agent vocal IA automatique',
          description: 'L\'IA appelle vos prospects automatiquement, mène une conversation naturelle de qualification et programme des RDV directement dans votre agenda.',
          points: [
            'Déclenchement automatique sur formulaires web',
            'Conversation naturelle en français avec Vapi.ai',
            'Qualification CHAUD/TIÈDE/FROID en temps réel',
            'Prise de RDV automatique avec confirmation',
          ],
        },
        {
          title: 'Click-to-Call WebRTC',
          description: 'Appelez vos prospects directement depuis le CRM sans aucun plugin. Widget d\'appel intégré avec timer, notes et classification des résultats.',
          points: [
            'Appels WebRTC natifs via Twilio',
            'Timer en direct, mute et contrôles intégrés',
            'Notes d\'appel pendant et après la conversation',
            'Classification outcome : RDV pris, rappeler, pas intéressé',
          ],
        },
        {
          title: 'Analytics et suivi',
          description: 'Tableau de bord complet pour suivre la performance de votre téléphonie. Taux de réponse, durées moyennes, conversions et ROI.',
          points: [
            'Dashboard temps réel des appels en cours',
            'Historique complet avec enregistrements',
            'Taux de conversion par source et par conseiller',
            'ROI tracking : coût par lead qualifié',
          ],
        },
      ]}
    />
  );
}
