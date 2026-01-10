'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Sparkles, Edit, Target, FileText, Clock, BookOpen, RotateCcw, Loader2, Check } from 'lucide-react';

type PromptType = 'qualification' | 'synthese' | 'rappel' | 'plaquette';

interface PromptConfig {
  id: string;
  type: PromptType;
  name: string;
  icon: React.ElementType;
  description: string;
}

const promptConfigs: PromptConfig[] = [
  {
    id: '1',
    type: 'qualification',
    name: 'Email de qualification',
    icon: Target,
    description: 'Email personnalise pour qualifier un nouveau prospect',
  },
  {
    id: '2',
    type: 'synthese',
    name: 'Email post-RDV',
    icon: FileText,
    description: 'Email de synthese apres un rendez-vous valide',
  },
  {
    id: '3',
    type: 'rappel',
    name: 'Rappel 24h',
    icon: Clock,
    description: 'Email de rappel 24h avant le rendez-vous',
  },
  {
    id: '4',
    type: 'plaquette',
    name: 'Envoi de plaquette',
    icon: BookOpen,
    description: 'Email accompagnant l\'envoi de la plaquette commerciale',
  },
];

export function PromptEditor() {
  const [prompts, setPrompts] = useState<Record<PromptType, string>>({
    qualification: '',
    synthese: '',
    rappel: '',
    plaquette: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedType, setSelectedType] = useState<PromptType | null>(null);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/prompts');
      const data = await response.json();

      if (response.ok) {
        setPrompts(data.prompts);
      }
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (type: PromptType) => {
    setSelectedType(type);
    setEditedPrompt(prompts[type]);
    setSaved(false);
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!selectedType) return;

    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch('/api/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, prompt: editedPrompt }),
      });

      if (response.ok) {
        setPrompts((prev) => ({ ...prev, [selectedType]: editedPrompt }));
        setSaved(true);
        setTimeout(() => setSheetOpen(false), 1000);
      }
    } catch (error) {
      console.error('Failed to save prompt:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!selectedType) return;

    setResetting(true);

    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType }),
      });

      if (response.ok) {
        const data = await response.json();
        setEditedPrompt(data.defaultPrompt);
        setPrompts((prev) => ({ ...prev, [selectedType]: data.defaultPrompt }));
      }
    } catch (error) {
      console.error('Failed to reset prompt:', error);
    } finally {
      setResetting(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-50">
            <Sparkles className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Prompts IA</CardTitle>
            <CardDescription>
              Personnalisez les prompts utilises par Claude pour generer vos emails
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {promptConfigs.map((config) => (
              <div
                key={config.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-white hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-100">
                    <config.icon className="h-4 w-4 text-zinc-600" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900">{config.name}</p>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                </div>

                <Sheet open={sheetOpen && selectedType === config.type} onOpenChange={(open) => {
                  if (!open) setSheetOpen(false);
                }}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(config.type)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="sm:max-w-lg">
                    <SheetHeader>
                      <SheetTitle>Modifier le prompt</SheetTitle>
                      <SheetDescription>
                        {config.name}
                      </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-6 mt-6">
                      <div className="space-y-2">
                        <Label htmlFor="prompt">System Prompt</Label>
                        <Textarea
                          id="prompt"
                          placeholder="Instructions pour Claude..."
                          value={editedPrompt}
                          onChange={(e) => setEditedPrompt(e.target.value)}
                          rows={12}
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Le prompt definit comment Claude genere les emails. Il doit retourner un JSON avec "objet" et "corps".
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSave}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                          disabled={saving}
                        >
                          {saving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : saved ? (
                            <Check className="mr-2 h-4 w-4" />
                          ) : null}
                          {saved ? 'Enregistre!' : 'Enregistrer'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleReset}
                          disabled={resetting}
                        >
                          {resetting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Cliquez sur le bouton reset pour revenir au prompt par defaut
                      </p>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
