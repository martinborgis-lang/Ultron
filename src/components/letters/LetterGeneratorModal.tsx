'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, Ban, ArrowLeft, Sparkles, Download, Loader2, Copy, RefreshCw } from 'lucide-react';
import { RachatLetterForm } from './RachatLetterForm';
import { StopPrelevementForm } from './StopPrelevementForm';

interface Prospect {
  id: string;
  prenom?: string;
  nom?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
}

interface LetterGeneratorModalProps {
  prospect: Prospect;
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'select' | 'form' | 'preview';
type LetterType = 'rachat' | 'stop_prelevement';

export function LetterGeneratorModal({ prospect, isOpen, onClose }: LetterGeneratorModalProps) {
  const [step, setStep] = useState<Step>('select');
  const [letterType, setLetterType] = useState<LetterType | null>(null);
  const [generatedLetter, setGeneratedLetter] = useState<string>('');
  const [formData, setFormData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleSelectType = (type: LetterType) => {
    setLetterType(type);
    setStep('form');
  };

  const handleGenerate = async (data: any) => {
    setFormData(data);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/letters/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letterType, formData: data }),
      });

      if (!response.ok) throw new Error('Erreur de génération');

      const result = await response.json();
      setGeneratedLetter(result.letter);
      setStep('preview');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la génération de la lettre');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const clientNom = formData?.clientNom || prospect.nom || prospect.last_name || 'client';
      const response = await fetch('/api/letters/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          letterContent: generatedLetter,
          fileName: `lettre-${letterType}-${clientNom}-${Date.now()}.pdf`,
        }),
      });

      if (!response.ok) throw new Error('Erreur PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lettre-${letterType}-${clientNom}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du téléchargement');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBack = () => {
    if (step === 'preview') {
      setStep('form');
    } else if (step === 'form') {
      setStep('select');
      setLetterType(null);
    }
  };

  const handleClose = () => {
    setStep('select');
    setLetterType(null);
    setGeneratedLetter('');
    setFormData(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'select' && 'Générer une lettre'}
            {step === 'form' && letterType === 'rachat' && 'Lettre de Rachat / Transfert'}
            {step === 'form' && letterType === 'stop_prelevement' && 'Lettre de Stop Prélèvement'}
            {step === 'preview' && 'Prévisualisation'}
          </DialogTitle>
        </DialogHeader>

        {/* Étape 1 : Sélection du type */}
        {step === 'select' && (
          <div className="grid grid-cols-2 gap-4 py-6">
            <button
              onClick={() => handleSelectType('rachat')}
              className="flex flex-col items-center gap-3 p-6 border-2 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all"
            >
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                <ArrowRightLeft className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">Rachat / Transfert</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Récupérer les fonds d'un contrat existant
                </p>
              </div>
            </button>

            <button
              onClick={() => handleSelectType('stop_prelevement')}
              className="flex flex-col items-center gap-3 p-6 border-2 rounded-xl hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950 transition-all"
            >
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                <Ban className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">Stop Prélèvement</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Arrêter les versements automatiques
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Étape 2 : Formulaire */}
        {step === 'form' && letterType === 'rachat' && (
          <RachatLetterForm
            prospect={prospect}
            onBack={handleBack}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        )}

        {step === 'form' && letterType === 'stop_prelevement' && (
          <StopPrelevementForm
            prospect={prospect}
            onBack={handleBack}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        )}

        {/* Étape 3 : Prévisualisation */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button onClick={handleBack} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <ArrowLeft className="h-4 w-4 mr-1" /> Modifier
              </button>
              <button
                onClick={() => handleGenerate(formData)}
                className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                disabled={isGenerating}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                Régénérer
              </button>
            </div>

            {/* Zone de prévisualisation */}
            <div className="border rounded-lg p-6 bg-white dark:bg-gray-800 shadow-inner max-h-80 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-gray-900 dark:text-gray-100">
                {generatedLetter}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(generatedLetter);
                  alert('Texte copié !');
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copier le texte
              </Button>

              <Button
                className="flex-1"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Téléchargement...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}