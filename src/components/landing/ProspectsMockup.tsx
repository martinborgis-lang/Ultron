'use client';

import { useEffect, useState } from 'react';

export function ProspectsMockup() {
  const [mounted, setMounted] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('tous');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const prospects = [
    {
      id: '1',
      nom: 'Dubois',
      prenom: 'Marie',
      email: 'marie.dubois@techcorp.fr',
      telephone: '+33 6 12 34 56 78',
      qualification: 'CHAUD',
      score: 95,
      statut: 'RDV: 15/01/2025',
      dateRdv: '15/01/2025',
      dateLead: '10/01/2025'
    },
    {
      id: '2',
      nom: 'Martin',
      prenom: 'Jean',
      email: 'j.martin@enterprise.com',
      telephone: '+33 6 98 76 54 32',
      qualification: 'CHAUD',
      score: 88,
      statut: 'RDV Pris',
      dateRdv: '17/01/2025',
      dateLead: '08/01/2025'
    },
    {
      id: '3',
      nom: 'Simon',
      prenom: 'Claire',
      email: 'claire.simon@growth.fr',
      telephone: '+33 7 11 22 33 44',
      qualification: 'TIEDE',
      score: 72,
      statut: 'Contacté',
      dateRdv: '',
      dateLead: '12/01/2025'
    },
    {
      id: '4',
      nom: 'Durand',
      prenom: 'Paul',
      email: 'p.durand@success.fr',
      telephone: '+33 6 55 44 33 22',
      qualification: 'CHAUD',
      score: 94,
      statut: 'Gagné',
      dateRdv: '',
      dateLead: '05/01/2025'
    },
    {
      id: '5',
      nom: 'Leroy',
      prenom: 'Sophie',
      email: 'sophie.leroy@startup.io',
      telephone: '+33 7 99 88 77 66',
      qualification: 'TIEDE',
      score: 68,
      statut: 'À rappeler',
      dateRdv: '',
      dateLead: '14/01/2025'
    },
    {
      id: '6',
      nom: 'Bernard',
      prenom: 'Lucas',
      email: 'lucas@industry.com',
      telephone: '+33 6 33 44 55 66',
      qualification: 'FROID',
      score: 45,
      statut: 'Nouveau',
      dateRdv: '',
      dateLead: '16/01/2025'
    }
  ];

  const getQualificationColor = (qualification: string) => {
    switch (qualification) {
      case 'CHAUD': return 'bg-red-900/30 text-red-300';
      case 'TIEDE': return 'bg-amber-900/30 text-amber-300';
      case 'FROID': return 'bg-blue-900/30 text-blue-300';
      default: return 'bg-gray-700/30 text-gray-300';
    }
  };

  const filteredProspects = prospects.filter(prospect => {
    const matchesFilter = selectedFilter === 'tous' || prospect.qualification === selectedFilter;
    const matchesSearch = searchTerm === '' ||
      prospect.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="w-full h-full bg-gray-900 overflow-hidden relative">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Prospects</h2>
          <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md">
            + Nouveau prospect
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-1.5 border border-gray-600 rounded-md bg-gray-700 text-white text-xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Qualification Filters */}
          <div className="flex gap-2">
            {[
              { key: 'tous', label: 'Tous', count: prospects.length },
              { key: 'CHAUD', label: 'Chauds', count: prospects.filter(p => p.qualification === 'CHAUD').length },
              { key: 'TIEDE', label: 'Tièdes', count: prospects.filter(p => p.qualification === 'TIEDE').length },
              { key: 'FROID', label: 'Froids', count: prospects.filter(p => p.qualification === 'FROID').length }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setSelectedFilter(filter.key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  selectedFilter === filter.key
                    ? 'bg-blue-900/30 text-blue-300 border-blue-700'
                    : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
        <p className="text-sm text-gray-400">
          {filteredProspects.length} prospect{filteredProspects.length !== 1 ? 's' : ''} trouvé{filteredProspects.length !== 1 ? 's' : ''}
          {searchTerm && ` pour "${searchTerm}"`}
          {selectedFilter !== 'tous' && ` (${selectedFilter})`}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-800">
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-2">Nom</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-2">Contact</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-2">Qualification</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-2">Score IA</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-2">Statut</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 bg-gray-900">
            {filteredProspects.map((prospect, index) => (
              <tr key={prospect.id} className="hover:bg-gray-800/50">
                <td className="px-3 py-2">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {prospect.prenom} {prospect.nom}
                    </div>
                    <div className="text-xs text-gray-400">Ajouté le {prospect.dateLead}</div>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div>
                    <div className="text-sm text-white">{prospect.email}</div>
                    <div className="text-xs text-gray-400">{prospect.telephone}</div>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQualificationColor(prospect.qualification)}`}>
                    {prospect.qualification}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center">
                    <div className="flex items-center mr-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
                        <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-white">{prospect.score}/100</span>
                  </div>
                  <div className="w-16 bg-gray-700 rounded-full h-1 mt-1">
                    <div
                      className={`h-1 rounded-full ${
                        prospect.score >= 80 ? 'bg-red-500' :
                        prospect.score >= 60 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${prospect.score}%` }}
                    ></div>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="text-sm text-white">{prospect.statut}</div>
                  {prospect.dateRdv && (
                    <div className="text-xs text-green-400">RDV: {prospect.dateRdv}</div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded">
                      Voir
                    </button>
                    <button className="text-xs bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 px-2 py-1 rounded">
                      Email
                    </button>
                    <button className="text-xs bg-green-900/20 hover:bg-green-900/40 text-green-400 px-2 py-1 rounded">
                      RDV
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredProspects.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 20l4-4m0 0l4 4m-4-4v12" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-white">Aucun prospect trouvé</h3>
          <p className="mt-1 text-sm text-gray-400">
            Essayez de modifier vos filtres ou votre recherche.
          </p>
        </div>
      )}

      {/* Pagination */}
      {filteredProspects.length > 0 && (
        <div className="px-4 py-3 bg-gray-800 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Affichage de 1 à {filteredProspects.length} sur {prospects.length} prospects
            </div>
            <div className="flex items-center gap-2">
              <button className="text-xs bg-gray-700 border border-gray-600 text-gray-300 px-3 py-1.5 rounded hover:bg-gray-600 disabled:opacity-50" disabled>
                Précédent
              </button>
              <span className="text-xs bg-blue-900/20 text-blue-300 px-3 py-1.5 rounded">1</span>
              <button className="text-xs bg-gray-700 border border-gray-600 text-gray-300 px-3 py-1.5 rounded hover:bg-gray-600 disabled:opacity-50" disabled>
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}