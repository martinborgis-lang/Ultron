import React from 'react';

export interface JsonLdProps {
  data: object;
  id?: string;
}

/**
 * Composant générique pour injecter des données structurées JSON-LD
 * Optimisé pour le SEO et la conformité Schema.org
 */
export function JsonLd({ data, id }: JsonLdProps) {
  // Validation basique des données
  if (!data || typeof data !== 'object') {
    console.warn('JsonLd: données invalides ou manquantes', data);
    return null;
  }

  // S'assurer que le contexte Schema.org est présent
  const structuredData = {
    '@context': 'https://schema.org',
    ...data
  };

  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 0)
      }}
    />
  );
}

/**
 * Hook pour générer des schemas courants
 */
export const useSchemaGenerators = () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ultron-murex.vercel.app';

  const generateOrganization = () => ({
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'Ultron',
    alternateName: 'Ultron CRM',
    description: 'Plateforme CRM intelligente pour Conseillers en Gestion de Patrimoine',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/logo.png`,
      width: 300,
      height: 300
    },
    foundingDate: '2024',
    numberOfEmployees: '5-10',
    areaServed: {
      '@type': 'Country',
      name: 'France'
    },
    knowsAbout: [
      'CRM Gestion de Patrimoine',
      'Intelligence Artificielle',
      'Prospection Automatisée',
      'Qualification IA',
      'Agent Vocal IA',
      'Transcription Meetings',
      'Pipeline Commercial'
    ],
    sameAs: [
      'https://linkedin.com/company/ultron-crm',
      'https://twitter.com/ultron_crm'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+33-1-23-45-67-89',
      contactType: 'customer service',
      areaServed: 'FR',
      availableLanguage: 'French'
    }
  });

  const generateWebsite = () => ({
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    name: 'Ultron CRM',
    url: baseUrl,
    publisher: {
      '@id': `${baseUrl}/#organization`
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    },
    inLanguage: 'fr-FR'
  });

  const generateSoftwareApplication = () => ({
    '@type': 'SoftwareApplication',
    '@id': `${baseUrl}/#software`,
    name: 'Ultron',
    description: 'CRM IA pour cabinets de gestion de patrimoine. Automatisez la prospection, la qualification et le suivi client.',
    url: baseUrl,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'CRM Software',
    operatingSystem: 'Web',
    softwareVersion: '1.0',
    releaseDate: '2024-01-01',
    downloadUrl: baseUrl,
    screenshot: [
      `${baseUrl}/screenshots/dashboard.png`,
      `${baseUrl}/screenshots/pipeline.png`,
      `${baseUrl}/screenshots/extension.png`
    ],
    offers: [
      {
        '@type': 'Offer',
        name: 'Essai Gratuit',
        price: '0',
        priceCurrency: 'EUR',
        description: 'Essai gratuit de 14 jours sans engagement',
        eligibleDuration: 'P14D',
        availability: 'https://schema.org/InStock'
      },
      {
        '@type': 'Offer',
        name: 'Plan Professionnel',
        price: '49',
        priceCurrency: 'EUR',
        description: 'Accès complet pour cabinet de gestion de patrimoine',
        billingDuration: 'P1M',
        availability: 'https://schema.org/InStock'
      }
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '47',
      bestRating: '5',
      worstRating: '1'
    },
    featureList: [
      'Pipeline CRM intelligent avec drag & drop',
      'Qualification IA automatique des prospects (CHAUD/TIÈDE/FROID)',
      'Agent vocal IA pour appels automatiques avec Vapi.ai',
      'Transcription et analyse IA de meetings Google Meet',
      'Extension Chrome pour analyse temps réel pendant appels',
      'Générateur de posts LinkedIn IA personnalisé cabinet',
      'Moteur de recherche prospects multi-sources',
      'Click-to-Call WebRTC intégré avec Twilio',
      'Dashboard admin avec KPIs et analytics avancés',
      'Assistant IA conversationnel pour requêtes naturelles',
      'Planning intégré avec sync Google Calendar bidirectionnelle',
      'Système de commissions et gestion produits'
    ],
    creator: {
      '@id': `${baseUrl}/#organization`
    },
    publisher: {
      '@id': `${baseUrl}/#organization`
    }
  });

  const generateBreadcrumbList = (items: Array<{name: string, url: string}>) => ({
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  });

  const generateFAQPage = (faqs: Array<{question: string, answer: string}>) => ({
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  });

  return {
    generateOrganization,
    generateWebsite,
    generateSoftwareApplication,
    generateBreadcrumbList,
    generateFAQPage
  };
};