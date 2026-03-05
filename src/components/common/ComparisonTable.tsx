import React from 'react';

interface ComparisonRow {
  feature: string;
  ultron: string;
  competitor: string;
  winner: 'ultron' | 'competitor' | 'tie';
}

interface ComparisonTableProps {
  title: string;
  competitor: string;
  competitorIcon?: string;
  data: ComparisonRow[];
  className?: string;
}

export default function ComparisonTable({
  title,
  competitor,
  competitorIcon = '🏢',
  data,
  className = ''
}: ComparisonTableProps) {
  return (
    <div className={`mb-16 ${className}`}>
      <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
          <thead>
            <tr className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white">
              <th className="px-6 py-4 text-left font-semibold">Critère</th>
              <th className="px-6 py-4 text-center font-semibold flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center mr-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9z" />
                  </svg>
                </div>
                Ultron
              </th>
              <th className="px-6 py-4 text-center font-semibold flex items-center justify-center">
                <span className="mr-2 text-lg">{competitorIcon}</span>
                {competitor}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                <td className="px-6 py-4 font-medium text-slate-900">{item.feature}</td>
                <td className={`px-6 py-4 text-center ${
                  item.winner === 'ultron' ? 'bg-green-50 text-green-800 font-semibold' : ''
                }`}>
                  {item.ultron}
                  {item.winner === 'ultron' && <span className="ml-2">🏆</span>}
                </td>
                <td className={`px-6 py-4 text-center ${
                  item.winner === 'competitor' ? 'bg-green-50 text-green-800 font-semibold' : ''
                }`}>
                  {item.competitor}
                  {item.winner === 'competitor' && <span className="ml-2">🏆</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}