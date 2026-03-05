'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQOptimizedProps {
  title?: string;
  subtitle?: string;
  items: FAQItem[];
  defaultOpen?: number;
  className?: string;
  structuredData?: boolean;
}

export default function FAQOptimized({
  title = "Questions Fréquentes",
  subtitle,
  items,
  defaultOpen = 0,
  className = '',
  structuredData = true
}: FAQOptimizedProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen);

  return (
    <div className={`mb-16 ${className}`}>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">{title}</h2>
        {subtitle && (
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">{subtitle}</p>
        )}
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="space-y-4">
          {items.map((item, index) => (
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
                <div className={`text-blue-600 transition-transform duration-200 ${
                  openIndex === index ? 'rotate-180' : ''
                }`}>
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
      </div>

      {/* Structured Data pour SEO */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": items.map((item) => ({
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
      )}
    </div>
  );
}