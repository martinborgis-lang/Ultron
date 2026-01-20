'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, List, Calendar, CheckCircle2, Circle, Clock, User, Video, ExternalLink, X, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanningEvent {
  id: string;
  type: 'task' | 'call' | 'meeting' | 'reminder' | 'email';
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  allDay: boolean;
  status: 'pending' | 'completed' | 'cancelled';
  completedAt?: string;
  prospectId?: string;
  prospectName?: string;
  assignedToName?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  meetLink?: string;
  calendarLink?: string;
  createdAt: string;
}

export default function PlanningPage() {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [events, setEvents] = useState<PlanningEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'overdue' | 'today' | 'upcoming' | 'all'>('today');
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PlanningEvent | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [filter, view]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // En vue calendrier, on charge tous les événements pour avoir une vue globale
      // En vue liste, on applique le filtre sélectionné
      const activeFilter = view === 'calendar' ? 'all' : filter;
      const res = await fetch(`/api/planning?filter=${activeFilter}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Erreur fetch events:', error);
    }
    setLoading(false);
  };

  const handleComplete = async (id: string, completed: boolean) => {
    try {
      await fetch(`/api/planning/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: completed ? 'completed' : 'pending',
          completed_at: completed ? new Date().toISOString() : null
        }),
      });
      fetchEvents();
    } catch (error) {
      console.error('Erreur update:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette tâche ?')) return;
    try {
      await fetch(`/api/planning/${id}`, { method: 'DELETE' });
      fetchEvents();
    } catch (error) {
      console.error('Erreur delete:', error);
    }
  };

  // Grouper par date
  const groupedEvents = events.reduce((acc, event) => {
    const date = event.dueDate?.split('T')[0] || event.startDate?.split('T')[0] || 'Sans date';
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, PlanningEvent[]>);

  const formatDateHeader = (dateStr: string) => {
    if (dateStr === 'Sans date') return dateStr;
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === tomorrow.toDateString()) return 'Demain';

    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const isOverdue = (event: PlanningEvent) => {
    if (event.status === 'completed') return false;
    const dueDate = event.dueDate || event.startDate;
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return '📞';
      case 'meeting': return '📅';
      case 'email': return '✉️';
      case 'reminder': return '⏰';
      default: return '✓';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400';
      case 'medium': return 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Planning</h1>

        <div className="flex items-center gap-3">
          {/* Toggle Vue */}
          <div className="flex items-center bg-muted p-1 rounded-lg">
            <button
              onClick={() => setView('list')}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                view === 'list'
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-4 w-4" />
              Liste
            </button>
            <button
              onClick={() => setView('calendar')}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                view === 'calendar'
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Calendar className="h-4 w-4" />
              Calendrier
            </button>
          </div>

          <Button onClick={() => setShowNewForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle tâche
          </Button>
        </div>
      </div>

      {/* Filtres (vue liste) */}
      {view === 'list' && (
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'overdue' as const, label: 'En retard', count: events.filter(e => isOverdue(e)).length },
            { key: 'today' as const, label: "Aujourd'hui" },
            { key: 'upcoming' as const, label: 'À venir' },
            { key: 'all' as const, label: 'Tout' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                filter === f.key
                  ? "bg-indigo-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {f.label}
              {f.count !== undefined && f.count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Contenu */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : view === 'list' ? (
        /* VUE LISTE */
        <div className="space-y-6">
          {Object.entries(groupedEvents)
            .sort(([a], [b]) => {
              if (a === 'Sans date') return 1;
              if (b === 'Sans date') return -1;
              return new Date(a).getTime() - new Date(b).getTime();
            })
            .map(([date, dayEvents]) => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {formatDateHeader(date)}
                </h3>
                <div className="space-y-2">
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-all",
                        event.status === 'completed'
                          ? "bg-muted/50 border-border"
                          : isOverdue(event)
                            ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900"
                            : "bg-card border-border hover:shadow-sm"
                      )}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => handleComplete(event.id, event.status !== 'completed')}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {event.status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground hover:text-indigo-500" />
                        )}
                      </button>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{getTypeIcon(event.type)}</span>
                          <span className={cn(
                            "font-medium text-foreground",
                            event.status === 'completed' && "line-through text-muted-foreground"
                          )}>
                            {event.title}
                          </span>
                          {event.priority !== 'medium' && (
                            <span className={cn(
                              "px-2 py-0.5 text-xs rounded-full font-medium capitalize",
                              getPriorityColor(event.priority)
                            )}>
                              {event.priority}
                            </span>
                          )}
                        </div>

                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {event.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          {event.prospectName && (
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {event.prospectName}
                            </span>
                          )}
                          {(event.startDate || event.dueDate) && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(event.startDate || event.dueDate!).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="text-muted-foreground hover:text-red-500 p-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {events.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Aucune tâche pour ce filtre
            </div>
          )}
        </div>
      ) : (
        /* VUE CALENDRIER */
        <CalendarView events={events} onSelect={setSelectedEvent} />
      )}

      {/* Modal nouvelle tâche */}
      {showNewForm && (
        <NewEventModal
          onClose={() => setShowNewForm(false)}
          onCreated={() => {
            setShowNewForm(false);
            fetchEvents();
          }}
        />
      )}

      {/* Modal détail événement */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onComplete={(completed) => {
            handleComplete(selectedEvent.id, completed);
            setSelectedEvent(null);
          }}
          onDelete={() => {
            handleDelete(selectedEvent.id);
            setSelectedEvent(null);
          }}
          onUpdate={fetchEvents}
        />
      )}
    </div>
  );
}

// Composant Vue Calendrier
function CalendarView({
  events,
  onSelect
}: {
  events: PlanningEvent[];
  onSelect: (event: PlanningEvent) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Obtenir les jours de la semaine
  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + 1); // Lundi

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays(currentDate);
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8h à 19h

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const getEventsForDayAndHour = (day: Date, hour: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate || event.dueDate || '');
      return (
        eventDate.toDateString() === day.toDateString() &&
        eventDate.getHours() === hour
      );
    });
  };

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Navigation */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Button variant="outline" onClick={() => navigateWeek(-1)}>
          ← Semaine précédente
        </Button>
        <span className="font-medium text-foreground">
          {weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          {' - '}
          {weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <Button variant="outline" onClick={() => navigateWeek(1)}>
          Semaine suivante →
        </Button>
      </div>

      {/* Grille calendrier */}
      <div className="overflow-x-auto">
        {/* Headers jours */}
        <div className="grid grid-cols-8 border-b border-border min-w-[800px]">
          <div className="p-2 text-center border-r border-border" />
          {weekDays.map(day => (
            <div
              key={day.toISOString()}
              className={cn(
                "p-2 text-center border-r last:border-r-0 border-border",
                isToday(day) && "bg-indigo-50 dark:bg-indigo-950/30"
              )}
            >
              <div className="text-xs text-muted-foreground uppercase">
                {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
              </div>
              <div className="text-lg font-semibold text-foreground">
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Grille heures */}
        <div className="min-w-[800px]">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b border-border last:border-b-0">
              {/* Heure */}
              <div className="p-2 text-xs text-muted-foreground border-r border-border text-right pr-3">
                {hour}:00
              </div>

              {/* Cellules par jour */}
              {weekDays.map(day => {
                const dayEvents = getEventsForDayAndHour(day, hour);
                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className={cn(
                      "min-h-[50px] border-r last:border-r-0 border-border p-1",
                      isToday(day) && "bg-indigo-50/50 dark:bg-indigo-950/20"
                    )}
                  >
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        onClick={() => onSelect(event)}
                        className={cn(
                          "text-xs p-1.5 rounded mb-1 cursor-pointer truncate flex items-center gap-1",
                          event.status === 'completed'
                            ? "bg-muted text-muted-foreground line-through"
                            : event.type === 'meeting'
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900"
                              : event.type === 'call'
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900"
                                : "bg-muted text-foreground hover:bg-muted/80"
                        )}
                        title={event.title}
                      >
                        {event.meetLink && <Video className="h-3 w-3 flex-shrink-0" />}
                        <span className="truncate">{event.title}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Modal création tâche
function NewEventModal({
  onClose,
  onCreated
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'task',
    title: '',
    description: '',
    dueDate: '',
    dueTime: '',
    priority: 'medium',
    prospectId: '',
    meetLink: '',
  });
  const [prospects, setProspects] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    // Charger les prospects pour le select
    fetch('/api/sheets/prospects')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProspects(data.map((p: { id?: string; prenom?: string; nom?: string }) => ({
            id: p.id || '',
            name: `${p.prenom || ''} ${p.nom || ''}`.trim()
          })).filter((p: { id: string; name: string }) => p.name));
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dueDateTime = formData.dueDate && formData.dueTime
        ? `${formData.dueDate}T${formData.dueTime}:00`
        : formData.dueDate
          ? `${formData.dueDate}T09:00:00`
          : null;

      await fetch('/api/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          title: formData.title,
          description: formData.description,
          due_date: dueDateTime,
          start_date: formData.type === 'meeting' ? dueDateTime : null,
          priority: formData.priority,
          prospect_id: formData.prospectId || null,
          meet_link: formData.type === 'meeting' ? formData.meetLink || null : null,
        }),
      });

      onCreated();
    } catch (error) {
      console.error('Erreur création:', error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl p-6 w-full max-w-md shadow-xl border border-border">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Nouvelle tâche</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Type</label>
            <select
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
            >
              <option value="task">✓ Tâche</option>
              <option value="call">📞 Appel</option>
              <option value="meeting">📅 RDV</option>
              <option value="email">✉️ Email</option>
            </select>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Titre *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="Ex: Rappeler Jean Dupont"
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
            />
          </div>

          {/* Date et Heure */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData({...formData, dueDate: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Heure</label>
              <input
                type="time"
                value={formData.dueTime}
                onChange={e => setFormData({...formData, dueTime: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
              />
            </div>
          </div>

          {/* Priorité */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Priorité</label>
            <select
              value={formData.priority}
              onChange={e => setFormData({...formData, priority: e.target.value})}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
            >
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          {/* Prospect lié */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Prospect lié</label>
            <select
              value={formData.prospectId}
              onChange={e => setFormData({...formData, prospectId: e.target.value})}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
            >
              <option value="">Aucun</option>
              {prospects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Lien Google Meet (pour les meetings) */}
          {formData.type === 'meeting' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Lien Google Meet
              </label>
              <input
                type="url"
                value={formData.meetLink || ''}
                onChange={e => setFormData({...formData, meetLink: e.target.value})}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Collez le lien de votre Google Meet ici
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal détail d'événement
function EventDetailModal({
  event,
  onClose,
  onComplete,
  onDelete,
  onUpdate
}: {
  event: PlanningEvent;
  onClose: () => void;
  onComplete: (completed: boolean) => void;
  onDelete: () => void;
  onUpdate: () => void;
}) {
  const [meetLink, setMeetLink] = useState(event.meetLink || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prospectInfo, setProspectInfo] = useState<{
    email?: string;
    phone?: string;
    patrimoine?: string;
    revenus?: string;
    besoins?: string;
    qualification?: string;
  } | null>(null);

  // Charger les infos du prospect si lié
  useEffect(() => {
    if (event.prospectId) {
      fetch(`/api/prospects/unified/${event.prospectId}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setProspectInfo({
              email: data.email,
              phone: data.phone,
              patrimoine: data.patrimoine || data.patrimoineEstime,
              revenus: data.revenusMensuels || data.revenus,
              besoins: data.besoins,
              qualification: data.qualification,
            });
          }
        })
        .catch(() => {});
    }
  }, [event.prospectId]);

  const handleSaveMeetLink = async () => {
    setSaving(true);
    try {
      await fetch(`/api/planning/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meet_link: meetLink }),
      });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    }
    setSaving(false);
  };

  const handleLaunchMeet = () => {
    if (meetLink) {
      window.open(meetLink, '_blank');
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'Non défini';
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'meeting': return '📅 RDV';
      case 'call': return '📞 Appel';
      case 'email': return '✉️ Email';
      case 'reminder': return '⏰ Rappel';
      default: return '✓ Tâche';
    }
  };

  const getQualificationColor = (qual?: string) => {
    switch (qual?.toUpperCase()) {
      case 'CHAUD': return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400';
      case 'TIEDE': return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400';
      case 'FROID': return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl w-full max-w-lg shadow-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
          <div className="flex items-center gap-3">
            <span className="text-xl">{getTypeLabel(event.type).split(' ')[0]}</span>
            <div>
              <h2 className="font-semibold text-foreground">{event.title}</h2>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(event.startDate || event.dueDate)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Bouton lancer le meeting (si c'est un RDV) */}
          {event.type === 'meeting' && (
            <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              {meetLink && !isEditing ? (
                <div className="space-y-3">
                  <button
                    onClick={handleLaunchMeet}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Play className="h-5 w-5" />
                    Lancer le meeting Google Meet
                  </button>
                  <div className="flex items-center justify-between text-sm">
                    <a
                      href={meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 truncate max-w-[80%]"
                    >
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      {meetLink}
                    </a>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-muted-foreground hover:text-foreground text-xs"
                    >
                      Modifier
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Lien Google Meet
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={meetLink}
                      onChange={e => setMeetLink(e.target.value)}
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      className="flex-1 px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm placeholder:text-muted-foreground"
                    />
                    <Button
                      onClick={handleSaveMeetLink}
                      disabled={saving}
                      size="sm"
                    >
                      {saving ? '...' : 'OK'}
                    </Button>
                    {isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMeetLink(event.meetLink || '');
                          setIsEditing(false);
                        }}
                      >
                        Annuler
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Collez le lien de votre Google Meet pour pouvoir le lancer d&apos;ici
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Infos prospect */}
          {event.prospectName && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Prospect: {event.prospectName}
                {prospectInfo?.qualification && (
                  <span className={cn(
                    "px-2 py-0.5 text-xs rounded-full font-medium",
                    getQualificationColor(prospectInfo.qualification)
                  )}>
                    {prospectInfo.qualification}
                  </span>
                )}
              </h3>

              {prospectInfo && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {prospectInfo.email && (
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="text-foreground">{prospectInfo.email}</p>
                    </div>
                  )}
                  {prospectInfo.phone && (
                    <div>
                      <span className="text-muted-foreground">Téléphone:</span>
                      <p className="text-foreground">{prospectInfo.phone}</p>
                    </div>
                  )}
                  {prospectInfo.revenus && (
                    <div>
                      <span className="text-muted-foreground">Revenus:</span>
                      <p className="text-foreground">{prospectInfo.revenus}€</p>
                    </div>
                  )}
                  {prospectInfo.patrimoine && (
                    <div>
                      <span className="text-muted-foreground">Patrimoine:</span>
                      <p className="text-foreground">{prospectInfo.patrimoine}€</p>
                    </div>
                  )}
                  {prospectInfo.besoins && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Besoins:</span>
                      <p className="text-foreground">{prospectInfo.besoins}</p>
                    </div>
                  )}
                </div>
              )}

              {event.prospectId && (
                <a
                  href={`/prospects/${event.prospectId}`}
                  className="text-indigo-600 hover:text-indigo-700 text-sm mt-3 inline-flex items-center gap-1"
                >
                  Voir la fiche complète
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
              <p className="text-foreground">{event.description}</p>
            </div>
          )}

          {/* Statut */}
          <div className="flex items-center gap-4 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              {event.status === 'completed' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">
                {event.status === 'completed' ? 'Terminé' : 'En cours'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          >
            Supprimer
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onComplete(event.status !== 'completed')}
            >
              {event.status === 'completed' ? 'Marquer non terminé' : 'Marquer terminé'}
            </Button>
            <Button onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
