'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Lightbulb,
  AlertTriangle,
  ExternalLink,
  Loader2,
  BriefcaseBusiness,
  Euro,
  Target,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface Prospect {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  age: string;
  situation_pro: string;
  revenus: string;
  patrimoine: string;
  besoins: string;
  notes_appel: string;
  qualification: string;
  score: number;
  priorite: string;
  justification: string;
  date_rdv: string;
  source: string;
}

interface Interaction {
  type: 'appel' | 'email_synthese' | 'email_plaquette' | 'email_rappel';
  date: string;
  description: string;
  status: 'sent' | 'pending';
}

interface AIAnalysis {
  pointsAttention: string[];
  objectionsProba: string[];
  questionsSuggerees: string[];
  argumentsCles: string[];
  profilPsycho: string;
}

export function MeetingPrepContent({ prospectId }: { prospectId: string }) {
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzingAI, setAnalyzingAI] = useState(false);

  const generateAIAnalysis = useCallback(async (prospectData: Prospect, interactionsData: Interaction[]) => {
    setAnalyzingAI(true);
    try {
      const response = await fetch('/api/meeting/analyze-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospect: prospectData,
          interactions: interactionsData,
        }),
      });

      const data = await response.json();
      if (data.analysis) {
        setAiAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Erreur analyse IA:', error);
    }
    setAnalyzingAI(false);
  }, []);

  const fetchProspectData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/meeting/prepare/${prospectId}`);
      const data = await response.json();

      if (data.prospect) {
        setProspect(data.prospect);
        setInteractions(data.interactions || []);

        // Lancer l'analyse IA automatiquement
        generateAIAnalysis(data.prospect, data.interactions);
      }
    } catch (error) {
      console.error('Erreur fetch prospect:', error);
    }
    setLoading(false);
  }, [prospectId, generateAIAnalysis]);

  useEffect(() => {
    fetchProspectData();
  }, [fetchProspectData]);

  const openInNewWindow = () => {
    const url = window.location.href;
    window.open(url, '_blank', 'width=500,height=900,scrollbars=yes');
  };

  const getQualificationColor = (qualification: string) => {
    switch (qualification?.toUpperCase()) {
      case 'CHAUD':
        return 'bg-red-500';
      case 'TIEDE':
        return 'bg-orange-500';
      case 'FROID':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Prospect non trouvé</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Préparer le RDV</h1>
          <p className="text-muted-foreground">
            {prospect.prenom} {prospect.nom}
          </p>
        </div>
        <Button variant="outline" onClick={openInNewWindow}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Ouvrir dans une nouvelle fenêtre
        </Button>
      </div>

      {/* Fiche prospect principale */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {prospect.prenom} {prospect.nom}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getQualificationColor(prospect.qualification)}>
                {prospect.qualification || 'Non qualifié'}
              </Badge>
              <Badge variant="outline">{prospect.score}%</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{prospect.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{prospect.telephone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>RDV : {prospect.date_rdv || 'Non planifié'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />
                <span>{prospect.situation_pro || 'Non renseigné'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Euro className="h-4 w-4 text-muted-foreground" />
                <span>Revenus : {prospect.revenus || 'Non renseigné'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Euro className="h-4 w-4 text-muted-foreground" />
                <span>Patrimoine : {prospect.patrimoine || 'Non renseigné'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Âge : {prospect.age || 'Non renseigné'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span>Source : {prospect.source || 'Non renseigné'}</span>
              </div>
            </div>
          </div>

          {/* Besoins */}
          {prospect.besoins && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Besoins exprimés :</p>
              <p className="text-sm text-muted-foreground">{prospect.besoins}</p>
            </div>
          )}

          {/* Notes d'appel */}
          {prospect.notes_appel && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Notes de l&apos;appel :</p>
              <p className="text-sm text-muted-foreground">{prospect.notes_appel}</p>
            </div>
          )}

          {/* Justification IA */}
          {prospect.justification && (
            <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium mb-1 text-primary">Analyse IA :</p>
              <p className="text-sm text-muted-foreground">{prospect.justification}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs pour les sections */}
      <Tabs defaultValue="suggestions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="suggestions">
            <Lightbulb className="h-4 w-4 mr-2" />
            Suggestions IA
          </TabsTrigger>
          <TabsTrigger value="historique">
            <Clock className="h-4 w-4 mr-2" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="objections">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Points d&apos;attention
          </TabsTrigger>
        </TabsList>

        {/* Suggestions IA */}
        <TabsContent value="suggestions">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Questions suggérées</CardTitle>
              <CardDescription>
                Questions pertinentes à poser pendant le RDV
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyzingAI ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyse en cours...
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      Questions à poser :
                    </h4>
                    <ul className="space-y-2">
                      {aiAnalysis.questionsSuggerees.map((q, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-primary font-medium">{i + 1}.</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      Arguments clés :
                    </h4>
                    <ul className="space-y-2">
                      {aiAnalysis.argumentsCles.map((arg, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{arg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {aiAnalysis.profilPsycho && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Profil comportemental :</h4>
                      <p className="text-sm text-muted-foreground">
                        {aiAnalysis.profilPsycho}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Aucune analyse disponible</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historique */}
        <TabsContent value="historique">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historique des interactions</CardTitle>
              <CardDescription>Tous les échanges avec ce prospect</CardDescription>
            </CardHeader>
            <CardContent>
              {interactions.length > 0 ? (
                <div className="space-y-3">
                  {interactions.map((interaction, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                    >
                      <div className="mt-0.5">
                        {interaction.type === 'appel' && (
                          <Phone className="h-4 w-4 text-blue-500" />
                        )}
                        {interaction.type.startsWith('email') && (
                          <Mail className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {interaction.description}
                          </p>
                          <Badge
                            variant={
                              interaction.status === 'sent' ? 'default' : 'outline'
                            }
                          >
                            {interaction.status === 'sent' ? 'Envoyé' : 'En attente'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {interaction.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Aucune interaction enregistrée
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Points d'attention */}
        <TabsContent value="objections">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Points d&apos;attention</CardTitle>
              <CardDescription>
                Objections probables et points à surveiller
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyzingAI ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyse en cours...
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Points d&apos;attention :
                    </h4>
                    <ul className="space-y-2">
                      {aiAnalysis.pointsAttention.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Objections probables :
                    </h4>
                    <ul className="space-y-2">
                      {aiAnalysis.objectionsProba.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Aucune analyse disponible</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
