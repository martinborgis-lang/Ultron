'use client';

import { useState, useEffect } from 'react';
import { FileText, Clock, User, Calendar, ChevronRight, Download, Trash2, Search, X, Bot } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import type { TranscriptSegment, ObjectionDetected } from '@/types/meeting';

interface MeetingTranscriptItem {
  id: string;
  prospect_id: string | null;
  user_id: string;
  meeting_date: string;
  duration_seconds: number | null;
  ai_summary: string | null;
  key_points: string[] | null;
  next_actions: string[] | null;
  pdf_url: string | null;
  google_meet_link: string | null;
  created_at: string;
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

interface MeetingTranscriptDetail extends MeetingTranscriptItem {
  transcript_text: string | null;
  transcript_json: TranscriptSegment[] | null;
  objections_detected: ObjectionDetected[] | null;
}

export default function MeetingsPage() {
  const [transcripts, setTranscripts] = useState<MeetingTranscriptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTranscript, setSelectedTranscript] = useState<MeetingTranscriptDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // États pour les modales
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    const fetchTranscripts = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/meeting/transcripts');
        if (res.ok) {
          const data = await res.json();
          setTranscripts(data.transcripts || []);
        }
      } catch (error) {
        console.error('Error fetching transcripts:', error);
      }
      setLoading(false);
    };

    fetchTranscripts();
  }, []);

  const loadTranscriptDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/meeting/transcripts/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTranscript(data.transcript);
      }
    } catch (error) {
      console.error('Error loading transcript detail:', error);
    }
    setLoadingDetail(false);
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await fetch(`/api/meeting/transcripts/${deleteTarget}`, { method: 'DELETE' });
      setTranscripts(prev => prev.filter(t => t.id !== deleteTarget));
      if (selectedTranscript?.id === deleteTarget) {
        setSelectedTranscript(null);
      }
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting transcript:', error);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredTranscripts = transcripts.filter(t => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const prospectName = `${t.crm_prospects?.first_name || ''} ${t.crm_prospects?.last_name || ''}`.toLowerCase();
    const summary = (t.ai_summary || '').toLowerCase();
    return prospectName.includes(query) || summary.includes(query);
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transcriptions RDV</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Historique des reunions enregistrees avec transcription
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher par prospect ou contenu..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : filteredTranscripts.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {searchQuery ? 'Aucun resultat' : 'Aucune transcription'}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? 'Essayez avec d\'autres termes de recherche.'
              : 'Les transcriptions de vos RDV Google Meet apparaitront ici.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* List */}
          <div className="space-y-3">
            {filteredTranscripts.map(transcript => (
              <div
                key={transcript.id}
                onClick={() => loadTranscriptDetail(transcript.id)}
                className={cn(
                  "p-4 rounded-xl border cursor-pointer transition-all",
                  selectedTranscript?.id === transcript.id
                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30"
                    : "border-border bg-card hover:border-indigo-300 hover:shadow-sm"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Prospect name */}
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-foreground truncate">
                        {transcript.crm_prospects
                          ? `${transcript.crm_prospects.first_name} ${transcript.crm_prospects.last_name}`
                          : 'Prospect inconnu'}
                      </span>
                    </div>

                    {/* Date and duration */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(transcript.meeting_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDuration(transcript.duration_seconds)}
                      </span>
                    </div>

                    {/* Summary preview */}
                    {transcript.ai_summary && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {transcript.ai_summary}
                      </p>
                    )}
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  <a
                    href={`/api/meeting/transcripts/${transcript.id}/pdf`}
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800/30"
                  >
                    <Download className="h-3 w-3" />
                    PDF
                  </a>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDelete(transcript.id);
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded ml-auto"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          <div className="lg:sticky lg:top-6">
            {loadingDetail ? (
              <div className="bg-card border border-border rounded-xl p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : selectedTranscript ? (
              <TranscriptDetailPanel
                transcript={selectedTranscript}
                onClose={() => setSelectedTranscript(null)}
              />
            ) : (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Selectionnez une transcription pour voir les details
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modale de confirmation de suppression */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Supprimer la transcription"
        description="Êtes-vous sûr de vouloir supprimer cette transcription de réunion ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}

interface ConsolidatedSegment {
  speaker: string;
  text: string;
  startTimestamp: number;
}

/**
 * Consolidate consecutive segments from the same speaker
 */
function consolidateSegments(segments: TranscriptSegment[]): ConsolidatedSegment[] {
  if (!segments || segments.length === 0) return [];

  const consolidated: ConsolidatedSegment[] = [];
  let current: ConsolidatedSegment | null = null;
  let lastTimestamp = 0;

  for (const segment of segments) {
    if (!current) {
      current = {
        speaker: segment.speaker,
        text: segment.text,
        startTimestamp: segment.timestamp,
      };
      lastTimestamp = segment.timestamp;
    } else if (current.speaker === segment.speaker) {
      // Same speaker - append text
      const timeDiff = segment.timestamp - lastTimestamp;
      // If pause is more than 3 seconds, add a period
      if (timeDiff > 3) {
        current.text = current.text.trim();
        if (!current.text.endsWith('.') && !current.text.endsWith('?') && !current.text.endsWith('!')) {
          current.text += '.';
        }
        current.text += ' ' + segment.text;
      } else {
        // Short pause - just add space
        current.text += ' ' + segment.text;
      }
      lastTimestamp = segment.timestamp;
    } else {
      // Different speaker - save current and start new
      current.text = current.text.trim();
      if (!current.text.endsWith('.') && !current.text.endsWith('?') && !current.text.endsWith('!')) {
        current.text += '.';
      }
      consolidated.push(current);
      current = {
        speaker: segment.speaker,
        text: segment.text,
        startTimestamp: segment.timestamp,
      };
      lastTimestamp = segment.timestamp;
    }
  }

  // Don't forget the last segment
  if (current) {
    current.text = current.text.trim();
    if (!current.text.endsWith('.') && !current.text.endsWith('?') && !current.text.endsWith('!')) {
      current.text += '.';
    }
    consolidated.push(current);
  }

  return consolidated;
}

function TranscriptDetailPanel({
  transcript,
  onClose,
}: {
  transcript: MeetingTranscriptDetail;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'actions'>('summary');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Consolidate transcript segments
  const consolidatedSegments = transcript.transcript_json
    ? consolidateSegments(transcript.transcript_json)
    : [];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">
            {transcript.crm_prospects
              ? `${transcript.crm_prospects.first_name} ${transcript.crm_prospects.last_name}`
              : 'Transcription'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {new Date(transcript.meeting_date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-muted rounded">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {[
          { key: 'summary' as const, label: 'Resume' },
          { key: 'transcript' as const, label: 'Transcription' },
          { key: 'actions' as const, label: 'Actions' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-[60vh] overflow-y-auto">
        {activeTab === 'summary' && (
          <div className="space-y-5">
            {/* Ultron Analysis Header */}
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Bot className="h-5 w-5 text-indigo-600" />
              <h4 className="font-semibold text-foreground">Analyse Ultron</h4>
            </div>

            {/* AI Summary */}
            {transcript.ai_summary ? (
              <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                <h5 className="text-sm font-medium text-indigo-600 mb-2">
                  Resume de la reunion
                </h5>
                <p className="text-foreground leading-relaxed">{transcript.ai_summary}</p>
              </div>
            ) : (
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-muted-foreground">Aucune analyse disponible pour cette reunion</p>
              </div>
            )}

            {/* Key Points */}
            {transcript.key_points && transcript.key_points.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Points cles identifies
                </h5>
                <ul className="space-y-2 bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                  {transcript.key_points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-foreground">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Objections */}
            {transcript.objections_detected && transcript.objections_detected.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <span className="text-red-500">⚠</span>
                  Objections detectees
                </h5>
                <div className="space-y-3">
                  {transcript.objections_detected.map((obj, i) => (
                    <div key={i} className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 border border-red-200 dark:border-red-800">
                      <p className="text-foreground font-medium">{obj.objection}</p>
                      {obj.suggested_response && (
                        <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-700">
                          <p className="text-sm">
                            <span className="text-green-600 font-medium">Reponse suggeree:</span>
                            <span className="text-muted-foreground ml-1">{obj.suggested_response}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No data state */}
            {!transcript.ai_summary &&
             (!transcript.key_points || transcript.key_points.length === 0) &&
             (!transcript.objections_detected || transcript.objections_detected.length === 0) && (
              <div className="text-center py-6 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>L&apos;analyse IA n&apos;est pas disponible pour cette reunion</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transcript' && (
          <div className="space-y-4">
            {consolidatedSegments.length > 0 ? (
              consolidatedSegments.map((segment, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-lg p-3",
                    segment.speaker === 'advisor'
                      ? "bg-indigo-50 dark:bg-indigo-950/30 border-l-4 border-indigo-500"
                      : "bg-green-50 dark:bg-green-950/30 border-l-4 border-green-500"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "text-xs font-semibold uppercase",
                      segment.speaker === 'advisor' ? "text-indigo-600" : "text-green-600"
                    )}>
                      {segment.speaker === 'advisor' ? 'Conseiller' : 'Prospect'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(segment.startTimestamp)}
                    </span>
                  </div>
                  <p className="text-foreground leading-relaxed">{segment.text}</p>
                </div>
              ))
            ) : transcript.transcript_text ? (
              <p className="text-foreground whitespace-pre-wrap">{transcript.transcript_text}</p>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Aucune transcription disponible
              </p>
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-4">
            {/* Next Actions */}
            {transcript.next_actions && transcript.next_actions.length > 0 ? (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Prochaines actions
                </h4>
                <ul className="space-y-2">
                  {transcript.next_actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1 rounded border-input"
                      />
                      <span className="text-foreground">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Aucune action suggeree
              </p>
            )}

            {/* Links */}
            <div className="pt-4 border-t border-border space-y-2">
              <a
                href={`/api/meeting/transcripts/${transcript.id}/pdf`}
                className="flex items-center gap-2 w-full px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800/30 text-indigo-600 font-medium"
              >
                <Download className="h-4 w-4" />
                Telecharger le rapport PDF
              </a>

              {transcript.crm_prospects && (
                <a
                  href={`/prospects/${transcript.crm_prospects.id}`}
                  className="flex items-center gap-2 w-full px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 text-foreground"
                >
                  <User className="h-4 w-4" />
                  Voir la fiche prospect
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
