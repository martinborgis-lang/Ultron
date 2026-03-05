import React from 'react';

interface QuickAnswerProps {
  title?: string;
  ultronReasons: string[];
  competitorReasons: string[];
  competitorName: string;
  className?: string;
}

export default function QuickAnswerSection({
  title = "Réponse Rapide",
  ultronReasons,
  competitorReasons,
  competitorName,
  className = ''
}: QuickAnswerProps) {
  return (
    <div className={`bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-8 mb-16 ${className}`}>
      <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
        <span className="mr-3">🎯</span>
        {title}
      </h2>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-blue-600 mb-3">
            Choisissez Ultron si :
          </h3>
          <ul className="space-y-2 text-slate-700">
            {ultronReasons.map((reason, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✅</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-orange-600 mb-3">
            Choisissez {competitorName} si :
          </h3>
          <ul className="space-y-2 text-slate-700">
            {competitorReasons.map((reason, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">✅</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}