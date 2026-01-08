'use client';

import { useState } from 'react';
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
import { Sparkles, Edit, Target, FileText, Clock, BookOpen } from 'lucide-react';

const mockPrompts = [
  {
    id: '1',
    type: 'qualification',
    name: 'Qualification de prospect',
    icon: Target,
    description: 'Analyse et qualifie les prospects (CHAUD, TIEDE, FROID)',
    systemPrompt: 'Tu es un assistant specialise dans la qualification de prospects pour un cabinet de gestion de patrimoine.',
    userPrompt: 'Analyse ce prospect et determine son niveau de qualification (CHAUD, TIEDE, FROID).',
  },
  {
    id: '2',
    type: 'synthese',
    name: 'Synthese de conversation',
    icon: FileText,
    description: 'Genere des syntheses de conversations avec les prospects',
    systemPrompt: 'Tu es un assistant qui synthetise les conversations avec les prospects.',
    userPrompt: 'Cree une synthese de cette conversation.',
  },
  {
    id: '3',
    type: 'rappel',
    name: 'Email de rappel',
    icon: Clock,
    description: 'Redige des emails de rappel personnalises',
    systemPrompt: 'Tu es un assistant qui redige des emails de rappel professionnels et personnalises.',
    userPrompt: 'Redige un email de rappel pour ce prospect.',
  },
  {
    id: '4',
    type: 'plaquette',
    name: 'Envoi de plaquette',
    icon: BookOpen,
    description: 'Cree des emails d\'accompagnement pour les plaquettes',
    systemPrompt: 'Tu es un assistant qui redige des emails d\'accompagnement pour l\'envoi de plaquettes commerciales.',
    userPrompt: 'Redige un email pour accompagner l\'envoi de la plaquette.',
  },
];

export function PromptEditor() {
  const [selectedPrompt, setSelectedPrompt] = useState<typeof mockPrompts[0] | null>(null);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');

  const handleEdit = (prompt: typeof mockPrompts[0]) => {
    setSelectedPrompt(prompt);
    setSystemPrompt(prompt.systemPrompt);
    setUserPrompt(prompt.userPrompt);
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
              Personnalisez les prompts utilises par l'IA
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-white hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-100">
                  <prompt.icon className="h-4 w-4 text-zinc-600" />
                </div>
                <div>
                  <p className="font-medium text-zinc-900">{prompt.name}</p>
                  <p className="text-sm text-muted-foreground">{prompt.description}</p>
                </div>
              </div>

              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(prompt)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </Button>
                </SheetTrigger>
                <SheetContent className="sm:max-w-lg">
                  <SheetHeader>
                    <SheetTitle>Modifier le prompt</SheetTitle>
                    <SheetDescription>
                      {selectedPrompt?.name}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-6 mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="systemPrompt">System Prompt</Label>
                      <Textarea
                        id="systemPrompt"
                        placeholder="Instructions pour l'IA..."
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        rows={5}
                      />
                      <p className="text-xs text-muted-foreground">
                        Le system prompt definit le comportement general de l'IA
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userPrompt">User Prompt</Label>
                      <Textarea
                        id="userPrompt"
                        placeholder="Template du message utilisateur..."
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        rows={5}
                      />
                      <p className="text-xs text-muted-foreground">
                        Le user prompt est le template utilise pour chaque requete
                      </p>
                    </div>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                      Enregistrer les modifications
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
