'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Sparkles, Loader2, User, FileText, Ban } from 'lucide-react';

const COMPAGNIES = [
  'AXA', 'Generali', 'Allianz', 'Swiss Life', 'Cardif (BNP)',
  'Predica (Crédit Agricole)', 'CNP Assurances', 'MAIF', 'MACIF',
  'AG2R La Mondiale', 'MMA', 'Groupama', 'Suravenir', 'Spirica',
  'Apicil', 'MACSF', 'La Banque Postale', 'Crédit Mutuel',
  'Caisse d\'Épargne', 'LCL', 'Société Générale', 'Boursorama',
  'Autre',
];

interface Props {
  prospect: any;
  onBack: () => void;
  onGenerate: (data: any) => void;
  isGenerating: boolean;
}

export function StopPrelevementForm({ prospect, onBack, onGenerate, isGenerating }: Props) {
  const [formData, setFormData] = useState({
    // Infos client
    clientNom: prospect.nom || prospect.last_name || '',
    clientPrenom: prospect.prenom || prospect.first_name || '',
    clientAdresse: '',
    clientCodePostal: '',
    clientVille: '',

    // Infos du contrat
    compagnie: '',
    autreCompagnie: '',
    numeroContrat: '',

    // Prélèvement
    montantPrelevement: '',
    frequence: 'mensuel' as 'mensuel' | 'trimestriel' | 'semestriel' | 'annuel',
    dateArret: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isValid = () => {
    if (!formData.clientNom || !formData.clientPrenom) return false;
    if (!formData.clientAdresse || !formData.clientCodePostal || !formData.clientVille) return false;
    if (!formData.compagnie || !formData.numeroContrat) return false;
    if (!formData.montantPrelevement) return false;
    if (formData.compagnie === 'Autre' && !formData.autreCompagnie) return false;
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Bouton retour */}
      <button onClick={onBack} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
        <ArrowLeft className="h-4 w-4 mr-1" /> Retour
      </button>

      {/* Section : Informations du client */}
      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
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
        </div>
      </div>

      {/* Section : Contrat concerné */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" /> Contrat concerné
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Compagnie *</label>
            <select
              value={formData.compagnie}
              onChange={(e) => updateField('compagnie', e.target.value)}
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
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
            <label className="block text-sm font-medium mb-1">N° de contrat *</label>
            <Input
              value={formData.numeroContrat}
              onChange={(e) => updateField('numeroContrat', e.target.value)}
              placeholder="123456789"
            />
          </div>
        </div>
      </div>

      {/* Section : Prélèvement à arrêter */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Ban className="h-4 w-4" /> Prélèvement à arrêter
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Montant (€) *</label>
            <Input
              type="number"
              value={formData.montantPrelevement}
              onChange={(e) => updateField('montantPrelevement', e.target.value)}
              placeholder="200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fréquence *</label>
            <select
              value={formData.frequence}
              onChange={(e) => updateField('frequence', e.target.value)}
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="mensuel">Mensuel</option>
              <option value="trimestriel">Trimestriel</option>
              <option value="semestriel">Semestriel</option>
              <option value="annuel">Annuel</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date d'arrêt souhaitée</label>
            <Input
              type="date"
              value={formData.dateArret}
              onChange={(e) => updateField('dateArret', e.target.value)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Laisser vide = dès réception du courrier
            </p>
          </div>
        </div>
      </div>

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