'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Phone,
  PhoneCall,
  Clock,
  User,
  Search,
  Filter,
  Download,
  PlayCircle,
  FileText,
  Brain,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface VoiceCall {
  id: string;
  twilio_call_sid: string;
  prospect_id?: string;
  prospect_name?: string;
  phone_number: string;
  direction: 'inbound' | 'outbound';
  status: string;
  outcome?: string;
  duration_seconds?: number;
  recording_url?: string;
  transcript?: string;
  ai_summary?: string;
  ai_key_points?: string[];
  ai_next_actions?: string[];
  ai_objections?: string[];
  ai_outcome?: string;
  sentiment_overall?: 'positive' | 'negative' | 'neutral';
  sentiment_score?: number;
  notes?: string;
  created_at: string;
  started_at?: string;
  ended_at?: string;
  user_id: string;
  user_name?: string;
}

export function CallHistoryContent() {
  const [calls, setCalls] = useState<VoiceCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCall, setSelectedCall] = useState<VoiceCall | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [statsData, setStatsData] = useState({
    total_calls: 0,
    total_duration: 0,
    avg_duration: 0,
    successful_calls: 0,
    conversion_rate: 0
  });

  useEffect(() => {
    fetchCallHistory();
    fetchCallStats();
  }, []);

  const fetchCallHistory = async () => {
    try {
      const response = await fetch('/api/voice/calls');
      if (!response.ok) throw new Error('Erreur récupération données');

      const data = await response.json();
      setCalls(data.calls || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCallStats = async () => {
    try {
      const response = await fetch('/api/voice/calls/stats');
      if (!response.ok) throw new Error('Erreur récupération stats');

      const data = await response.json();
      setStatsData(data);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const filteredCalls = calls.filter(call =>
    call.prospect_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.phone_number.includes(searchTerm) ||
    call.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { variant: any; label: string } } = {
      'completed': { variant: 'default', label: 'Terminé' },
      'failed': { variant: 'destructive', label: 'Échec' },
      'busy': { variant: 'secondary', label: 'Occupé' },
      'no-answer': { variant: 'secondary', label: 'Pas de réponse' },
      'canceled': { variant: 'outline', label: 'Annulé' }
    };

    const config = statusConfig[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getOutcomeBadge = (outcome?: string) => {
    if (!outcome) return null;

    const outcomeConfig: { [key: string]: { variant: any; label: string } } = {
      'rdv_pris': { variant: 'default', label: 'RDV pris' },
      'callback_demande': { variant: 'secondary', label: 'Callback' },
      'pas_interesse': { variant: 'destructive', label: 'Pas intéressé' },
      'information_demandee': { variant: 'outline', label: 'Info demandée' },
      'injoignable': { variant: 'secondary', label: 'Injoignable' }
    };

    const config = outcomeConfig[outcome] || { variant: 'outline', label: outcome };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getSentimentBadge = (sentiment?: string, score?: number) => {
    if (!sentiment) return null;

    const sentimentConfig: { [key: string]: { variant: any; label: string } } = {
      'positive': { variant: 'default', label: 'Positif' },
      'neutral': { variant: 'secondary', label: 'Neutre' },
      'negative': { variant: 'destructive', label: 'Négatif' }
    };

    const config = sentimentConfig[sentiment];
    return config ? (
      <Badge variant={config.variant} title={score ? `Score: ${score.toFixed(2)}` : undefined}>
        {config.label}
      </Badge>
    ) : null;
  };

  const playRecording = async (call: VoiceCall) => {
    if (!call.recording_url) return;

    try {
      setAudioUrl(call.recording_url);
    } catch (error) {
      console.error('Erreur lecture audio:', error);
    }
  };

  const exportTranscript = (call: VoiceCall) => {
    if (!call.transcript) return;

    const content = `
TRANSCRIPT D'APPEL
==================

Prospect: ${call.prospect_name || 'Inconnu'}
Téléphone: ${call.phone_number}
Date: ${new Date(call.created_at).toLocaleDateString('fr-FR')}
Durée: ${formatDuration(call.duration_seconds)}
Résultat: ${call.ai_outcome || call.outcome || 'N/A'}

TRANSCRIPTION:
${call.transcript}

${call.ai_summary ? `\nRÉSUMÉ IA:\n${call.ai_summary}` : ''}

${call.ai_key_points?.length ? `\nPOINTS CLÉS:\n${call.ai_key_points.map(point => `- ${point}`).join('\n')}` : ''}

${call.ai_next_actions?.length ? `\nPROCHAINES ACTIONS:\n${call.ai_next_actions.map(action => `- ${action}`).join('\n')}` : ''}

${call.notes ? `\nNOTES:\n${call.notes}` : ''}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transcript_${call.prospect_name || 'appel'}_${new Date(call.created_at).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total appels</p>
                <p className="text-2xl font-bold">{statsData.total_calls}</p>
              </div>
              <Phone className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Durée totale</p>
                <p className="text-2xl font-bold">{formatDuration(statsData.total_duration)}</p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Durée moyenne</p>
                <p className="text-2xl font-bold">{formatDuration(statsData.avg_duration)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux succès</p>
                <p className="text-2xl font-bold">{Math.round(statsData.conversion_rate)}%</p>
              </div>
              <PhoneCall className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche et filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, téléphone ou notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-1" />
              Filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des appels */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des appels</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prospect</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Résultat</TableHead>
                <TableHead>Sentiment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCalls.map((call) => (
                <TableRow key={call.id} className="cursor-pointer" onClick={() => setSelectedCall(call)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="font-medium">{call.prospect_name || 'Inconnu'}</p>
                        <p className="text-sm text-muted-foreground">{call.phone_number}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{new Date(call.created_at).toLocaleDateString('fr-FR')}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(call.created_at), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{formatDuration(call.duration_seconds)}</TableCell>
                  <TableCell>{getStatusBadge(call.status)}</TableCell>
                  <TableCell>{getOutcomeBadge(call.ai_outcome || call.outcome)}</TableCell>
                  <TableCell>{getSentimentBadge(call.sentiment_overall, call.sentiment_score)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {call.recording_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            playRecording(call);
                          }}
                        >
                          <PlayCircle size={14} />
                        </Button>
                      )}
                      {call.transcript && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportTranscript(call);
                          }}
                        >
                          <Download size={14} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCalls.length === 0 && (
            <div className="text-center py-8">
              <Phone className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Aucun appel trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog détail appel */}
      {selectedCall && (
        <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone size={20} />
                Détail de l'appel - {selectedCall.prospect_name || 'Inconnu'}
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                {selectedCall.transcript && <TabsTrigger value="transcript">Transcription</TabsTrigger>}
                {selectedCall.ai_summary && <TabsTrigger value="ai-analysis">Analyse IA</TabsTrigger>}
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">Informations générales</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Prospect:</span> {selectedCall.prospect_name || 'Inconnu'}</div>
                        <div><span className="font-medium">Téléphone:</span> {selectedCall.phone_number}</div>
                        <div><span className="font-medium">Date:</span> {new Date(selectedCall.created_at).toLocaleString('fr-FR')}</div>
                        <div><span className="font-medium">Durée:</span> {formatDuration(selectedCall.duration_seconds)}</div>
                        <div><span className="font-medium">Statut:</span> {getStatusBadge(selectedCall.status)}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">Résultats</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Outcome:</span> {getOutcomeBadge(selectedCall.ai_outcome || selectedCall.outcome)}</div>
                        <div><span className="font-medium">Sentiment:</span> {getSentimentBadge(selectedCall.sentiment_overall, selectedCall.sentiment_score)}</div>
                        {selectedCall.notes && (
                          <div className="mt-3">
                            <span className="font-medium">Notes:</span>
                            <p className="mt-1 text-muted-foreground">{selectedCall.notes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {selectedCall.recording_url && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">Enregistrement</h3>
                      {audioUrl && (
                        <audio controls className="w-full">
                          <source src={audioUrl} type="audio/mpeg" />
                          Votre navigateur ne supporte pas l'audio HTML5.
                        </audio>
                      )}
                      {!audioUrl && (
                        <Button onClick={() => playRecording(selectedCall)}>
                          <PlayCircle size={16} className="mr-1" />
                          Écouter l'enregistrement
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {selectedCall.transcript && (
                <TabsContent value="transcript">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold">Transcription</h3>
                        <Button variant="outline" size="sm" onClick={() => exportTranscript(selectedCall)}>
                          <Download size={14} className="mr-1" />
                          Exporter
                        </Button>
                      </div>
                      <ScrollArea className="h-96 w-full">
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedCall.transcript}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {selectedCall.ai_summary && (
                <TabsContent value="ai-analysis">
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <Brain size={16} />
                          Résumé IA
                        </h3>
                        <p className="text-sm leading-relaxed">{selectedCall.ai_summary}</p>
                      </CardContent>
                    </Card>

                    {selectedCall.ai_key_points?.length && (
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2">Points clés</h3>
                          <ul className="text-sm space-y-1">
                            {selectedCall.ai_key_points.map((point, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {selectedCall.ai_next_actions?.length && (
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <Calendar size={16} />
                            Prochaines actions recommandées
                          </h3>
                          <ul className="text-sm space-y-1">
                            {selectedCall.ai_next_actions.map((action, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-green-500 mt-1">→</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {selectedCall.ai_objections?.length && (
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2">Objections détectées</h3>
                          <ul className="text-sm space-y-1">
                            {selectedCall.ai_objections.map((objection, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">!</span>
                                <span>{objection}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}