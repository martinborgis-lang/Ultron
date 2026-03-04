'use client';

import { useState, useEffect } from 'react';
import BrowserFrame from './BrowserFrame';

const categories = [
  { icon: '\ud83c\udfea', name: 'Commer\u00e7ants', sub: 'Artisans', count: '2.4M', color: '#f59e0b', api: 'Google Maps' },
  { icon: '\u2696\ufe0f', name: 'Professions', sub: 'Lib\u00e9rales', count: '890K', color: '#3b82f6', api: 'Google Maps' },
  { icon: '\ud83d\udcbc', name: 'Dirigeants', sub: 'Entreprises', count: '1.8M', color: '#22c55e', api: 'Pappers API' },
];

const results = [
  { name: 'Cabinet M\u00e9dical Rivoli', contact: 'Dr. Leclerc', phone: '01 42 33 XX XX', city: 'Paris 1er', score: 92, imported: false },
  { name: 'SCP Notaires Beaumont', contact: 'Me. Durand', phone: '01 45 67 XX XX', city: 'Paris 8\u00e8me', score: 88, imported: true },
  { name: 'Architectes Associ\u00e9s', contact: 'P. Moreau', phone: '01 43 28 XX XX', city: 'Paris 16\u00e8me', score: 85, imported: false },
  { name: 'Pharmacie Saint-Honor\u00e9', contact: 'S. Bernard', phone: '01 42 61 XX XX', city: 'Paris 1er', score: 79, imported: false },
];

export default function LeadFinderMockup() {
  const [step, setStep] = useState<'categories' | 'results'>('categories');
  const [animate, setAnimate] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(1);

  useEffect(() => {
    const t1 = setTimeout(() => setAnimate(true), 200);
    const t2 = setTimeout(() => {
      setSelectedCategory(1);
      setStep('results');
    }, 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <BrowserFrame title="Lead Finder" url="ultron-app.com/leads-finder">
      <div className="p-4 min-h-[400px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-white">Recherche de Prospects</p>
            <p className="text-[10px] text-white/40">Trouvez vos futurs clients qualifi\u00e9s</p>
          </div>
          <span className="px-2 py-1 rounded-md text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            247 cr\u00e9dits restants
          </span>
        </div>

        {step === 'categories' && (
          <div className="grid grid-cols-3 gap-3">
            {categories.map((cat, i) => (
              <div
                key={i}
                className={`relative bg-white/5 rounded-lg p-4 border text-center cursor-pointer transition-all duration-300 ${
                  selectedCategory === i
                    ? 'border-indigo-500/50 bg-indigo-500/5 scale-[1.02]'
                    : 'border-white/5 hover:border-white/15'
                }`}
                style={{
                  opacity: animate ? 1 : 0,
                  transform: animate ? 'translateY(0)' : 'translateY(15px)',
                  transition: `all 0.5s ease ${i * 0.12}s`,
                }}
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <p className="text-xs font-semibold text-white">{cat.name}</p>
                <p className="text-[10px] text-white/40">{cat.sub}</p>
                <p className="text-[10px] mt-2" style={{ color: cat.color }}>
                  {cat.count} r\u00e9sultats
                </p>
                <span className="absolute top-2 right-2 text-[8px] text-white/20 bg-white/5 px-1.5 py-0.5 rounded">
                  {cat.api}
                </span>
              </div>
            ))}
          </div>
        )}

        {step === 'results' && (
          <div
            className="space-y-2"
            style={{ animation: 'fadeIn 0.4s ease-out' }}
          >
            {/* Search bar */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1 bg-white/5 rounded-md px-3 py-1.5 text-xs text-white/50 border border-white/10">
                M\u00e9decins, Paris
              </div>
              <button className="px-3 py-1.5 bg-indigo-500 text-white text-xs rounded-md">
                Rechercher
              </button>
            </div>

            {/* Results table */}
            <div className="bg-white/[0.03] rounded-lg border border-white/5 overflow-hidden">
              <div className="grid grid-cols-12 gap-1 px-3 py-1.5 border-b border-white/5 text-[9px] text-white/30 uppercase tracking-wider">
                <span className="col-span-1"></span>
                <span className="col-span-3">Entreprise</span>
                <span className="col-span-2">Contact</span>
                <span className="col-span-2">T\u00e9l\u00e9phone</span>
                <span className="col-span-2">Ville</span>
                <span className="col-span-1">Score</span>
                <span className="col-span-1"></span>
              </div>
              {results.map((r, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-1 px-3 py-2 border-b border-white/[0.03] hover:bg-white/[0.03] items-center"
                  style={{
                    opacity: animate ? 1 : 0,
                    transform: animate ? 'translateX(0)' : 'translateX(-10px)',
                    transition: `all 0.3s ease ${i * 0.08}s`,
                  }}
                >
                  <span className="col-span-1">
                    <div className={`w-3.5 h-3.5 rounded border ${r.imported ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'}`} />
                  </span>
                  <span className="col-span-3 text-xs text-white/80 truncate">{r.name}</span>
                  <span className="col-span-2 text-[11px] text-white/50">{r.contact}</span>
                  <span className="col-span-2 text-[11px] text-white/40 font-mono">{r.phone}</span>
                  <span className="col-span-2 text-[11px] text-white/40">{r.city}</span>
                  <span className="col-span-1">
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{
                        color: r.score >= 85 ? '#22c55e' : '#f59e0b',
                        backgroundColor: r.score >= 85 ? '#22c55e15' : '#f59e0b15',
                      }}
                    >
                      {r.score}%
                    </span>
                  </span>
                  <span className="col-span-1 text-right">
                    {r.imported ? (
                      <span className="text-[9px] text-green-400">Import\u00e9</span>
                    ) : (
                      <span className="text-[9px] text-indigo-400 cursor-pointer">Importer</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] text-white/30">4 r\u00e9sultats trouv\u00e9s \u2022 2 cr\u00e9dits utilis\u00e9s</span>
              <button className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-[10px] rounded border border-indigo-500/30">
                Importer la s\u00e9lection (3)
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </BrowserFrame>
  );
}
