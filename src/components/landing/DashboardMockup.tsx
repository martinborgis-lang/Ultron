'use client';

import { useEffect, useState } from 'react';

function CounterAnimation({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * target);

      setCount(currentCount);

      if (progress >= 1) {
        clearInterval(timer);
        setCount(target);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration]);

  return <span>{count}</span>;
}

export function DashboardMockup() {
  const [mounted, setMounted] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Démarrer l'animation après un court délai
    setTimeout(() => setAnimate(true), 500);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full h-full bg-gray-900 overflow-hidden relative">
      {/* Header avec titre */}
      <div className="bg-gray-800 border-b border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Dashboard</h2>
          <button className="text-sm text-gray-400 hover:text-gray-200 flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4v6h6"/><path d="M3 10L8 5l5.5 5.5L20 3"/>
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4">
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Prospects Chauds', value: 8, color: 'bg-red-500', bgColor: 'bg-red-900/20' },
            { label: 'Prospects Tièdes', value: 15, color: 'bg-amber-500', bgColor: 'bg-amber-900/20' },
            { label: 'Prospects Froids', value: 23, color: 'bg-blue-500', bgColor: 'bg-blue-900/20' },
            { label: 'Emails Envoyés', value: 42, color: 'bg-green-500', bgColor: 'bg-green-900/20' }
          ].map((stat, i) => (
            <div key={i} className={`${stat.bgColor} rounded-lg p-3 border border-gray-700`}>
              <div className="flex items-center">
                <div className={`w-3 h-3 ${stat.color} rounded-full mr-3`}></div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-lg font-bold text-white">
                    {animate ? <CounterAnimation target={stat.value} duration={2000 + i * 200} /> : '0'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart and Activity Feed */}
        <div className="grid grid-cols-3 gap-4">
          {/* Chart Area */}
          <div className="col-span-2">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-medium text-white mb-3">Évolution des Prospects (30j)</h3>
              <div className="relative h-32">
                {/* Chart avec animation */}
                <svg className="w-full h-full" viewBox="0 0 300 100">
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1"/>
                    </linearGradient>
                  </defs>

                  {/* Ligne animée */}
                  <path
                    d="M 10 80 Q 50 70 80 65 T 150 50 T 220 40 T 290 30"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="400"
                    strokeDashoffset={animate ? "0" : "400"}
                    style={{
                      transition: 'stroke-dashoffset 3s ease-in-out 0.5s'
                    }}
                  />

                  {/* Zone remplie animée */}
                  <path
                    d="M 10 80 Q 50 70 80 65 T 150 50 T 220 40 T 290 30 L 290 90 L 10 90 Z"
                    fill="url(#chartGradient)"
                    opacity={animate ? 1 : 0}
                    style={{
                      transition: 'opacity 1s ease-in-out 3s'
                    }}
                  />

                  {/* Points animés */}
                  {[
                    { x: 10, y: 80 },
                    { x: 80, y: 65 },
                    { x: 150, y: 50 },
                    { x: 220, y: 40 },
                    { x: 290, y: 30 }
                  ].map((point, i) => (
                    <circle
                      key={i}
                      cx={point.x}
                      cy={point.y}
                      r="0"
                      fill="#3b82f6"
                      style={{
                        animation: animate ? `pointAppear 0.3s ease-out ${3.5 + i * 0.1}s forwards` : 'none'
                      }}
                    />
                  ))}
                </svg>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>01/01</span>
                <span>15/01</span>
                <span>30/01</span>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-medium text-white mb-3">Activité Récente</h3>
              <div className="space-y-3">
                {[
                  { action: 'Nouveau prospect', name: 'Marie Dubois', time: 'Il y a 2 min', color: 'bg-green-500' },
                  { action: 'RDV planifié', name: 'Jean Martin', time: 'Il y a 15 min', color: 'bg-blue-500' },
                  { action: 'Qualifié CHAUD', name: 'Claire Simon', time: 'Il y a 1h', color: 'bg-red-500' },
                  { action: 'Email envoyé', name: 'Paul Durand', time: 'Il y a 2h', color: 'bg-purple-500' },
                  { action: 'Nouveau prospect', name: 'Sophie Leroy', time: 'Il y a 3h', color: 'bg-green-500' }
                ].map((activity, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-2 h-2 ${activity.color} rounded-full mt-1.5 flex-shrink-0`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white">
                        <span className="font-medium">{activity.action}</span>
                      </p>
                      <p className="text-xs text-gray-400 truncate">{activity.name}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Prospects Table */}
        <div className="mt-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-3 border-b border-gray-700">
              <h3 className="text-sm font-medium text-white">Top Prospects</h3>
            </div>
            <div className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider p-3">Nom</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider p-3">Qualification</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider p-3">Score IA</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider p-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {[
                    { nom: 'Marie Dubois', qualification: 'CHAUD', score: 95, statut: 'RDV: 15/01', qualColor: 'bg-red-900/30 text-red-300' },
                    { nom: 'Jean Martin', qualification: 'CHAUD', score: 88, statut: 'RDV Pris', qualColor: 'bg-red-900/30 text-red-300' },
                    { nom: 'Claire Simon', qualification: 'TIEDE', score: 72, statut: 'Contacté', qualColor: 'bg-amber-900/30 text-amber-300' },
                    { nom: 'Paul Durand', qualification: 'TIEDE', score: 68, statut: 'À rappeler', qualColor: 'bg-amber-900/30 text-amber-300' },
                    { nom: 'Sophie Leroy', qualification: 'FROID', score: 45, statut: 'Nouveau', qualColor: 'bg-blue-900/30 text-blue-300' }
                  ].map((prospect, i) => (
                    <tr key={i} className="hover:bg-gray-700/50">
                      <td className="p-3 text-sm text-white">{prospect.nom}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${prospect.qualColor}`}>
                          {prospect.qualification}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-white font-medium">{prospect.score}/100</td>
                      <td className="p-3 text-sm text-gray-400">{prospect.statut}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}