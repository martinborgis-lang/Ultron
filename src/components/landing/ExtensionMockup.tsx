'use client';

import { useEffect, useState } from 'react';

export function ExtensionMockup() {
  const [mounted, setMounted] = useState(false);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Simulation de démarrage d'enregistrement après 2 secondes
    const timer = setTimeout(() => {
      setRecording(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full h-full bg-gray-900 overflow-hidden relative">
      {/* Extension Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">U</span>
            </div>
            <h2 className="text-sm font-semibold text-white">Ultron Assistant</h2>
          </div>
          <div className={`w-2 h-2 rounded-full ${recording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
        </div>
      </div>

      {/* Meeting Info */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
            <path d="m22 2-10 10-4-4"/>
          </svg>
          <div>
            <p className="text-sm font-medium text-white">RDV avec Claire Martin</p>
            <p className="text-xs text-gray-400">Google Meet en cours...</p>
          </div>
        </div>

        {recording && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-red-300">Enregistrement en cours</span>
            </div>
            <p className="text-xs text-gray-400">Transcription automatique activée</p>
          </div>
        )}
      </div>

      {/* Transcription en temps réel */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-medium text-white mb-3">Transcription en temps réel</h3>
        <div className="bg-gray-800 rounded-lg p-3 text-xs space-y-2 max-h-32 overflow-y-auto">
          <div className="flex gap-2">
            <span className="text-blue-400 font-medium">Claire:</span>
            <span className="text-gray-300">Bonjour, je m'intéresse à l'optimisation de mon patrimoine...</span>
          </div>
          <div className="flex gap-2">
            <span className="text-green-400 font-medium">Conseiller:</span>
            <span className="text-gray-300">Parfait ! Pouvez-vous me parler de votre situation actuelle ?</span>
          </div>
          {recording && (
            <div className="flex gap-2">
              <span className="text-blue-400 font-medium">Claire:</span>
              <span className="text-gray-300">J'ai environ 150k€ d'épargne et je cherche à optimiser...</span>
              <span className="text-blue-500 animate-pulse">|</span>
            </div>
          )}
        </div>
      </div>

      {/* Suggestions IA */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-medium text-white mb-3">Suggestions IA</h3>
        <div className="space-y-2">
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400">
                <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z"/>
              </svg>
              <span className="text-xs font-medium text-blue-300">Question suggérée</span>
            </div>
            <p className="text-xs text-gray-300">"Avez-vous des projets d'investissement à moyen terme ?"</p>
          </div>

          <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
              <span className="text-xs font-medium text-amber-300">Objection détectée</span>
            </div>
            <p className="text-xs text-gray-300">"Je ne suis pas sûr des frais..." → Expliquer la transparence tarifaire</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2">
          <button className="text-xs bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 px-3 py-2 rounded border border-blue-700">
            Qualifier prospect
          </button>
          <button className="text-xs bg-green-900/20 hover:bg-green-900/40 text-green-400 px-3 py-2 rounded border border-green-700">
            Générer PDF
          </button>
        </div>
      </div>
    </div>
  );
}