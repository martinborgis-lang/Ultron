'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Clock,
  Activity,
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

const formVariants = {
  hidden: { opacity: 0, height: 0, marginBottom: 0 },
  visible: {
    opacity: 1,
    height: 'auto',
    marginBottom: 16,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
    transition: {
      duration: 0.2,
    },
  },
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
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold">Historique</h3>
          {activities.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {activities.length}
            </span>
          )}
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className={cn('w-4 h-4 mr-1 transition-transform', showForm && 'rotate-45')} />
            Activite
          </Button>
        </motion.div>
      </div>

      {/* Add Activity Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            variants={formVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Card className="p-4 border-dashed border-primary/30 bg-primary/5">
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
                  className="resize-none"
                />

                {['call', 'meeting'].includes(newActivity.type) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex gap-2"
                  >
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
                  </motion.div>
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line with gradient */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-border to-transparent" />

        {activities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 text-muted-foreground"
          >
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p>Aucune activite enregistree</p>
            <p className="text-xs mt-1">Ajoutez une activite pour commencer</p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-1"
          >
            {activities.map((activity, index) => {
              const Icon = activityIcons[activity.type] || FileText;
              const isLast = index === activities.length - 1;

              return (
                <motion.div
                  key={activity.id}
                  variants={itemVariants}
                  className={cn(
                    'relative flex gap-4 pl-1 group',
                    'hover:bg-muted/30 rounded-lg p-2 -ml-2 transition-colors'
                  )}
                >
                  {/* Icon with pulse effect */}
                  <div className="relative">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center border z-10 transition-all',
                        activityColors[activity.type] || 'bg-muted',
                        'group-hover:shadow-lg'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </motion.div>
                    {/* Connecting line to next item */}
                    {!isLast && (
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-px h-full bg-border" />
                    )}
                  </div>

                  {/* Content Card */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {activity.subject || activityLabels[activity.type]}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(activity.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                          {activity.user?.full_name && (
                            <>
                              <span className="text-muted-foreground/50">•</span>
                              {activity.user.full_name}
                            </>
                          )}
                        </p>
                      </div>
                      {activity.outcome && (
                        <motion.span
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0',
                            activity.outcome === 'positive' && 'bg-green-500/20 text-green-400 border border-green-500/30',
                            activity.outcome === 'neutral' && 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
                            activity.outcome === 'negative' && 'bg-red-500/20 text-red-400 border border-red-500/30',
                            activity.outcome === 'no_answer' && 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
                            activity.outcome === 'voicemail' && 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          )}
                        >
                          {activity.outcome === 'positive' ? 'Positif' :
                           activity.outcome === 'negative' ? 'Negatif' :
                           activity.outcome === 'no_answer' ? 'Pas de reponse' :
                           activity.outcome === 'voicemail' ? 'Messagerie' : 'Neutre'}
                        </motion.span>
                      )}
                    </div>
                    {activity.content && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap bg-muted/30 p-2 rounded-lg"
                      >
                        {activity.content}
                      </motion.p>
                    )}
                    {activity.duration_minutes && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Duree: {activity.duration_minutes} min
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
