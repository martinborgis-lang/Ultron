'use client';

import { useState } from 'react';
import { CrmActivity } from '@/types/crm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Phone,
  Calendar,
  FileText,
  CheckCircle,
  ArrowRight,
  Star,
  Plus,
  Send,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActivityTimelineProps {
  activities: CrmActivity[];
  prospectId: string;
  onActivityAdded: () => void;
}

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  call: Phone,
  meeting: Calendar,
  note: FileText,
  task_completed: CheckCircle,
  stage_change: ArrowRight,
  qualification: Star,
};

const activityColors: Record<string, string> = {
  email: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  call: 'bg-green-500/20 text-green-400 border-green-500/30',
  meeting: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  note: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  task_completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  stage_change: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  qualification: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

const activityLabels: Record<string, string> = {
  email: 'Email',
  call: 'Appel',
  meeting: 'Reunion',
  note: 'Note',
  task_completed: 'Tache completee',
  stage_change: 'Changement de stage',
  qualification: 'Qualification',
};

export function ActivityTimeline({ activities, prospectId, onActivityAdded }: ActivityTimelineProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: 'note',
    subject: '',
    content: '',
    outcome: '',
    duration_minutes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.content.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospect_id: prospectId,
          type: newActivity.type,
          subject: newActivity.subject || activityLabels[newActivity.type],
          content: newActivity.content,
          outcome: newActivity.outcome || null,
          duration_minutes: newActivity.duration_minutes ? parseInt(newActivity.duration_minutes) : null,
          direction: ['email', 'call'].includes(newActivity.type) ? 'outbound' : null,
        }),
      });

      if (!response.ok) throw new Error('Erreur');

      setNewActivity({
        type: 'note',
        subject: '',
        content: '',
        outcome: '',
        duration_minutes: '',
      });
      setShowForm(false);
      onActivityAdded();
    } catch (error) {
      console.error('Error adding activity:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Historique</h3>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1" />
          Activite
        </Button>
      </div>

      {/* Add Activity Form */}
      {showForm && (
        <Card className="p-4 border-dashed">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <Select
                value={newActivity.type}
                onValueChange={(v) => setNewActivity({ ...newActivity, type: v })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="call">Appel</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Reunion</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Sujet (optionnel)"
                value={newActivity.subject}
                onChange={(e) => setNewActivity({ ...newActivity, subject: e.target.value })}
                className="flex-1"
              />
            </div>

            <Textarea
              placeholder="Contenu de l'activite..."
              value={newActivity.content}
              onChange={(e) => setNewActivity({ ...newActivity, content: e.target.value })}
              rows={3}
            />

            {['call', 'meeting'].includes(newActivity.type) && (
              <div className="flex gap-2">
                <Select
                  value={newActivity.outcome}
                  onValueChange={(v) => setNewActivity({ ...newActivity, outcome: v })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Resultat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positif</SelectItem>
                    <SelectItem value="neutral">Neutre</SelectItem>
                    <SelectItem value="negative">Negatif</SelectItem>
                    <SelectItem value="no_answer">Pas de reponse</SelectItem>
                    <SelectItem value="voicemail">Messagerie</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Duree (min)"
                  value={newActivity.duration_minutes}
                  onChange={(e) => setNewActivity({ ...newActivity, duration_minutes: e.target.value })}
                  className="w-32"
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
              <Button type="submit" size="sm" disabled={loading || !newActivity.content.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                Ajouter
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Timeline */}
      <div className="relative space-y-4">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune activite enregistree
          </div>
        ) : (
          activities.map((activity) => {
            const Icon = activityIcons[activity.type] || FileText;
            return (
              <div key={activity.id} className="relative flex gap-4 pl-1">
                {/* Icon */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center border z-10',
                    activityColors[activity.type] || 'bg-muted'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {activity.subject || activityLabels[activity.type]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                        {activity.user?.full_name && ` - ${activity.user.full_name}`}
                      </p>
                    </div>
                    {activity.outcome && (
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        activity.outcome === 'positive' && 'bg-green-500/20 text-green-400',
                        activity.outcome === 'neutral' && 'bg-gray-500/20 text-gray-400',
                        activity.outcome === 'negative' && 'bg-red-500/20 text-red-400'
                      )}>
                        {activity.outcome === 'positive' ? 'Positif' :
                         activity.outcome === 'negative' ? 'Negatif' :
                         activity.outcome === 'no_answer' ? 'Pas de reponse' :
                         activity.outcome === 'voicemail' ? 'Messagerie' : 'Neutre'}
                      </span>
                    )}
                  </div>
                  {activity.content && (
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                      {activity.content}
                    </p>
                  )}
                  {activity.duration_minutes && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Duree: {activity.duration_minutes} min
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
