/**
 * Index des helpers SEO pour Ultron CRM
 * Export centralisé des utilitaires SEO techniques
 */

// Canonical helpers
export {
  generateCanonicalUrl,
  checkCanonicalRedirect,
  generateCanonicalMetadata,
  getCanonicalHeaders,
  isAuthorizedDomain,
  getCSPDomains,
  CANONICAL_CONFIG
} from './canonical';

// Security helpers
export {
  validateIncomingRequest,
  generateSecurityHeaders,
  sanitizeUrlParams,
  generateSecurityReport,
  SEO_SECURITY_CONFIG
} from './security';

// Meta helpers pour Next.js App Router
export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl: string;
  ogImage?: string;
  structuredData?: Record<string, any>;
}

/**
 * Génère les métadonnées complètes pour une page
 */
export function generatePageMetadata({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage = '/images/og-image.jpg',
  structuredData
}: SEOMetadata) {
  const baseUrl = 'https://ultron-ai.pro';

  return {
    title: `${title} | Ultron CRM`,
    description,
    keywords,
    authors: [{ name: 'Ultron CRM', url: baseUrl }],
    creator: 'Ultron CRM',
    publisher: 'Ultron CRM',

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title: `${title} | Ultron CRM`,
      description,
      siteName: 'Ultron CRM',
      images: [
        {
          url: `${baseUrl}${ogImage}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'fr_FR',
    },

    twitter: {
      card: 'summary_large_image',
      title: `${title} | Ultron CRM`,
      description,
      images: [`${baseUrl}${ogImage}`],
      creator: '@UltronCRM',
    },

    alternates: {
      canonical: canonicalUrl,
    },

    verification: {
      google: 'your-google-site-verification-code',
      yandex: 'your-yandex-verification-code',
      bing: 'your-bing-verification-code',
    },

    other: structuredData ? {
      'structured-data': JSON.stringify(structuredData)
    } : undefined
  };
}

/**
 * Génère les données structurées JSON-LD pour une page
 */
export function generateStructuredData(type: 'organization' | 'product' | 'article' | 'faq', data: any) {
  const baseUrl = 'https://ultron-ai.pro';

  switch (type) {
    case 'organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Ultron CRM',
        url: baseUrl,
        logo: `${baseUrl}/images/logo.png`,
        description: 'Solution CRM complète pour Conseillers en Gestion de Patrimoine',
        foundingDate: '2024',
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+33-1-XX-XX-XX-XX',
          contactType: 'customer service',
          availableLanguage: 'French'
        },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Paris',
          addressCountry: 'FR'
        },
        sameAs: [
          'https://linkedin.com/company/ultron-crm',
          'https://twitter.com/UltronCRM'
        ]
      };

    case 'product':
      return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Ultron CRM',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web Browser',
        offers: {
          '@type': 'Offer',
          price: 'Variable',
          priceCurrency: 'EUR'
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          reviewCount: '200'
        },
        description: data.description
      };

    case 'article':
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data.title,
        description: data.description,
        author: {
          '@type': 'Organization',
          name: 'Ultron CRM'
        },
        publisher: {
          '@type': 'Organization',
          name: 'Ultron CRM',
          logo: `${baseUrl}/images/logo.png`
        },
        datePublished: data.publishDate,
        dateModified: data.modifyDate || data.publishDate
      };

    case 'faq':
      return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: data.questions.map((q: any) => ({
          '@type': 'Question',
          name: q.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: q.answer
          }
        }))
      };

    default:
      return null;
  }
}