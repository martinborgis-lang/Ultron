'use client';

import { useState, useEffect } from 'react';
import BrowserFrame from './BrowserFrame';

const scheduledCalls = [
  { name: 'M. Dupont', time: '09:15', status: 'completed', result: 'RDV pris', score: 'CHAUD' },
  { name: 'Mme. Leroy', time: '09:32', status: 'in_progress', result: null, score: null },
  { name: 'M. Garcia', time: '10:00', status: 'pending', result: null, score: null },
  { name: 'Mme. Petit', time: '10:30', status: 'pending', result: null, score: null },
];

const transcriptLines = [
  { speaker: 'IA', text: 'Bonjour Madame Leroy, je suis l\'assistant du Cabinet Beaumont...' },
  { speaker: 'Prospect', text: 'Oui bonjour, vous m\'appelez à quel sujet ?' },
  { speaker: 'IA', text: 'Suite à votre demande sur notre site concernant l\'optimisation...' },
  { speaker: 'Prospect', text: 'Ah oui, j\'ai effectivement rempli le formulaire. Je cherche...' },
];

export default function VoiceAIAgentMockup() {
  const [animate, setAnimate] = useState(false);
  const [visibleTranscript, setVisibleTranscript] = useState(0);
  const [callSeconds, setCallSeconds] = useState(47);

  useEffect(() => {
    const t1 = setTimeout(() => setAnimate(true), 200);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (!animate) return;
    if (visibleTranscript >= transcriptLines.length) return;
    const t = setTimeout(() => setVisibleTranscript((v) => v + 1), 1200);
    return () => clearTimeout(t);
  }, [animate, visibleTranscript]);

  useEffect(() => {
    if (!animate) return;
    const interval = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [animate]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <BrowserFrame title="Agent Vocal IA" url="ultron-app.com/voice/ai-agent">
      <div className="p-4 min-h-[400px]">
        {/* Header with stats */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-white">Agent Vocal IA</p>
            <p className="text-[10px] text-white/40">Qualification automatique par téléphone</p>
          </div>
          <div className="flex gap-2">
            <span className="px-2 py-1 rounded-md text-[10px] bg-green-500/20 text-green-400 border border-green-500/30">
              🟢 Actif
            </span>
          </div>
        </div>

        {/* Stats bar */}
        <div
          className="grid grid-cols-4 gap-2 mb-4"
          style={{
            opacity: animate ? 1 : 0,
            transform: animate ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.4s ease',
          }}
        >
          {[
            { label: 'Appels', value: '12', color: '#6366f1' },
            { label: 'Répondus', value: '8', color: '#22c55e' },
            { label: 'RDV pris', value: '3', color: '#f59e0b' },
            { label: 'Taux', value: '37%', color: '#3b82f6' },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white/5 rounded-lg p-2 text-center border border-white/5"
            >
              <p className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[9px] text-white/30">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Call queue */}
          <div
            className="bg-white/[0.03] rounded-lg border border-white/5 overflow-hidden"
            style={{
              opacity: animate ? 1 : 0,
              transform: animate ? 'translateX(0)' : 'translateX(-10px)',
              transition: 'all 0.5s ease 0.15s',
            }}
          >
            <div className="px-3 py-1.5 border-b border-white/5">
              <p className="text-[10px] text-white/50 font-medium">File d&apos;appels</p>
            </div>
            {scheduledCalls.map((call, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-3 py-2 border-b border-white/[0.03] ${
                  call.status === 'in_progress' ? 'bg-indigo-500/5' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/30 font-mono w-8">{call.time}</span>
                  <span className="text-[11px] text-white/70">{call.name}</span>
                </div>
                <div>
                  {call.status === 'completed' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400">
                      {call.result}
                    </span>
                  )}
                  {call.status === 'in_progress' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 animate-pulse">
                      En cours {formatTime(callSeconds)}
                    </span>
                  )}
                  {call.status === 'pending' && (
                    <span className="text-[9px] text-white/20">En attente</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Live transcription */}
          <div
            className="bg-white/[0.03] rounded-lg border border-white/5 overflow-hidden"
            style={{
              opacity: animate ? 1 : 0,
              transform: animate ? 'translateX(0)' : 'translateX(10px)',
              transition: 'all 0.5s ease 0.25s',
            }}
          >
            <div className="px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
              <p className="text-[10px] text-white/50 font-medium">Transcription live</p>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            </div>
            <div className="p-2 space-y-2 min-h-[140px]">
              {transcriptLines.slice(0, visibleTranscript).map((line, i) => (
                <div
                  key={i}
                  className="text-[10px]"
                  style={{
                    opacity: 1,
                    animation: 'fadeIn 0.3s ease-out',
                  }}
                >
                  <span className={`font-medium ${
                    line.speaker === 'IA' ? 'text-indigo-400' : 'text-amber-400'
                  }`}>
                    {line.speaker}:
                  </span>{' '}
                  <span className="text-white/50">{line.text}</span>
                </div>
              ))}
              {visibleTranscript < transcriptLines.length && visibleTranscript > 0 && (
                <div className="flex gap-1 px-1">
                  <span className="w-1 h-1 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Qualification result */}
        <div
          className="mt-3 bg-white/[0.03] rounded-lg border border-white/5 p-3 flex items-center justify-between"
          style={{
            opacity: animate ? 1 : 0,
            transform: animate ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.5s ease 0.4s',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="text-xs text-white/50">Qualification IA :</div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20 font-medium">
              CHAUD — 87%
            </span>
          </div>
          <button className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-[10px] rounded border border-indigo-500/30">
            Voir fiche prospect
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </BrowserFrame>
  );
}
