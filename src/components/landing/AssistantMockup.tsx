'use client';

import { useEffect, useState } from 'react';

export function AssistantMockup() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'user',
      content: 'Combien de prospects chauds avons-nous ce mois ?'
    },
    {
      type: 'assistant',
      content: 'Vous avez actuellement **23 prospects chauds** ce mois-ci. Voici le détail par qualification :',
      data: {
        prospects_chauds: 23,
        prospects_tiedes: 45,
        prospects_froids: 12,
        total: 80
      }
    }
  ]);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Simulation d'une nouvelle question après 4 secondes
    const timer = setTimeout(() => {
      setMessages(prev => [...prev, {
        type: 'user',
        content: 'Quel est notre taux de conversion ce mois ?'
      }]);

      setTyping(true);

      // Réponse après 2 secondes
      setTimeout(() => {
        setTyping(false);
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: 'Votre taux de conversion actuel est de **34.5%** ce mois-ci. Voici les détails :',
          data: {
            total_prospects: 80,
            rdv_pris: 28,
            clients_signes: 12,
            taux_conversion: '34.5%',
            evolution: '+12% vs mois dernier'
          }
        }]);
      }, 2000);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full h-full bg-gray-900 overflow-hidden relative">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z"/>
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-white">Assistant IA</h2>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">En ligne</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-4 max-h-80 overflow-y-auto">
        {messages.map((message, i) => (
          <div key={i} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs rounded-lg p-3 ${
              message.type === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 border border-gray-700 text-white'
            }`}>
              <p className="text-sm">{message.content}</p>

              {message.data && (
                <div className="mt-3 bg-gray-700 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(message.data).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-400 capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span className="text-white font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-700 p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Posez votre question en français..."
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400"
            disabled
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19V6M5 12l7-7 7 7"/>
            </svg>
          </button>
        </div>

        {/* Suggestions */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            "Prospects par mois",
            "Taux conversion",
            "Top conseillers"
          ].map((suggestion, i) => (
            <button
              key={i}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded-full border border-gray-600"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}