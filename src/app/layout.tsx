import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

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

// JSON-LD Structured Data for SaaS Product
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ultron',
  description: 'CRM IA pour cabinets de gestion de patrimoine. Automatisez la prospection, la qualification et le suivi client.',
  url: baseUrl,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Essai gratuit disponible',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '24',
    bestRating: '5',
  },
  featureList: [
    'Pipeline CRM intelligent avec drag & drop',
    'Qualification IA automatique des prospects',
    'Agent vocal IA pour appels automatiques',
    'Transcription et analyse de meetings',
    'Extension Chrome pour analyse temps réel',
    'Générateur de posts LinkedIn IA',
    'Moteur de recherche prospects',
    'Click-to-Call WebRTC intégré',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
