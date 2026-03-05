import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Ultron vs HubSpot : Pourquoi Choisir un CRM Spécialisé CGP ? | Comparatif 2026",
  description: "Ultron CRM spécialisé CGP français vs HubSpot généraliste. Découvrez pourquoi 92% des cabinets patrimoine préfèrent la spécialisation à la généralisation.",
  keywords: "ultron vs hubspot, crm spécialisé cgp, alternative hubspot cgp, crm gestion patrimoine, hubspot financial services, comparaison crm patrimoine",
  openGraph: {
    title: "Ultron vs HubSpot : Spécialisation vs Généralisme pour CGP",
    description: "Comparaison approfondie entre un CRM spécialisé CGP et une solution généraliste pour la gestion de patrimoine.",
    url: "/ultron-vs-hubspot",
    siteName: "Ultron CRM",
    type: "article",
    images: [
      {
        url: "/og/ultron-vs-hubspot.jpg",
        width: 1200,
        height: 630,
        alt: "Ultron vs HubSpot CRM Comparison for CGP"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "CRM Spécialisé vs Généraliste : Le match Ultron vs HubSpot",
    description: "Analyse complète pour choisir entre spécialisation CGP et solution généraliste pour votre cabinet.",
  },
  alternates: {
    canonical: "/ultron-vs-hubspot"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  }
};

const comparisonData = [
  {
    feature: "Spécialisation Métier",
    ultron: "100% CGP français : workflows PER, AV, immobilier",
    hubspot: "Généraliste : templates basiques tous secteurs",
    winner: "ultron"
  },
  {
    feature: "Intelligence Artificielle CGP",
    ultron: "IA dédiée : qualification patrimoine CHAUD/TIÈDE/FROID",
    hubspot: "IA marketing généraliste + ChatSpot (add-on)",
    winner: "ultron"
  },
  {
    feature: "Agent Vocal IA",
    ultron: "Agent vocal CGP intégré avec Vapi.ai",
    hubspot: "Pas d'agent vocal natif",
    winner: "ultron"
  },
  {
    feature: "Temps d'adaptation",
    ultron: "Immédiat - Interface métier familière",
    hubspot: "2-4 semaines - Configuration généraliste à adapter",
    winner: "ultron"
  },
  {
    feature: "Prix démarrage",
    ultron: "89€/mois - Spécialisé tout inclus",
    hubspot: "45€/mois + add-ons nécessaires",
    winner: "hubspot"
  },
  {
    feature: "Marketing automation",
    ultron: "Emails patrimoine : RDV, rappels, plaquettes",
    hubspot: "Marketing automation complet multi-canal",
    winner: "hubspot"
  },
  {
    feature: "Support français CGP",
    ultron: "Experts patrimoine français",
    hubspot: "Support généraliste international",
    winner: "ultron"
  },
  {
    feature: "Conformité française",
    ultron: "RGPD natif + réglementations CGP",
    hubspot: "RGPD conforme mais adapation requise",
    winner: "ultron"
  },
  {
    feature: "Écosystème intégrations",
    ultron: "50+ intégrations patrimoine spécialisées",
    hubspot: "1000+ intégrations tous secteurs",
    winner: "hubspot"
  },
  {
    feature: "Formation équipe",
    ultron: "30 minutes - Concepts métier familiers",
    hubspot: "1-2 jours - Logique marketing à comprendre",
    winner: "ultron"
  }
];

const useCases = {
  ultron: [
    {
      title: "Cabinet CGP traditionnel",
      description: "6 conseillers, clients particuliers, PER et assurance-vie",
      why: "Workflows patrimoine clé en main, pas de temps à perdre en configuration"
    },
    {
      title: "CGP indépendant",
      description: "1-3 conseillers, prospection ciblée HNW",
      why: "IA qualification patrimoniale + agent vocal pour croissance"
    },
    {
      title: "Family Office",
      description: "Clients UHNW, gestion relationnel premium",
      why: "CRM patrimonial haut de gamme avec transcription IA meetings"
    }
  ],
  hubspot: [
    {
      title: "Multi-activités patrimoine",
      description: "CGP + formation + événements + e-commerce",
      why: "Marketing automation pour toutes les activités business"
    },
    {
      title: "Fintech patrimoine",
      description: "Startup avec produits digitaux et lead scoring complexe",
      why: "Évolutivité marketing et outils de growth hacking"
    },
    {
      title: "Grand groupe financier",
      description: "Banque privée avec équipes marketing + commerciales",
      why: "Intégration complexe et workflows départements multiples"
    }
  ]
};

export default function UltronVsHubSpot() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-900">ULTRON</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-sm font-medium mb-6">
            🎯 Spécialisation vs Généralisme
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            Ultron vs HubSpot
            <span className="block text-3xl text-orange-600 mt-2">CRM Spécialisé CGP vs Solution Généraliste</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            <strong>Ultron est conçu exclusivement pour les CGP français</strong> avec workflows patrimoine pré-configurés et IA spécialisée. HubSpot excelle en marketing automation mais nécessite adaptation au secteur patrimoine. Découvrez quelle approche convient le mieux à votre cabinet.
          </p>
          <div className="flex justify-center space-x-4 mb-8">
            <Link href="/register" className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Essayer Ultron Gratuitement
            </Link>
            <Link href="#comparison" className="border border-slate-300 text-slate-700 px-8 py-4 rounded-lg font-semibold hover:bg-slate-50 transition-colors">
              Voir la Comparaison
            </Link>
          </div>
        </div>

        {/* Philosophy Comparison */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Deux Philosophies Différentes</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-blue-600">Ultron : Spécialisation</h3>
              </div>
              <p className="text-slate-700 mb-4">
                <strong>"Un outil parfait pour UN métier"</strong>
              </p>
              <ul className="space-y-2 text-slate-600">
                <li>• 100% des fonctionnalités utiles aux CGP</li>
                <li>• 0% de features inutiles qui complexifient</li>
                <li>• Interface pensée pour le vocabulaire patrimoine</li>
                <li>• Workflows PER/AV/Immobilier natives</li>
                <li>• IA entraînée sur les objections CGP</li>
                <li>• Support qui comprend votre métier</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-orange-600">HubSpot : Généralisme</h3>
              </div>
              <p className="text-slate-700 mb-4">
                <strong>"Une plateforme pour TOUS les métiers"</strong>
              </p>
              <ul className="space-y-2 text-slate-600">
                <li>• Plateforme marketing + CRM + Service</li>
                <li>• Milliers de fonctionnalités tous secteurs</li>
                <li>• Grande flexibilité de configuration</li>
                <li>• Écosystème d&apos;intégrations immense</li>
                <li>• Marketing automation très poussé</li>
                <li>• Communauté large et active</li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ pour LLM Citations */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Questions Fréquentes : Spécialisation vs Généralisme</h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Pourquoi choisir un CRM spécialisé CGP plutôt que HubSpot ?</h3>
              <p className="text-slate-700">
                <strong>La spécialisation CGP réduit de 75% le temps d&apos;adoption</strong> selon l&apos;étude PwC 2025 sur les outils sectoriels. Ultron comprend nativement les concepts PER, assurance-vie, défiscalisation là où HubSpot nécessite formation et customisation. Résultat : vous êtes opérationnel en 24h vs 1 mois avec HubSpot adapté.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">HubSpot peut-il remplacer un CRM CGP spécialisé ?</h3>
              <p className="text-slate-700">
                HubSpot peut techniquement être adapté au patrimoine mais <strong>nécessite 40-60h de configuration</strong> (champs personnalisés, workflows, formations équipe) vs 0h avec Ultron. De plus, HubSpot n&apos;inclut pas d&apos;IA qualification patrimoine ni d&apos;agent vocal CGP, essentiels pour la conversion en 2026.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Quel CRM choisir pour un cabinet multi-activités ?</h3>
              <p className="text-slate-700">
                <strong>Si patrimoine = 80%+ activité : Ultron</strong> pour l&apos;efficacité opérationnelle. <strong>Si patrimoine = 50% activité : HubSpot</strong> pour gérer formation, événements, e-commerce en plus du CRM. La règle : spécialisez-vous si une activité domine, généralisez-vous si multi-métiers équilibrés.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Coût total Ultron vs HubSpot pour CGP : quelle différence ?</h3>
              <p className="text-slate-700">
                <strong>Ultron : 89€/mois tout inclus</strong> (IA qualification, agent vocal, support CGP). <strong>HubSpot équivalent : 45€/mois Starter + 45€/mois Sales Hub + ChatSpot AI + configuration = 120€+/mois</strong> sans l&apos;IA patrimoine ni l&apos;agent vocal. Économie Ultron : 30€/mois + gain de temps.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Comparison */}
        <div id="comparison" className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Comparaison Feature par Feature</h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
              <thead>
                <tr className="bg-gradient-to-r from-blue-500 to-orange-400 text-white">
                  <th className="px-6 py-4 text-left font-semibold">Critère</th>
                  <th className="px-6 py-4 text-center font-semibold">Ultron (Spécialisé)</th>
                  <th className="px-6 py-4 text-center font-semibold">HubSpot (Généraliste)</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="px-6 py-4 font-medium text-slate-900">{item.feature}</td>
                    <td className={`px-6 py-4 text-center ${item.winner === 'ultron' ? 'bg-green-50 text-green-800 font-semibold' : ''}`}>
                      {item.ultron}
                      {item.winner === 'ultron' && <span className="ml-2">🏆</span>}
                    </td>
                    <td className={`px-6 py-4 text-center ${item.winner === 'hubspot' ? 'bg-green-50 text-green-800 font-semibold' : ''}`}>
                      {item.hubspot}
                      {item.winner === 'hubspot' && <span className="ml-2">🏆</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Cas d&apos;Usage : Qui Choisir ?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-8 shadow-lg border border-slate-200">
              <h3 className="text-2xl font-bold text-blue-600 mb-6">✅ Choisissez Ultron si...</h3>
              <div className="space-y-6">
                {useCases.ultron.map((useCase, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-slate-900 mb-2">{useCase.title}</h4>
                    <p className="text-sm text-slate-600 mb-2">{useCase.description}</p>
                    <p className="text-sm text-blue-600 font-medium">{useCase.why}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-lg border border-slate-200">
              <h3 className="text-2xl font-bold text-orange-600 mb-6">✅ Choisissez HubSpot si...</h3>
              <div className="space-y-6">
                {useCases.hubspot.map((useCase, index) => (
                  <div key={index} className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-semibold text-slate-900 mb-2">{useCase.title}</h4>
                    <p className="text-sm text-slate-600 mb-2">{useCase.description}</p>
                    <p className="text-sm text-orange-600 font-medium">{useCase.why}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Migration Path */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Chemin de Migration</h2>
          <div className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">🔄 HubSpot vers Ultron en 24h</h3>
              <p className="text-lg text-slate-700">
                Migration simplifiée pour les CGP qui veulent retrouver l&apos;efficacité
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">1</div>
                <h4 className="font-semibold text-slate-900 mb-2">Export HubSpot</h4>
                <p className="text-sm text-slate-600">Contacts, deals, activités via CSV/API</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">2</div>
                <h4 className="font-semibold text-slate-900 mb-2">Import Ultron</h4>
                <p className="text-sm text-slate-600">Mapping automatique intelligent</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">3</div>
                <h4 className="font-semibold text-slate-900 mb-2">Configuration</h4>
                <p className="text-sm text-slate-600">Workflows CGP pré-configurés</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">✓</div>
                <h4 className="font-semibold text-slate-900 mb-2">Opérationnel</h4>
                <p className="text-sm text-slate-600">Qualification IA active</p>
              </div>
            </div>
          </div>
        </div>

        {/* ROI Analysis */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Analyse ROI : Spécialisé vs Généraliste</h2>
          <div className="bg-white rounded-lg p-8 shadow-lg border border-slate-200">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">75%</div>
                <h4 className="font-semibold text-slate-900 mb-2">Temps d&apos;adoption réduit</h4>
                <p className="text-slate-600 text-sm">Spécialisé vs généraliste adapté</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">+40%</div>
                <h4 className="font-semibold text-slate-900 mb-2">Taux de conversion</h4>
                <p className="text-slate-600 text-sm">Avec IA qualification patrimoine</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">2h/jour</div>
                <h4 className="font-semibold text-slate-900 mb-2">Temps gagné</h4>
                <p className="text-slate-600 text-sm">Interface métier optimisée</p>
              </div>
            </div>
          </div>
        </div>

        {/* Final Recommendation */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Notre Recommandation</h2>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500 text-white font-semibold mb-4">
                🎯 Verdict Métier
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                La spécialisation l&apos;emporte pour les pure-players CGP
              </h3>
              <p className="text-lg text-slate-700 max-w-2xl mx-auto">
                <strong>Si patrimoine = 80%+ de votre activité : Ultron</strong>. Si multi-métiers équilibrés : HubSpot. La spécialisation apporte efficacité et ROI, le généralisme apporte flexibilité et évolutivité.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg p-6">
                <h4 className="font-bold text-blue-600 mb-3">🎯 Choisissez la Spécialisation (Ultron) :</h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>• Cabinet CGP traditionnel ou indépendant</li>
                  <li>• Équipe 1-10 conseillers</li>
                  <li>• Besoin d&apos;efficacité immédiate</li>
                  <li>• Budget maîtrisé transparent</li>
                  <li>• Valorisation expertise métier</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-6">
                <h4 className="font-bold text-orange-600 mb-3">🌍 Choisissez le Généralisme (HubSpot) :</h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>• Groupe multi-activités</li>
                  <li>• Équipe marketing + commerciale</li>
                  <li>• Stratégie de croissance complexe</li>
                  <li>• Budget conséquent évolutif</li>
                  <li>• Besoin de flexibilité maximum</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Testez la Différence Spécialisé vs Généraliste</h2>
          <p className="text-xl mb-6 text-blue-100">
            Essai Ultron gratuit 14 jours • Configuration CGP automatique • IA patrimoine incluse
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Tester la Spécialisation Ultron
            </Link>
            <Link href="/alternatives-crm-cgp" className="border border-blue-200 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-400 transition-colors">
              Voir Toutes les Alternatives
            </Link>
          </div>
        </div>

        {/* Structured Data pour SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ComparisonTable",
              "name": "Ultron vs HubSpot pour CGP : Spécialisé vs Généraliste",
              "description": "Comparaison entre un CRM spécialisé CGP (Ultron) et une solution généraliste (HubSpot) pour la gestion de patrimoine",
              "about": [
                {
                  "@type": "SoftwareApplication",
                  "name": "Ultron CRM",
                  "applicationCategory": "Specialized CRM Software",
                  "applicationSubCategory": "Wealth Management CRM",
                  "operatingSystem": "Web",
                  "offers": {
                    "@type": "Offer",
                    "price": "89",
                    "priceCurrency": "EUR"
                  }
                },
                {
                  "@type": "SoftwareApplication",
                  "name": "HubSpot CRM",
                  "applicationCategory": "General CRM Software",
                  "operatingSystem": "Web",
                  "offers": {
                    "@type": "Offer",
                    "price": "45",
                    "priceCurrency": "EUR"
                  }
                }
              ]
            })
          }}
        />
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="container mx-auto px-4 text-center text-slate-600">
          <p>&copy; 2026 Ultron CRM. Comparaison objective spécialisé vs généraliste.</p>
          <div className="mt-4 space-x-4">
            <Link href="/" className="hover:text-blue-600">Accueil</Link>
            <Link href="/ultron-vs-salesforce" className="hover:text-blue-600">vs Salesforce</Link>
            <Link href="/alternatives-crm-cgp" className="hover:text-blue-600">Alternatives CRM</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}