'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, ArrowRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'upload' | 'mapping' | 'importing' | 'done';

const ULTRON_FIELDS = [
  { value: '', label: '-- Ignorer --' },
  { value: 'first_name', label: 'Prenom', group: 'Contact' },
  { value: 'last_name', label: 'Nom', group: 'Contact' },
  { value: 'email', label: 'Email', group: 'Contact' },
  { value: 'phone', label: 'Telephone', group: 'Contact' },
  { value: 'company', label: 'Entreprise', group: 'Contact' },
  { value: 'job_title', label: 'Poste', group: 'Contact' },
  { value: 'city', label: 'Ville', group: 'Contact' },
  { value: 'address', label: 'Adresse', group: 'Contact' },
  { value: 'postal_code', label: 'Code postal', group: 'Contact' },
  { value: 'patrimoine_estime', label: 'Patrimoine estime', group: 'Patrimoine' },
  { value: 'revenus_annuels', label: 'Revenus annuels', group: 'Patrimoine' },
  { value: 'situation_familiale', label: 'Situation familiale', group: 'Patrimoine' },
  { value: 'nb_enfants', label: "Nombre d'enfants", group: 'Patrimoine' },
  { value: 'age', label: 'Age', group: 'Patrimoine' },
  { value: 'profession', label: 'Profession', group: 'Patrimoine' },
  { value: 'deal_value', label: 'Valeur du deal', group: 'Pipeline' },
  { value: 'notes', label: 'Notes', group: 'Autre' },
  { value: 'tags', label: 'Tags (separes par virgule)', group: 'Autre' },
  { value: 'source_detail', label: 'Source detaillee', group: 'Autre' },
];

// Auto-mapping suggestions
const AUTO_MAPPINGS: Record<string, string[]> = {
  first_name: ['prenom', 'prénom', 'first_name', 'firstname', 'first name'],
  last_name: ['nom', 'last_name', 'lastname', 'last name', 'name', 'nom de famille'],
  email: ['email', 'mail', 'e-mail', 'courriel', 'adresse email'],
  phone: ['telephone', 'téléphone', 'tel', 'phone', 'mobile', 'portable', 'numero'],
  company: ['entreprise', 'societe', 'société', 'company', 'organisation', 'organization'],
  job_title: ['poste', 'fonction', 'titre', 'job', 'title', 'job_title'],
  city: ['ville', 'city', 'localite', 'commune'],
  address: ['adresse', 'address', 'rue'],
  postal_code: ['code postal', 'cp', 'postal_code', 'zip', 'zipcode'],
  patrimoine_estime: ['patrimoine', 'patrimoine estime', 'patrimoine_estime', 'wealth', 'assets'],
  revenus_annuels: ['revenus', 'revenus annuels', 'salaire', 'income', 'revenue'],
  situation_familiale: ['situation', 'situation familiale', 'marital', 'family'],
  nb_enfants: ['enfants', 'nb enfants', 'children', 'kids'],
  age: ['age', 'âge'],
  profession: ['profession', 'metier', 'job'],
  deal_value: ['valeur', 'montant', 'deal', 'value', 'amount'],
  notes: ['notes', 'commentaires', 'comments', 'remarques'],
};

function suggestMapping(columnName: string): string {
  const normalizedCol = columnName.toLowerCase().trim();

  for (const [field, keywords] of Object.entries(AUTO_MAPPINGS)) {
    if (keywords.some((kw) => normalizedCol.includes(kw) || kw.includes(normalizedCol))) {
      return field;
    }
  }

  return '';
}

export default function ImportPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors?: string[];
  } | null>(null);

  const parseCSV = useCallback((text: string) => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error(
        "Le fichier doit contenir au moins une ligne d'en-tete et une ligne de donnees"
      );
    }

    // Detecter le separateur (virgule ou point-virgule)
    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';

    // Parser l'en-tete
    const headers = firstLine.split(separator).map((h) => h.trim().replace(/^["']|["']$/g, ''));

    // Parser les donnees
    const data = lines.slice(1).map((line) => {
      const values = line.split(separator).map((v) => v.trim().replace(/^["']|["']$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      return row;
    });

    return { headers, data };
  }, []);

  const handleFileUpload = useCallback(
    async (uploadedFile: File) => {
      try {
        const text = await uploadedFile.text();
        const { headers, data } = parseCSV(text);

        setFile(uploadedFile);
        setColumns(headers);
        setRows(data);

        // Auto-mapping
        const autoMapping: Record<string, string> = {};
        headers.forEach((col) => {
          autoMapping[col] = suggestMapping(col);
        });
        setMapping(autoMapping);

        setStep('mapping');
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        toast({
          title: 'Erreur de lecture',
          description: message,
          variant: 'destructive',
        });
      }
    },
    [parseCSV, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
        handleFileUpload(droppedFile);
      } else {
        toast({
          title: 'Format non supporte',
          description: 'Veuillez utiliser un fichier CSV',
          variant: 'destructive',
        });
      }
    },
    [handleFileUpload, toast]
  );

  const handleImport = async () => {
    setImporting(true);
    setStep('importing');

    try {
      const response = await fetch('/api/crm/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospects: rows, mapping }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'import");
      }

      setResult({
        imported: data.imported,
        skipped: data.skipped,
        errors: data.errors,
      });
      setStep('done');

      toast({
        title: 'Import reussi !',
        description: `${data.imported} prospects importes`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: "Erreur d'import",
        description: message,
        variant: 'destructive',
      });
      setStep('mapping');
    } finally {
      setImporting(false);
    }
  };

  const mappedFieldsCount = Object.values(mapping).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Importer des prospects</h1>
        <p className="text-muted-foreground">
          Importez vos prospects depuis un fichier CSV
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        <Badge variant={step === 'upload' ? 'default' : 'secondary'}>1. Fichier</Badge>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <Badge variant={step === 'mapping' ? 'default' : 'secondary'}>2. Mapping</Badge>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <Badge variant={step === 'importing' || step === 'done' ? 'default' : 'secondary'}>
          3. Import
        </Badge>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Choisir un fichier</CardTitle>
            <CardDescription>
              Glissez-deposez un fichier CSV ou cliquez pour le selectionner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
                'hover:border-primary/50 hover:bg-muted/50'
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Glissez votre fichier CSV ici</p>
              <p className="text-sm text-muted-foreground mt-1">ou cliquez pour parcourir</p>
              <input
                id="file-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) handleFileUpload(selectedFile);
                }}
              />
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Conseils pour l&apos;import</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- La premiere ligne doit contenir les noms des colonnes</li>
                <li>- Formats supportes : CSV (separateur virgule ou point-virgule)</li>
                <li>- Encodage recommande : UTF-8</li>
                <li>- Les colonnes seront automatiquement detectees</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Mapping */}
      {step === 'mapping' && (
        <Card>
          <CardHeader>
            <CardTitle>Mapper les colonnes</CardTitle>
            <CardDescription>
              {file?.name} - {rows.length} lignes detectees - {mappedFieldsCount} champs mappes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mapping table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Colonne du fichier</TableHead>
                    <TableHead className="w-1/3">Exemple</TableHead>
                    <TableHead className="w-1/3">Champ Ultron</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {columns.map((col) => (
                    <TableRow key={col}>
                      <TableCell className="font-medium">{col}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {rows[0]?.[col]?.slice(0, 30) || '-'}
                        {(rows[0]?.[col]?.length || 0) > 30 && '...'}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mapping[col] || ''}
                          onValueChange={(value) => setMapping({ ...mapping, [col]: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="-- Ignorer --" />
                          </SelectTrigger>
                          <SelectContent>
                            {ULTRON_FIELDS.map((field) => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Preview */}
            <div>
              <h4 className="font-medium mb-2">Apercu (3 premieres lignes)</h4>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.entries(mapping)
                        .filter(([, v]) => v)
                        .map(([col, field]) => (
                          <TableHead key={col}>
                            {ULTRON_FIELDS.find((f) => f.value === field)?.label || field}
                          </TableHead>
                        ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 3).map((row, i) => (
                      <TableRow key={i}>
                        {Object.entries(mapping)
                          .filter(([, v]) => v)
                          .map(([col]) => (
                            <TableCell key={col} className="text-sm">
                              {row[col]?.slice(0, 30) || '-'}
                            </TableCell>
                          ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Changer de fichier
              </Button>
              <Button onClick={handleImport} disabled={mappedFieldsCount === 0}>
                Importer {rows.length} prospects
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Importing */}
      {step === 'importing' && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Import en cours...</p>
            <p className="text-muted-foreground">{rows.length} prospects en cours d&apos;importation</p>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Done */}
      {step === 'done' && result && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Import termine !</h2>
            <p className="text-muted-foreground mb-6">
              {result.imported} prospects importes avec succes
              {result.skipped > 0 && ` - ${result.skipped} ignores (donnees manquantes)`}
            </p>

            {result.errors && result.errors.length > 0 && (
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-left">
                <div className="flex items-center gap-2 text-yellow-500 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Avertissements</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setStep('upload');
                  setFile(null);
                  setColumns([]);
                  setRows([]);
                  setMapping({});
                  setResult(null);
                }}
              >
                Nouvel import
              </Button>
              <Button onClick={() => router.push('/pipeline')}>Voir le Pipeline</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
