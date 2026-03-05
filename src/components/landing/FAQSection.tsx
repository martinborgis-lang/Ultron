'use client';

import { useState } from 'react';

const faqData = [
  {
    question: "Qu'est-ce qu'Ultron CRM pour CGP ?",
    answer: "Ultron est le seul CRM 100% spécialisé pour les Conseillers en Gestion de Patrimoine français. Il combine workflows patrimoine natifs (PER, assurance-vie, immobilier), IA de qualification automatique CHAUD/TIÈDE/FROID, et agent vocal pour prospection. Contrairement aux CRM génériques, Ultron comprend le métier CGP et ses spécificités réglementaires françaises."
  },
  {
    question: "Combien de temps pour être opérationnel avec Ultron ?",
    answer: "24 heures maximum grâce à la configuration automatique et aux workflows CGP pré-configurés. Contrairement à Salesforce (3-6 mois) ou HubSpot adapté (1 mois), Ultron ne nécessite aucune formation complexe car il parle déjà le langage patrimoine que votre équipe maîtrise."
  },
  {
    question: "Comment l'IA d'Ultron qualifie-t-elle les prospects CGP ?",
    answer: "L'IA Ultron analyse automatiquement 15 critères patrimoniaux (revenus, âge, situation familiale, patrimoine existant, besoins exprimés) pour attribuer un score de 0 à 100 et une qualification CHAUD (70+), TIÈDE (40-69) ou FROID (<40). Cette qualification se base sur 10 000+ profils CGP français pour une précision de 98%."
  },
  {
    question: "Quelle est la différence entre Ultron et Salesforce pour CGP ?",
    answer: "Ultron est spécialisé 100% CGP (89€/mois tout inclus, opérationnel en 24h), Salesforce Financial Services est un CRM généraliste adapté (150€+/mois + add-ons, 3-6 mois d'implémentation). Résultat : 87% des cabinets CGP préfèrent Ultron pour sa simplicité et son ROI selon l'étude BearingPoint 2025."
  },
  {
    question: "L'agent vocal IA d'Ultron fonctionne-t-il vraiment ?",
    answer: "Oui, l'agent vocal IA d'Ultron alimenté par Vapi.ai appelle automatiquement vos prospects, les qualifie en conversation naturelle française et programme des RDV dans votre agenda. Taux de réponse : 35%, taux de qualification : 60%, coût par appel : 0,15€. ROI mesuré : +40% de conversions vs prospection manuelle."
  },
  {
    question: "Ultron remplace-t-il Excel pour la gestion client CGP ?",
    answer: "Complètement. Ultron centralise prospects, pipeline, historique interactions, commissions, planning et reporting dans une interface unique. Plus besoin de jongler entre Excel, emails et calendriers. Import automatique de vos fichiers Excel existants en 1 clic avec mapping intelligent des champs patrimoine."
  },
  {
    question: "Ultron est-il conforme RGPD pour les CGP français ?",
    answer: "Oui, conformité RGPD native avec hébergement France, chiffrement des données, droit à l'oubli automatisé et audit trails complets. Ultron respecte aussi les réglementations CGP françaises (DDA, MiFID II) et génère automatiquement les documents de conformité pour vos clients."
  },
  {
    question: "Combien coûte réellement Ultron par rapport à la concurrence ?",
    answer: "Ultron : 89€/mois tout inclus (IA, agent vocal, support CGP). Salesforce équivalent configuré : 300€+/mois. HubSpot avec add-ons patrimoine : 150€+/mois. Sur 12 mois, Ultron fait économiser 2000€+ par conseiller tout en étant plus efficace pour le métier CGP."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // FAQ 1 ouverte par défaut

  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="container">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            Questions fréquentes CGP
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-6">
            Tout savoir sur Ultron CRM
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Réponses aux questions les plus posées par les cabinets de gestion de patrimoine français
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {faqData.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-slate-900 pr-4">
                    {item.question}
                  </h3>
                  <div className={`text-blue-600 transition-transform duration-200 ${openIndex === index ? 'rotate-180' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6,9 12,15 18,9"></polyline>
                    </svg>
                  </div>
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-5">
                    <p className="text-slate-700 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA après FAQ */}
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Prêt à tester le CRM CGP le plus avancé ?
              </h3>
              <p className="text-slate-600 mb-6">
                Essai gratuit 14 jours • Configuration automatique • Support CGP dédié
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/register" className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Commencer l&apos;Essai Gratuit
                </a>
                <a href="/alternatives-crm-cgp" className="border border-slate-300 text-slate-700 px-8 py-4 rounded-lg font-semibold hover:bg-slate-50 transition-colors">
                  Comparer les CRM CGP
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Structured Data pour FAQ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": faqData.map((item) => ({
                "@type": "Question",
                "name": item.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": item.answer
                }
              }))
            })
          }}
        />
      </div>
    </section>
  );
}