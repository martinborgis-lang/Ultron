'use client';

import { useState, useEffect } from 'react';
import BrowserFrame from './BrowserFrame';

const kpis = [
  { label: 'Chiffre d\'Affaires', value: 284500, prefix: '', suffix: ' \u20ac', color: '#22c55e', delta: '+12.4%' },
  { label: 'Taux Conversion', value: 34.2, prefix: '', suffix: '%', color: '#6366f1', delta: '+5.1%' },
  { label: 'Conseillers Actifs', value: 12, prefix: '', suffix: '', color: '#f59e0b', delta: '+2' },
  { label: 'RDV ce mois', value: 87, prefix: '', suffix: '', color: '#3b82f6', delta: '+23%' },
];

const advisors = [
  { name: 'Sophie Martin', ca: '48 200 \u20ac', conv: '42%', rdv: 18, rank: 1 },
  { name: 'Thomas Dupont', ca: '41 800 \u20ac', conv: '38%', rdv: 15, rank: 2 },
  { name: 'Marie Lambert', ca: '36 500 \u20ac', conv: '35%', rdv: 14, rank: 3 },
  { name: 'Pierre Moreau', ca: '32 100 \u20ac', conv: '31%', rdv: 12, rank: 4 },
];

const funnelStages = [
  { name: 'Nouveau', count: 245, width: '100%', color: '#6366f1' },
  { name: 'RDV Pris', count: 142, width: '58%', color: '#8b5cf6' },
  { name: 'RDV Effectu\u00e9', count: 98, width: '40%', color: '#a855f7' },
  { name: 'En N\u00e9gociation', count: 64, width: '26%', color: '#c084fc' },
  { name: 'Gagn\u00e9', count: 43, width: '18%', color: '#22c55e' },
];

export default function AdminDashboardMockup() {
  const [animateNumbers, setAnimateNumbers] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateNumbers(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <BrowserFrame title="Admin Dashboard" url="ultron-app.com/admin">
      <div className="p-4 space-y-4 min-h-[420px]">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-3">
          {kpis.map((kpi, i) => (
            <div
              key={i}
              className="bg-white/5 rounded-lg p-3 border border-white/5"
              style={{
                opacity: animateNumbers ? 1 : 0,
                transform: animateNumbers ? 'translateY(0)' : 'translateY(10px)',
                transition: `all 0.5s ease ${i * 0.1}s`,
              }}
            >
              <p className="text-[10px] text-white/40 uppercase tracking-wider">{kpi.label}</p>
              <p className="text-xl font-bold text-white mt-1">
                {kpi.prefix}
                {animateNumbers ? (kpi.value % 1 === 0 ? kpi.value.toLocaleString('fr-FR') : kpi.value.toFixed(1)) : '0'}
                {kpi.suffix}
              </p>
              <span className="text-[10px] font-medium" style={{ color: kpi.color }}>
                {kpi.delta}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-3">
          {/* Advisor Performance Table */}
          <div className="col-span-3 bg-white/5 rounded-lg p-3 border border-white/5">
            <p className="text-xs font-semibold text-white/70 mb-2">Top Conseillers</p>
            <div className="space-y-1.5">
              {advisors.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-white/[0.02] rounded px-2 py-1.5"
                  style={{
                    opacity: animateNumbers ? 1 : 0,
                    transform: animateNumbers ? 'translateX(0)' : 'translateX(-15px)',
                    transition: `all 0.4s ease ${0.3 + i * 0.1}s`,
                  }}
                >
                  <span className="text-[10px] font-bold text-indigo-400 w-4">#{a.rank}</span>
                  <span className="text-xs text-white/80 flex-1">{a.name}</span>
                  <span className="text-xs font-semibold text-green-400 w-16 text-right">{a.ca}</span>
                  <span className="text-[10px] text-white/40 w-10 text-right">{a.conv}</span>
                  <span className="text-[10px] text-white/30 w-8 text-right">{a.rdv} RDV</span>
                </div>
              ))}
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="col-span-2 bg-white/5 rounded-lg p-3 border border-white/5">
            <p className="text-xs font-semibold text-white/70 mb-2">Entonnoir Conversion</p>
            <div className="space-y-1.5">
              {funnelStages.map((stage, i) => (
                <div key={i} className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/50">{stage.name}</span>
                    <span className="text-white/70 font-medium">{stage.count}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: animateNumbers ? stage.width : '0%',
                        backgroundColor: stage.color,
                        transitionDelay: `${0.4 + i * 0.15}s`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}
