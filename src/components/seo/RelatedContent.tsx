'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface RelatedItem {
  title: string;
  href: string;
  description: string;
  badge?: string;
  category: 'feature' | 'blog' | 'comparison' | 'local';
}

interface RelatedContentProps {
  currentPage: string;
  category: 'feature' | 'blog' | 'comparison' | 'local';
  maxItems?: number;
  exclude?: string[];
  customItems?: RelatedItem[];
}

// Base de données des contenus liés pour le maillage intelligent
const CONTENT_DATABASE: RelatedItem[] = [
  // Features
  {
    title: 'Pipeline CRM Intelligent avec Drag & Drop',
    href: '/features/crm',
    description: 'Gérez vos prospects dans un Kanban visuel avec qualification IA automatique et actions programmées.',
    badge: 'CRM Pipeline',
    category: 'feature'
  },
  {
    title: 'Assistant IA Conversationnel pour CGP',
    href: '/features/ai-assistant',
    description: 'Interrogez vos données en français naturel. L\'IA traduit vos questions en requêtes SQL sécurisées.',
    badge: 'Intelligence IA',
    category: 'feature'
  },
  {
    title: 'Agent Vocal IA pour Qualification Automatique',
    href: '/features/voice',
    description: 'Appels automatiques avec IA conversationnelle pour qualifier vos prospects téléphoniquement.',
    badge: 'Agent Vocal',
    category: 'feature'
  },
  {
    title: 'Moteur de Recherche de Prospects CGP',
    href: '/features/lead-finder',
    description: 'Trouvez des commerçants, professions libérales et dirigeants qualifiés via Google Maps et Pappers.',
    badge: 'Lead Generation',
    category: 'feature'
  },
  {
    title: 'Extension Chrome pour Google Meet',
    href: '/features/extension',
    description: 'Transcription temps réel et analyse IA de vos RDV avec suggestions contextuelles.',
    badge: 'Extension',
    category: 'feature'
  },
  {
    title: 'Générateur de Posts LinkedIn IA',
    href: '/features/linkedin-agent',
    description: 'Créez du contenu expert LinkedIn en 30 secondes avec 8 thèmes spécialisés CGP.',
    badge: 'LinkedIn Marketing',
    category: 'feature'
  },
  {
    title: 'Système de Transcription IA Avancé',
    href: '/features/meetings',
    description: 'Transcription automatique de vos RDV avec analyse, résumé et détection d\'objections.',
    badge: 'Meetings IA',
    category: 'feature'
  },

  // Articles blog (à compléter avec le contenu de l'Agent 2)
  {
    title: 'Guide Complet CRM pour Conseillers en Patrimoine 2026',
    href: '/blog/guide-crm-cgp-2026',
    description: 'Découvrez comment choisir et utiliser un CRM adapté aux spécificités des cabinets CGP.',
    badge: 'Guide CRM',
    category: 'blog'
  },
  {
    title: 'IA et Gestion de Patrimoine : Révolution des CGP',
    href: '/blog/ia-gestion-patrimoine-cgp',
    description: 'Comment l\'intelligence artificielle transforme la prospection et qualification des CGP.',
    badge: 'IA CGP',
    category: 'blog'
  },
  {
    title: 'Automatisation Prospection : 5 Stratégies CGP 2026',
    href: '/blog/automatisation-prospection-cgp',
    description: 'Techniques avancées pour automatiser votre prospection et doubler vos conversions.',
    badge: 'Prospection',
    category: 'blog'
  },

  // Pages comparatives (préparation pour Agent concurrence)
  {
    title: 'Ultron vs Salesforce : Comparatif CRM CGP',
    href: '/vs-salesforce-crm-cgp',
    description: 'Pourquoi Ultron surpasse Salesforce pour les conseillers en gestion de patrimoine.',
    badge: 'Comparatif',
    category: 'comparison'
  },
  {
    title: 'Alternative Simple à HubSpot pour CGP',
    href: '/vs-hubspot-cgp-simple',
    description: 'Découvrez pourquoi Ultron est plus adapté qu\'HubSpot aux besoins des CGP.',
    badge: 'vs HubSpot',
    category: 'comparison'
  },
];

// Logique de recommandation intelligente
function getRelatedContent(
  currentPage: string,
  category: 'feature' | 'blog' | 'comparison' | 'local',
  maxItems: number = 3,
  exclude: string[] = [],
  customItems: RelatedItem[] = []
): RelatedItem[] {
  const allContent = [...CONTENT_DATABASE, ...customItems];

  // Exclure la page actuelle et les pages exclues
  const filtered = allContent.filter(item =>
    item.href !== currentPage &&
    !exclude.includes(item.href)
  );

  // Logique de recommandation selon le contexte
  let prioritized: RelatedItem[] = [];

  switch (category) {
    case 'feature':
      // Pour une page feature, prioriser: autres features > blog liés > comparatifs
      prioritized = [
        ...filtered.filter(item => item.category === 'feature'),
        ...filtered.filter(item => item.category === 'blog'),
        ...filtered.filter(item => item.category === 'comparison'),
      ];
      break;

    case 'blog':
      // Pour un article blog, prioriser: features mentionnées > autres blogs > comparatifs
      prioritized = [
        ...filtered.filter(item => item.category === 'feature'),
        ...filtered.filter(item => item.category === 'blog'),
        ...filtered.filter(item => item.category === 'comparison'),
      ];
      break;

    case 'comparison':
      // Pour une page comparative, prioriser: features différenciantes > blog > autres comparatifs
      prioritized = [
        ...filtered.filter(item => item.category === 'feature'),
        ...filtered.filter(item => item.category === 'blog'),
        ...filtered.filter(item => item.category === 'comparison'),
      ];
      break;

    case 'local':
      // Pour pages CGP locales, prioriser: features > blog régional > comparatifs
      prioritized = [
        ...filtered.filter(item => item.category === 'feature'),
        ...filtered.filter(item => item.category === 'blog'),
        ...filtered.filter(item => item.category === 'comparison'),
      ];
      break;

    default:
      prioritized = filtered;
  }

  return prioritized.slice(0, maxItems);
}

export default function RelatedContent({
  currentPage,
  category,
  maxItems = 3,
  exclude = [],
  customItems = []
}: RelatedContentProps) {
  const relatedItems = getRelatedContent(currentPage, category, maxItems, exclude, customItems);

  if (relatedItems.length === 0) return null;

  return (
    <section className="py-16 bg-gray-50/50 border-t border-gray-100">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">
            Découvrez aussi
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explorez d'autres fonctionnalités Ultron qui pourraient vous intéresser
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {relatedItems.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-blue-200"
            >
              {item.badge && (
                <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full mb-3">
                  {item.badge}
                </span>
              )}

              <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                {item.title}
              </h4>

              <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                {item.description}
              </p>

              <div className="flex items-center mt-4 text-sm font-medium text-blue-600 group-hover:text-blue-700">
                En savoir plus
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="ml-1 transition-transform group-hover:translate-x-0.5"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Hook pour définir facilement le contenu lié
export function useRelatedContent(currentPage: string, category: 'feature' | 'blog' | 'comparison' | 'local') {
  return {
    RelatedContentSection: ({ maxItems, exclude, customItems }: Omit<RelatedContentProps, 'currentPage' | 'category'>) => (
      <RelatedContent
        currentPage={currentPage}
        category={category}
        maxItems={maxItems}
        exclude={exclude}
        customItems={customItems}
      />
    )
  };
}