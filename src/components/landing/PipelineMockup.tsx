'use client';

import { useEffect, useState } from 'react';

export function PipelineMockup() {
  const [mounted, setMounted] = useState(false);
  const [draggedProspect, setDraggedProspect] = useState<string | null>(null);
  const [animationStage, setAnimationStage] = useState(0);

  useEffect(() => {
    setMounted(true);

    // Démonstration d'animation drag and drop toutes les 8 secondes
    const interval = setInterval(() => {
      // Animation: déplacer "Marie Dubois" de "Nouveau" vers "RDV Pris"
      setAnimationStage(1); // Start animation
      setTimeout(() => {
        setAnimationStage(2); // Mid animation
      }, 1000);
      setTimeout(() => {
        setAnimationStage(3); // Complete animation
      }, 2000);
      setTimeout(() => {
        setAnimationStage(0); // Reset
      }, 4000);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const columns = [
    {
      title: 'Nouveau',
      slug: 'nouveau',
      color: 'border-gray-300',
      bgColor: 'bg-gray-50 dark:bg-gray-800',
      prospects: animationStage < 2 ? [
        { id: 'marie-1', name: 'Marie Dubois', qualification: 'CHAUD', score: 95, company: 'Tech Corp' },
        { id: 'pierre-1', name: 'Pierre Moreau', qualification: 'TIEDE', score: 72, company: 'Startup Inc' }
      ] : [
        { id: 'pierre-1', name: 'Pierre Moreau', qualification: 'TIEDE', score: 72, company: 'Startup Inc' }
      ]
    },
    {
      title: 'Contacté',
      slug: 'contacte',
      color: 'border-blue-300',
      bgColor: 'bg-blue-50 dark:bg-blue-800',
      prospects: [
        { id: 'sophie-2', name: 'Sophie Martin', qualification: 'TIEDE', score: 68, company: 'Finance SA' },
        { id: 'lucas-2', name: 'Lucas Bernard', qualification: 'FROID', score: 45, company: 'Industry Ltd' }
      ]
    },
    {
      title: 'RDV Pris',
      slug: 'rdv_pris',
      color: 'border-green-300',
      bgColor: 'bg-green-50 dark:bg-green-800',
      prospects: animationStage >= 2 ? [
        { id: 'marie-1', name: 'Marie Dubois', qualification: 'CHAUD', score: 95, company: 'Tech Corp' },
        { id: 'jean-3', name: 'Jean Dupont', qualification: 'CHAUD', score: 88, company: 'Enterprise Co' }
      ] : [
        { id: 'jean-3', name: 'Jean Dupont', qualification: 'CHAUD', score: 88, company: 'Enterprise Co' }
      ]
    },
    {
      title: 'RDV Effectué',
      slug: 'rdv_effectue',
      color: 'border-purple-300',
      bgColor: 'bg-purple-50 dark:bg-purple-800',
      prospects: [
        { id: 'claire-4', name: 'Claire Simon', qualification: 'CHAUD', score: 91, company: 'Growth Inc' }
      ]
    },
    {
      title: 'Gagné',
      slug: 'gagne',
      color: 'border-emerald-300',
      bgColor: 'bg-emerald-50 dark:bg-emerald-800',
      prospects: [
        { id: 'paul-5', name: 'Paul Durand', qualification: 'CHAUD', score: 94, company: 'Success Ltd' }
      ]
    }
  ];

  const getQualificationColor = (qualification: string) => {
    switch (qualification) {
      case 'CHAUD': return 'bg-red-900/20 text-red-300 border-red-700';
      case 'TIEDE': return 'bg-amber-900/20 text-amber-300 border-amber-700';
      case 'FROID': return 'bg-blue-900/20 text-blue-300 border-blue-700';
      default: return 'bg-gray-700/20 text-gray-300 border-gray-600';
    }
  };

  return (
    <div className="w-full h-full bg-gray-900 overflow-hidden relative">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Pipeline CRM</h2>
          <div className="flex items-center gap-2">
            <button className="text-sm text-gray-400 hover:text-gray-200">
              Filtres
            </button>
            <button className="text-sm text-blue-400 hover:text-blue-300">
              + Nouveau prospect
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline Columns */}
      <div className="flex gap-3 p-4 overflow-x-auto min-h-[400px]">
        {columns.map((column, columnIndex) => (
          <div key={column.slug} className={`flex-shrink-0 w-60 bg-gray-800 rounded-lg border-2 border-gray-600 p-3`}>
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-white text-sm">{column.title}</h3>
              <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                {column.prospects.length}
              </span>
            </div>

            {/* Prospects */}
            <div className="space-y-2">
              {column.prospects.map((prospect, prospectIndex) => {
                const isAnimating = animationStage === 1 && prospect.id === 'marie-1';
                const animationClass = isAnimating ?
                  'transform translate-x-72 scale-105 z-50 shadow-2xl' :
                  '';

                return (
                  <div
                    key={prospect.id}
                    className={`bg-gray-700 rounded-lg border border-gray-600 p-2 cursor-grab hover:shadow-md transition-all duration-1000 relative ${animationClass}`}
                    style={isAnimating ? {
                      transform: 'translateX(288px) scale(1.05)',
                      zIndex: 50,
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    } : {}}
                  >
                    {/* Prospect Header */}
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h4 className="font-medium text-white text-sm">{prospect.name}</h4>
                        <p className="text-xs text-gray-400">{prospect.company}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getQualificationColor(prospect.qualification)}`}>
                          {prospect.qualification}
                        </span>
                      </div>
                    </div>

                    {/* Score IA */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500 mr-1">
                          <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z"/>
                        </svg>
                        <span className="text-xs text-gray-400">Score IA:</span>
                      </div>
                      <span className="text-xs font-medium text-white">{prospect.score}/100</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 mt-1">
                      <button className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded hover:bg-gray-600">
                        Modifier
                      </button>
                      <button className="text-xs bg-blue-900/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-900/40">
                        Email
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add prospect button */}
              <button className="w-full border-2 border-dashed border-gray-600 rounded-lg p-4 text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-1">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span className="text-xs">Ajouter prospect</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Animation Indicator */}
      {animationStage > 0 && (
        <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
          Démonstration Drag & Drop
        </div>
      )}
    </div>
  );
}