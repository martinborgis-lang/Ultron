'use client';

import { useState, useEffect } from 'react';
import BrowserFrame from './BrowserFrame';

export default function ClickToCallMockup() {
  const [callState, setCallState] = useState<'ringing' | 'active' | 'notes'>('ringing');
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    // Auto-progress call states
    const t1 = setTimeout(() => setCallState('active'), 1500);
    const t2 = setTimeout(() => setCallState('notes'), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (callState !== 'active') return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [callState]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <BrowserFrame title="Click-to-Call" url="ultron-app.com/prospects">
      <div className="p-6 min-h-[380px] flex items-center justify-center">
        {/* Call Widget overlay */}
        <div className="w-full max-w-sm bg-white/[0.06] backdrop-blur-sm rounded-xl border border-white/10 p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Jean-Marc Lefebvre</p>
              <p className="text-white/40 text-xs">+33 6 12 34 56 78</p>
            </div>
            <div className="ml-auto">
              {callState === 'ringing' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-400 animate-pulse">
                  Appel en cours...
                </span>
              )}
              {callState === 'active' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-500/20 text-green-400">
                  En ligne
                </span>
              )}
              {callState === 'notes' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white/50">
                  Termin\u00e9
                </span>
              )}
            </div>
          </div>

          {/* Timer (active state) */}
          {callState === 'active' && (
            <div className="text-center py-3">
              <p className="text-3xl font-mono font-bold text-green-400">{formatTime(timer)}</p>
              <div className="flex justify-center gap-4 mt-4">
                <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/15 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                </button>
                <button className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Post-call notes */}
          {callState === 'notes' && (
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">R\u00e9sultat de l&apos;appel</p>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 rounded-md text-[11px] bg-green-500/20 text-green-400 border border-green-500/30">
                    RDV pris
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] bg-white/5 text-white/30 border border-white/10">
                    Rappeler
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] bg-white/5 text-white/30 border border-white/10">
                    Pas int\u00e9ress\u00e9
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Notes</p>
                <div className="bg-white/5 rounded-md p-2 text-xs text-white/50 border border-white/5">
                  Int\u00e9ress\u00e9 par PER et assurance-vie. RDV fix\u00e9 mardi 14h. Patrimoine ~350k\u20ac...
                </div>
              </div>
              <button className="w-full py-2 bg-indigo-500 text-white text-xs font-medium rounded-lg hover:bg-indigo-600 transition-colors">
                Sauvegarder et fermer
              </button>
            </div>
          )}

          {/* Ringing animation */}
          {callState === 'ringing' && (
            <div className="flex justify-center py-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-green-400/30 animate-ping" />
              </div>
            </div>
          )}
        </div>
      </div>
    </BrowserFrame>
  );
}
