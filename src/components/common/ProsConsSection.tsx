import React from 'react';

interface ProsConsData {
  pros: string[];
  cons: string[];
}

interface ProsConsSectionProps {
  title: string;
  ultronData: ProsConsData;
  competitorData: ProsConsData;
  competitorName: string;
  competitorIcon?: string;
  className?: string;
}

export default function ProsConsSection({
  title,
  ultronData,
  competitorData,
  competitorName,
  competitorIcon = '🏢',
  className = ''
}: ProsConsSectionProps) {
  return (
    <div className={`mb-16 ${className}`}>
      <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">{title}</h2>
      <div className="grid md:grid-cols-2 gap-8">
        {/* Ultron */}
        <div className="bg-white rounded-lg p-8 shadow-lg border border-slate-200">
          <h3 className="text-2xl font-bold text-blue-600 mb-6 flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9z" />
              </svg>
            </div>
            Ultron
          </h3>

          <div className="mb-6">
            <h4 className="font-semibold text-green-600 mb-3">✅ Avantages</h4>
            <ul className="space-y-2">
              {ultronData.pros.map((pro, index) => (
                <li key={index} className="text-slate-700 flex items-start">
                  <span className="text-green-500 mr-2 mt-1">•</span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-orange-600 mb-3">⚠️ Inconvénients</h4>
            <ul className="space-y-2">
              {ultronData.cons.map((con, index) => (
                <li key={index} className="text-slate-700 flex items-start">
                  <span className="text-orange-500 mr-2 mt-1">•</span>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Concurrent */}
        <div className="bg-white rounded-lg p-8 shadow-lg border border-slate-200">
          <h3 className="text-2xl font-bold text-blue-600 mb-6 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mr-3 text-lg">
              {competitorIcon}
            </div>
            {competitorName}
          </h3>

          <div className="mb-6">
            <h4 className="font-semibold text-green-600 mb-3">✅ Avantages</h4>
            <ul className="space-y-2">
              {competitorData.pros.map((pro, index) => (
                <li key={index} className="text-slate-700 flex items-start">
                  <span className="text-green-500 mr-2 mt-1">•</span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-orange-600 mb-3">⚠️ Inconvénients</h4>
            <ul className="space-y-2">
              {competitorData.cons.map((con, index) => (
                <li key={index} className="text-slate-700 flex items-start">
                  <span className="text-orange-500 mr-2 mt-1">•</span>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}