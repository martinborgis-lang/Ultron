'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Sparkles, Loader2, User, FileText, CreditCard } from 'lucide-react';

const COMPAGNIES = [
  'AXA', 'Generali', 'Allianz', 'Swiss Life', 'Cardif (BNP)',
  'Predica (Crédit Agricole)', 'CNP Assurances', 'MAIF', 'MACIF',
  'AG2R La Mondiale', 'MMA', 'Groupama', 'Suravenir', 'Spirica',
  'Apicil', 'MACSF', 'La Banque Postale', 'Crédit Mutuel',
  'Caisse d\'Épargne', 'LCL', 'Société Générale', 'Boursorama',
  'Autre',
];

const TYPES_CONTRAT = [
  { value: 'assurance_vie', label: 'Assurance-vie' },
  { value: 'per', label: 'PER (Plan Épargne Retraite)' },
  { value: 'pea', label: 'PEA' },
  { value: 'compte_titre', label: 'Compte-titres' },
  { value: 'perp', label: 'PERP' },
  { value: 'capitalisation', label: 'Contrat de capitalisation' },
  { value: 'autre', label: 'Autre' },
];

interface Props {
  prospect: any;
  onBack: () => void;
  onGenerate: (data: any) => void;
  isGenerating: boolean;
}

export function RachatLetterForm({ prospect, onBack, onGenerate, isGenerating }: Props) {
  const [formData, setFormData] = useState({
    // Infos client (pré-remplies)
    clientNom: prospect.nom || prospect.last_name || '',
    clientPrenom: prospect.prenom || prospect.first_name || '',
    clientAdresse: '',
    clientCodePostal: '',
    clientVille: '',
    clientDateNaissance: '',
    clientLieuNaissance: '',

    // Infos du contrat
    compagnie: '',
    autreCompagnie: '',
    typeContrat: 'assurance_vie',
    numeroContrat: '',
    dateSouscription: '',
    montantEstime: '',

    // Type d'opération
    typeOperation: 'rachat_total' as 'rachat_total' | 'rachat_partiel' | 'transfert',
    montantRachatPartiel: '',

    // RIB (si rachat)
    ribIban: '',
    ribBic: '',
    ribTitulaire: '',

    // Transfert
    nouveauContratNumero: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isValid = () => {
    if (!formData.clientNom || !formData.clientPrenom) return false;
    if (!formData.clientAdresse || !formData.clientCodePostal || !formData.clientVille) return false;
    if (!formData.compagnie || !formData.numeroContrat) return false;
    if (formData.compagnie === 'Autre' && !formData.autreCompagnie) return false;
    if (formData.typeOperation === 'rachat_partiel' && !formData.montantRachatPartiel) return false;
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Bouton retour */}
      <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4 mr-1" /> Retour
      </button>

      {/* Section : Informations du client */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <User className="h-4 w-4" /> Informations du client
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Prénom *</label>
            <Input
              value={formData.clientPrenom}
              onChange={(e) => updateField('clientPrenom', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nom *</label>
            <Input
              value={formData.clientNom}
              onChange={(e) => updateField('clientNom', e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Adresse *</label>
            <Input
              value={formData.clientAdresse}
              onChange={(e) => updateField('clientAdresse', e.target.value)}
              placeholder="123 rue de la Paix"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Code postal *</label>
            <Input
              value={formData.clientCodePostal}
              onChange={(e) => updateField('clientCodePostal', e.target.value)}
              placeholder="75001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ville *</label>
            <Input
              value={formData.clientVille}
              onChange={(e) => updateField('clientVille', e.target.value)}
              placeholder="Paris"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date de naissance</label>
            <Input
              type="date"
              value={formData.clientDateNaissance}
              onChange={(e) => updateField('clientDateNaissance', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lieu de naissance</label>
            <Input
              value={formData.clientLieuNaissance}
              onChange={(e) => updateField('clientLieuNaissance', e.target.value)}
              placeholder="Paris"
            />
          </div>
        </div>
      </div>

      {/* Section : Contrat existant */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" /> Contrat à racheter
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Compagnie / Assureur *</label>
            <select
              value={formData.compagnie}
              onChange={(e) => updateField('compagnie', e.target.value)}
              className="w-full border rounded-md p-2"
            >
              <option value="">Sélectionner...</option>
              {COMPAGNIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {formData.compagnie === 'Autre' && (
              <Input
                className="mt-2"
                placeholder="Nom de la compagnie"
                value={formData.autreCompagnie}
                onChange={(e) => updateField('autreCompagnie', e.target.value)}
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type de contrat *</label>
            <select
              value={formData.typeContrat}
              onChange={(e) => updateField('typeContrat', e.target.value)}
              className="w-full border rounded-md p-2"
            >
              {TYPES_CONTRAT.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">N° de contrat *</label>
            <Input
              value={formData.numeroContrat}
              onChange={(e) => updateField('numeroContrat', e.target.value)}
              placeholder="123456789"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date de souscription</label>
            <Input
              type="date"
              value={formData.dateSouscription}
              onChange={(e) => updateField('dateSouscription', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Montant estimé (€)</label>
            <Input
              type="number"
              value={formData.montantEstime}
              onChange={(e) => updateField('montantEstime', e.target.value)}
              placeholder="50000"
            />
          </div>
        </div>
      </div>

      {/* Section : Type d'opération */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-3">Type d'opération</h4>

        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="typeOperation"
              checked={formData.typeOperation === 'rachat_total'}
              onChange={() => updateField('typeOperation', 'rachat_total')}
            />
            <div>
              <div className="font-medium">Rachat total</div>
              <div className="text-sm text-gray-500">Récupérer l'intégralité des fonds</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="typeOperation"
              checked={formData.typeOperation === 'rachat_partiel'}
              onChange={() => updateField('typeOperation', 'rachat_partiel')}
            />
            <div className="flex-1">
              <div className="font-medium">Rachat partiel</div>
              <div className="text-sm text-gray-500">Récupérer une partie des fonds</div>
              {formData.typeOperation === 'rachat_partiel' && (
                <Input
                  type="number"
                  className="mt-2 w-48"
                  placeholder="Montant en €"
                  value={formData.montantRachatPartiel}
                  onChange={(e) => updateField('montantRachatPartiel', e.target.value)}
                />
              )}
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="typeOperation"
              checked={formData.typeOperation === 'transfert'}
              onChange={() => updateField('typeOperation', 'transfert')}
            />
            <div>
              <div className="font-medium">Transfert (même assureur)</div>
              <div className="text-sm text-gray-500">Conserve l'antériorité fiscale</div>
            </div>
          </label>
        </div>
      </div>

      {/* Section : RIB (si rachat) */}
      {(formData.typeOperation === 'rachat_total' || formData.typeOperation === 'rachat_partiel') && (
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> RIB de destination
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">IBAN</label>
              <Input
                value={formData.ribIban}
                onChange={(e) => updateField('ribIban', e.target.value)}
                placeholder="FR76 1234 5678 9012 3456 7890 123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">BIC</label>
              <Input
                value={formData.ribBic}
                onChange={(e) => updateField('ribBic', e.target.value)}
                placeholder="BNPAFRPP"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Titulaire du compte</label>
              <Input
                value={formData.ribTitulaire}
                onChange={(e) => updateField('ribTitulaire', e.target.value)}
                placeholder={`${formData.clientPrenom} ${formData.clientNom}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Section : Nouveau contrat (si transfert) */}
      {formData.typeOperation === 'transfert' && (
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Nouveau contrat (destination)</h4>
          <div>
            <label className="block text-sm font-medium mb-1">N° du nouveau contrat</label>
            <Input
              value={formData.nouveauContratNumero}
              onChange={(e) => updateField('nouveauContratNumero', e.target.value)}
              placeholder="Numéro du contrat destination"
            />
          </div>
        </div>
      )}

      {/* Bouton de génération */}
      <Button
        className="w-full"
        onClick={() => onGenerate(formData)}
        disabled={!isValid() || isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Génération en cours...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Générer la lettre
          </>
        )}
      </Button>
    </div>
  );
}