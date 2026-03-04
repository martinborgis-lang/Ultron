'use client';

import { ReactNode } from 'react';

interface BrowserFrameProps {
  title?: string;
  url?: string;
  children: ReactNode;
  className?: string;
  dark?: boolean;
}

export default function BrowserFrame({
  title = 'Ultron',
  url = 'ultron-app.com',
  children,
  className = '',
  dark = true,
}: BrowserFrameProps) {
  return (
    <div
      className={`rounded-xl overflow-hidden shadow-2xl border ${
        dark ? 'border-white/10 bg-gray-900' : 'border-gray-200 bg-white'
      } ${className}`}
    >
      {/* Browser chrome bar */}
      <div
        className={`flex items-center gap-2 px-4 py-2.5 border-b ${
          dark ? 'border-white/10 bg-gray-900/80' : 'border-gray-100 bg-gray-50'
        }`}
      >
        {/* Traffic lights */}
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
          <div className="w-3 h-3 rounded-full bg-green-400/80" />
        </div>

        {/* URL bar */}
        <div
          className={`flex-1 mx-4 px-3 py-1 rounded-md text-xs font-mono truncate ${
            dark
              ? 'bg-white/5 text-white/40'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          <span className="text-green-400/60 mr-1">https://</span>
          {url}
          <span className="text-white/20 ml-1">/{title.toLowerCase().replace(/\s+/g, '-')}</span>
        </div>

        {/* Page title */}
        <span className={`text-xs ${dark ? 'text-white/30' : 'text-gray-400'}`}>
          {title}
        </span>
      </div>

      {/* Content area */}
      <div className={`${dark ? 'bg-slate-950' : 'bg-white'}`}>
        {children}
      </div>
    </div>
  );
}
