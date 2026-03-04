'use client';

import { useState, useEffect } from 'react';
import BrowserFrame from './BrowserFrame';

const themes = [
  { icon: '📈', name: 'Marchés', active: false },
  { icon: '💰', name: 'Épargne', active: true },
  { icon: '🏠', name: 'Immobilier', active: false },
  { icon: '📊', name: 'Fiscalité', active: false },
];

const samplePost = `🔑 L'épargne des Français atteint un record en 2025.

Mais combien de ces épargnants savent réellement où va leur argent ?

En tant que CGP, je constate chaque jour que la majorité des épargnants :

→ Laissent dormir leur capital sur des livrets à 2%
→ Ignorent les solutions de diversification adaptées
→ N'ont aucune stratégie patrimoniale long terme

📌 La vraie question n'est pas "combien épargner"
mais "comment faire travailler son épargne intelligemment".

Un accompagnement personnalisé peut transformer une épargne dormante en un patrimoine performant.

💬 Et vous, quelle est votre stratégie d'épargne ?

#GestionDePatrimoine #CGP #Épargne #Investissement`;

export default function LinkedInAgentMockup() {
  const [animate, setAnimate] = useState(false);
  const [typing, setTyping] = useState(false);
  const [displayedLines, setDisplayedLines] = useState(0);

  const postLines = samplePost.split('\n');
  const totalLines = postLines.length;

  useEffect(() => {
    const t1 = setTimeout(() => setAnimate(true), 200);
    const t2 = setTimeout(() => setTyping(true), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (!typing) return;
    if (displayedLines >= totalLines) return;
    const t = setTimeout(() => setDisplayedLines((d) => d + 1), 120);
    return () => clearTimeout(t);
  }, [typing, displayedLines, totalLines]);

  const visibleText = postLines.slice(0, displayedLines).join('\n');

  return (
    <BrowserFrame title="LinkedIn Agent" url="ultron-app.com/linkedin-agent">
      <div className="p-4 min-h-[400px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-white">Générateur de Posts LinkedIn</p>
            <p className="text-[10px] text-white/40">Créez du contenu expert pour votre audience</p>
          </div>
          <span className="px-2 py-1 rounded-md text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30">
            IA Claude
          </span>
        </div>

        {/* Theme selector */}
        <div
          className="flex gap-2 mb-4"
          style={{
            opacity: animate ? 1 : 0,
            transform: animate ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.5s ease',
          }}
        >
          {themes.map((theme, i) => (
            <button
              key={i}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] border transition-all ${
                theme.active
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                  : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20'
              }`}
            >
              <span>{theme.icon}</span>
              <span>{theme.name}</span>
            </button>
          ))}
        </div>

        {/* Post preview card */}
        <div
          className="bg-white/[0.03] rounded-lg border border-white/10 overflow-hidden"
          style={{
            opacity: animate ? 1 : 0,
            transform: animate ? 'translateY(0)' : 'translateY(15px)',
            transition: 'all 0.6s ease 0.2s',
          }}
        >
          {/* LinkedIn-style header */}
          <div className="flex items-center gap-3 p-3 border-b border-white/5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              CB
            </div>
            <div>
              <p className="text-xs font-medium text-white">Cabinet Beaumont Patrimoine</p>
              <p className="text-[10px] text-white/40">Conseil en Gestion de Patrimoine • 2 500 abonnés</p>
            </div>
          </div>

          {/* Post content */}
          <div className="p-3">
            <pre className="text-[11px] text-white/70 whitespace-pre-wrap font-sans leading-relaxed min-h-[180px]">
              {visibleText}
              {displayedLines < totalLines && (
                <span className="inline-block w-1.5 h-3.5 bg-blue-400 ml-0.5 animate-pulse" />
              )}
            </pre>
          </div>

          {/* LinkedIn-style engagement bar */}
          <div className="flex items-center gap-4 px-3 py-2 border-t border-white/5">
            <span className="text-[10px] text-white/30">👍 24 • 💬 8 commentaires</span>
          </div>
        </div>

        {/* Action buttons */}
        <div
          className="flex gap-2 mt-3"
          style={{
            opacity: displayedLines >= totalLines ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        >
          <button className="flex-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 text-[10px] rounded-md border border-blue-500/30 hover:bg-blue-500/30 transition-colors">
            📋 Copier le post
          </button>
          <button className="flex-1 px-3 py-1.5 bg-white/5 text-white/50 text-[10px] rounded-md border border-white/10 hover:border-white/20 transition-colors">
            🔄 Régénérer
          </button>
          <button className="px-3 py-1.5 bg-white/5 text-white/50 text-[10px] rounded-md border border-white/10 hover:border-white/20 transition-colors">
            ⭐
          </button>
        </div>
      </div>
    </BrowserFrame>
  );
}
