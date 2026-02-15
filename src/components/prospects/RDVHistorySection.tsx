'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Clock,
  FileText,
  Brain,
  AlertCircle,
  CheckCircle,
  Target,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { MeetingTranscript, TranscriptSegment, ObjectionDetected } from '@/types/meeting';

interface RDVHistorySectionProps {
  transcriptions: MeetingTranscript[];
  prospectName: string;
}

interface ExtendedTranscript extends MeetingTranscript {
  crm_prospects?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  users?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

export function RDVHistorySection({ transcriptions, prospectName }: RDVHistorySectionProps) {
  const [expandedRdv, setExpandedRdv] = useState<Set<string>>(new Set());

  const toggleExpanded = (transcriptId: string) => {
    const newExpanded = new Set(expandedRdv);
    if (expandedRdv.has(transcriptId)) {
      newExpanded.delete(transcriptId);
    } else {
      newExpanded.add(transcriptId);
    }
    setExpandedRdv(newExpanded);
  };

  const formatDuration = (durationSeconds: number | null) => {
    if (!durationSeconds) return 'Durée inconnue';
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    return `${minutes}min ${seconds}s`;
  };

  const getSentimentBadge = (transcript: MeetingTranscript) => {
    // Analyser le sentiment basé sur l'analyse IA ou les objections
    if (transcript.objections_detected && transcript.objections_detected.length > 3) {
      return <Badge variant="destructive" className="text-xs">Difficile</Badge>;
    }
    if (transcript.ai_summary && transcript.ai_summary.toLowerCase().includes('positif')) {
      return <Badge className="bg-green-100 text-green-800 text-xs">Positif</Badge>;
    }
    if (transcript.ai_summary && transcript.ai_summary.toLowerCase().includes('négatif')) {
      return <Badge variant="destructive" className="text-xs">Négatif</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Neutre</Badge>;
  };

  const getBudgetBadge = (transcript: MeetingTranscript) => {
    if (!transcript.ai_summary) return null;

    const summary = transcript.ai_summary.toLowerCase();
    if (summary.includes('budget') || summary.includes('€') || summary.includes('euro')) {
      return <Badge variant="outline" className="text-xs">Budget évoqué</Badge>;
    }
    return null;
  };

  const renderTranscriptText = (transcript: MeetingTranscript) => {
    // Priorité aux segments JSON si disponibles
    if (transcript.transcript_json && Array.isArray(transcript.transcript_json)) {
      return (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {(transcript.transcript_json as TranscriptSegment[]).map((segment, index) => (
            <div key={index} className="flex gap-3 p-2 rounded-lg bg-muted/30">
              <div className="text-xs text-muted-foreground min-w-[60px]">
                {Math.floor(segment.timestamp / 60)}:{(segment.timestamp % 60).toString().padStart(2, '0')}
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  {segment.speaker === 'advisor' ? 'Conseiller' :
                   segment.speaker === 'prospect' ? prospectName :
                   'Intervenant'}
                </div>
                <div className="text-sm">{segment.text}</div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Fallback sur le texte brut
    if (transcript.transcript_text) {
      return (
        <div className="max-h-96 overflow-y-auto p-3 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap">
          {transcript.transcript_text}
        </div>
      );
    }

    return (
      <div className="text-center py-4 text-muted-foreground">
        <MessageSquare className="w-8 h-8 mx-auto mb-2" />
        <p>Transcription non disponible</p>
      </div>
    );
  };

  const renderObjections = (objections: ObjectionDetected[] | null) => {
    if (!objections || objections.length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          <CheckCircle className="w-8 h-8 mx-auto mb-2" />
          <p>Aucune objection détectée</p>
        </div>
      );
    }

    const categoryLabels: Record<string, string> = {
      price: 'Prix',
      trust: 'Confiance',
      timing: 'Timing',
      competition: 'Concurrence',
      need: 'Besoin',
      other: 'Autre'
    };

    const categoryColors: Record<string, string> = {
      price: 'bg-red-100 text-red-800',
      trust: 'bg-orange-100 text-orange-800',
      timing: 'bg-blue-100 text-blue-800',
      competition: 'bg-purple-100 text-purple-800',
      need: 'bg-green-100 text-green-800',
      other: 'bg-gray-100 text-gray-800'
    };

    return (
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {objections.map((objection, index) => (
          <div key={index} className="border rounded-lg p-3">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className={`text-xs ${categoryColors[objection.category] || categoryColors.other}`}
                  >
                    {categoryLabels[objection.category] || objection.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {Math.floor(objection.timestamp / 60)}:{(objection.timestamp % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <p className="text-sm font-medium mb-2">{objection.objection}</p>
                <div className="p-2 bg-green-50 dark:bg-green-950 rounded border-l-4 border-green-200">
                  <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                    Réponse suggérée :
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {objection.suggested_response}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!transcriptions || transcriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Historique des RDV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Aucun RDV enregistré</p>
            <p className="text-sm">
              Les transcriptions et analyses des RDV apparaîtront ici une fois enregistrées.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Historique des RDV ({transcriptions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {transcriptions.map((transcript, index) => {
          const extendedTranscript = transcript as ExtendedTranscript;
          const isExpanded = expandedRdv.has(transcript.id);
          const rdvNumber = transcriptions.length - index;

          return (
            <Collapsible
              key={transcript.id}
              open={isExpanded}
              onOpenChange={() => toggleExpanded(transcript.id)}
            >
              <div className="border rounded-lg">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full p-4 justify-between hover:bg-muted/50 h-auto"
                  >
                    <div className="flex items-center gap-3 text-left">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">RDV {rdvNumber}</span>
                          <span className="text-muted-foreground">
                            {format(new Date(transcript.meeting_date), 'dd MMMM yyyy', { locale: fr })}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(transcript.duration_seconds)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSentimentBadge(transcript)}
                          {getBudgetBadge(transcript)}
                        </div>
                      </div>
                    </div>
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4">
                    <Tabs defaultValue="resume" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="resume" className="flex items-center gap-1">
                          <Brain className="w-3 h-3" />
                          Résumé IA
                        </TabsTrigger>
                        <TabsTrigger value="transcript" className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Transcript
                        </TabsTrigger>
                        <TabsTrigger value="analyse" className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Analyse
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="resume" className="mt-4">
                        {transcript.ai_summary ? (
                          <div className="prose prose-sm max-w-none">
                            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border-l-4 border-blue-200">
                              <p className="text-sm whitespace-pre-wrap">{transcript.ai_summary}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            <Brain className="w-8 h-8 mx-auto mb-2" />
                            <p>Résumé IA non disponible</p>
                          </div>
                        )}

                        {transcript.google_meet_link && (
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => window.open(transcript.google_meet_link!, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3" />
                              Lien Google Meet
                            </Button>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="transcript" className="mt-4">
                        {renderTranscriptText(transcript)}
                      </TabsContent>

                      <TabsContent value="analyse" className="mt-4 space-y-4">
                        {/* Points clés */}
                        {transcript.key_points && transcript.key_points.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              Points clés
                            </h4>
                            <ul className="space-y-1">
                              {transcript.key_points.map((point, index) => (
                                <li key={index} className="text-sm pl-4 border-l-2 border-green-200 py-1">
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Objections détectées */}
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                            Objections détectées
                          </h4>
                          {renderObjections(transcript.objections_detected)}
                        </div>

                        {/* Prochaines actions */}
                        {transcript.next_actions && transcript.next_actions.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                              <Target className="w-4 h-4 text-blue-500" />
                              Prochaines actions
                            </h4>
                            <ul className="space-y-1">
                              {transcript.next_actions.map((action, index) => (
                                <li key={index} className="text-sm pl-4 border-l-2 border-blue-200 py-1">
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* PDF Report si disponible */}
                        {transcript.pdf_url && (
                          <div className="pt-3 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => window.open(transcript.pdf_url!, '_blank')}
                            >
                              <FileText className="w-3 h-3" />
                              Télécharger le rapport PDF
                            </Button>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}