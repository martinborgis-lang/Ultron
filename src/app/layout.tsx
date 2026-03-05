import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { SeoMonitor } from "@/components/seo/SeoMonitor";
import { SchemaValidator } from "@/components/seo/SchemaValidator";
import "./globals.css";

// Optimisation fonts avec preload et display swap
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif'
  ],
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ultron-murex.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Ultron - CRM IA pour Cabinets de Gestion de Patrimoine",
    template: "%s | Ultron",
  },
  description: "Ultron automatise la prospection, la qualification IA et le suivi client pour les cabinets de gestion de patrimoine. Pipeline CRM intelligent, agent vocal IA, transcription meetings et plus.",
  keywords: [
    'CRM gestion patrimoine',
    'prospection CGP',
    'qualification prospects IA',
    'CRM IA',
    'gestion de patrimoine',
    'conseiller patrimoine',
    'CGP logiciel',
    'pipeline commercial',
    'agent vocal IA',
    'transcription meetings',
    'lead generation CGP',
    'automatisation prospection',
  ],
  authors: [{ name: 'Ultron', url: baseUrl }],
  creator: 'Ultron',
  publisher: 'Ultron',
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
    locale: 'fr_FR',
    url: baseUrl,
    siteName: 'Ultron',
    title: "Ultron - CRM IA pour Cabinets de Gestion de Patrimoine",
    description: "Automatisez votre prospection et boostez vos conversions avec l'IA. Pipeline CRM, agent vocal, transcription meetings, lead finder et plus.",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Ultron - CRM IA pour CGP',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Ultron - CRM IA pour Cabinets de Gestion de Patrimoine",
    description: "Automatisez votre prospection CGP avec l'IA. Pipeline intelligent, agent vocal, transcription meetings.",
    images: [`${baseUrl}/og-image.png`],
  },
  alternates: {
    canonical: baseUrl,
  },
  category: 'technology',
};

// JSON-LD Structured Data - Organization, Website et SoftwareApplication enrichis
const organizationSchema = {
  '@context': 'https://schema.org',
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
    'Pipeline Commercial',
    'Conformité MiFID II',
    'DDA (Directive sur la Distribution d\'Assurance)'
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
    availableLanguage: 'French',
    hoursAvailable: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00'
    }
  }
};

const websiteSchema = {
  '@context': 'https://schema.org',
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
};

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': `${baseUrl}/#software`,
  name: 'Ultron',
  description: 'CRM IA pour cabinets de gestion de patrimoine. Automatisez la prospection, la qualification et le suivi client avec l\'intelligence artificielle.',
  url: baseUrl,
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'CRM Software',
  operatingSystem: 'Web',
  softwareVersion: '2.1',
  releaseDate: '2024-01-01T00:00:00Z',
  downloadUrl: baseUrl,
  screenshot: [
    `${baseUrl}/screenshots/dashboard.png`,
    `${baseUrl}/screenshots/pipeline-kanban.png`,
    `${baseUrl}/screenshots/extension-chrome.png`,
    `${baseUrl}/screenshots/agent-vocal-ia.png`
  ],
  offers: [
    {
      '@type': 'Offer',
      name: 'Essai Gratuit',
      price: '0',
      priceCurrency: 'EUR',
      description: 'Essai gratuit de 14 jours sans engagement',
      eligibleDuration: 'P14D',
      availability: 'https://schema.org/InStock',
      validFrom: '2024-01-01T00:00:00Z'
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
    'Pipeline CRM intelligent avec drag & drop Kanban',
    'Qualification IA automatique des prospects (CHAUD/TIÈDE/FROID)',
    'Agent vocal IA pour appels automatiques avec Vapi.ai',
    'Transcription et analyse IA de meetings Google Meet',
    'Extension Chrome pour analyse temps réel pendant appels',
    'Générateur de posts LinkedIn IA personnalisé cabinet',
    'Moteur de recherche prospects multi-sources (Google Places, Outscraper)',
    'Click-to-Call WebRTC intégré avec Twilio',
    'Dashboard admin avec KPIs et analytics avancés',
    'Assistant IA conversationnel pour requêtes naturelles',
    'Planning intégré avec sync Google Calendar bidirectionnelle',
    'Système de commissions et gestion produits financiers'
  ],
  creator: {
    '@id': `${baseUrl}/#organization`
  },
  publisher: {
    '@id': `${baseUrl}/#organization`
  },
  maintainer: {
    '@id': `${baseUrl}/#organization`
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Preconnect pour les ressources critiques */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://ultron-murex.vercel.app" />

        {/* Métadonnées de vérification pour Search Console - À compléter manuellement */}
        {process.env.NODE_ENV === 'production' && (
          <>
            <meta name="google-site-verification" content="[GOOGLE_SEARCH_CONSOLE_CODE]" />
            <meta name="msvalidate.01" content="[BING_WEBMASTER_CODE]" />
            <meta name="yandex-verification" content="[YANDEX_CODE]" />
            {/* Balise Pinterest (optionnel) */}
            <meta name="p:domain_verify" content="[PINTEREST_CODE]" />
          </>
        )}

        {/* Structured Data enrichi pour le SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />

        {/* Optimisation viewport pour mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

        {/* Preload de la font principale */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${inter.className} font-sans antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster />
          {/* Composants de monitoring SEO (développement uniquement) */}
          <SeoMonitor />
          <SchemaValidator />
        </ThemeProvider>
      </body>
    </html>
  );
}
