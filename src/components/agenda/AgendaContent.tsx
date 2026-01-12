'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Trash2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  attendees?: { email: string }[];
}

type ViewType = 'day' | 'week' | 'month';

export function AgendaContent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('week');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const { organization } = useOrganization();

  // Form state
  const [newEvent, setNewEvent] = useState({
    summary: '',
    description: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '10:00',
    location: '',
    attendeeEmail: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    checkCalendarAccess();
  }, []);

  useEffect(() => {
    if (!needsReconnect) {
      fetchEvents();
    }
  }, [currentDate, view, needsReconnect]);

  const checkCalendarAccess = async () => {
    try {
      const response = await fetch('/api/google/check-scopes');
      const data = await response.json();

      if (data.needsReconnect || !data.hasCalendarScope) {
        setNeedsReconnect(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Erreur vérification scopes:', error);
    }
  };

  const getViewStart = (date: Date, viewType: ViewType): Date => {
    const start = new Date(date);
    if (viewType === 'day') {
      start.setHours(0, 0, 0, 0);
    } else if (viewType === 'week') {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
    } else if (viewType === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    }
    return start;
  };

  const getViewEnd = (date: Date, viewType: ViewType): Date => {
    const end = new Date(date);
    if (viewType === 'day') {
      end.setHours(23, 59, 59, 999);
    } else if (viewType === 'week') {
      const start = getViewStart(date, 'week');
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (viewType === 'month') {
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    }
    return end;
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const start = getViewStart(currentDate, view);
      const end = getViewEnd(currentDate, view);

      const response = await fetch(
        `/api/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      const data = await response.json();

      if (data.events) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Erreur fetch events:', error);
    }
    setLoading(false);
  };

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') newDate.setDate(newDate.getDate() - 1);
    else if (view === 'week') newDate.setDate(newDate.getDate() - 7);
    else if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') newDate.setDate(newDate.getDate() + 1);
    else if (view === 'week') newDate.setDate(newDate.getDate() + 7);
    else if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateRange = (): string => {
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    if (view === 'day') {
      return currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', ...options });
    } else if (view === 'week') {
      const start = getViewStart(currentDate, 'week');
      const end = getViewEnd(currentDate, 'week');
      return `${start.getDate()} - ${end.getDate()} ${end.toLocaleDateString('fr-FR', options)}`;
    } else {
      return currentDate.toLocaleDateString('fr-FR', options);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.summary || !newEvent.startDate || !newEvent.endDate) return;

    setCreating(true);
    try {
      const startDateTime = `${newEvent.startDate}T${newEvent.startTime}:00`;
      const endDateTime = `${newEvent.endDate}T${newEvent.endTime}:00`;

      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: newEvent.summary,
          description: newEvent.description,
          startDateTime,
          endDateTime,
          location: newEvent.location,
          attendees: newEvent.attendeeEmail ? [newEvent.attendeeEmail] : undefined,
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewEvent({
          summary: '',
          description: '',
          startDate: '',
          startTime: '09:00',
          endDate: '',
          endTime: '10:00',
          location: '',
          attendeeEmail: '',
        });
        fetchEvents();
      }
    } catch (error) {
      console.error('Erreur création événement:', error);
    }
    setCreating(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Supprimer cet événement ?')) return;

    try {
      await fetch(`/api/calendar/events/${eventId}`, { method: 'DELETE' });
      setSelectedEvent(null);
      fetchEvents();
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const formatEventTime = (event: CalendarEvent): string => {
    const start = event.start.dateTime || event.start.date;
    if (!start) return '';
    const date = new Date(start);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventDate = new Date(event.start.dateTime || event.start.date || '');
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const renderWeekView = () => {
    const start = getViewStart(currentDate, 'week');
    const days = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      days.push(day);
    }

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div key={index} className="min-h-[200px]">
              <div className={`text-center p-2 rounded-t-lg ${isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <div className="text-xs text-muted-foreground">
                  {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </div>
                <div className="text-lg font-semibold">{day.getDate()}</div>
              </div>
              <div className="border border-t-0 rounded-b-lg p-1 space-y-1 min-h-[150px] bg-card">
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="text-xs p-1 bg-primary/10 text-primary rounded cursor-pointer hover:bg-primary/20 truncate"
                  >
                    <span className="font-medium">{formatEventTime(event)}</span> {event.summary}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDay(currentDate);
    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8h à 19h

    return (
      <div className="space-y-1">
        {hours.map(hour => {
          const hourEvents = dayEvents.filter(event => {
            const eventHour = new Date(event.start.dateTime || '').getHours();
            return eventHour === hour;
          });

          return (
            <div key={hour} className="flex border-b border-border">
              <div className="w-16 py-2 text-sm text-muted-foreground text-right pr-2">
                {hour}:00
              </div>
              <div className="flex-1 py-1 min-h-[50px]">
                {hourEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="p-2 bg-primary/10 text-primary rounded cursor-pointer hover:bg-primary/20 mb-1"
                  >
                    <div className="font-medium">{event.summary}</div>
                    <div className="text-xs">
                      {formatEventTime(event)} - {event.location}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const start = getViewStart(currentDate, 'month');
    const firstDayOfWeek = start.getDay() || 7;
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    const days = [];

    // Jours vides avant le 1er du mois
    for (let i = 1; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Jours du mois
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }

    return (
      <div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="min-h-[80px] bg-muted/30 rounded" />;
            }

            const dayEvents = getEventsForDay(day);
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={`min-h-[80px] border rounded p-1 ${isToday ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="text-xs p-1 bg-primary/10 text-primary rounded cursor-pointer truncate"
                    >
                      {event.summary}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-muted-foreground">+{dayEvents.length - 2} autres</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Agenda {organization && <span className="text-muted-foreground font-normal">— {organization.name}</span>}
          </h1>
        </div>
        <Button onClick={() => {
          const today = new Date().toISOString().split('T')[0];
          setNewEvent(prev => ({ ...prev, startDate: today, endDate: today }));
          setShowCreateModal(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau RDV
        </Button>
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Aujourd&apos;hui
              </Button>
              <Button variant="outline" size="icon" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-lg font-medium ml-2 capitalize">
                {formatDateRange()}
              </span>
            </div>

            <div className="flex gap-1">
              {(['day', 'week', 'month'] as ViewType[]).map(v => (
                <Button
                  key={v}
                  variant={view === v ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView(v)}
                >
                  {v === 'day' ? 'Jour' : v === 'week' ? 'Semaine' : 'Mois'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerte reconnexion Google */}
      {needsReconnect && (
        <Card className="border-amber-500 bg-amber-500/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-600">Reconnexion Google requise</p>
                <p className="text-sm text-muted-foreground">
                  Votre connexion Google doit être mise à jour pour accéder au calendrier.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-amber-500 text-amber-600 hover:bg-amber-500/20"
              onClick={() => window.location.href = '/api/google/auth?type=gmail'}
            >
              Reconnecter Google
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Calendrier */}
      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : needsReconnect ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Veuillez reconnecter votre compte Google pour afficher votre agenda.
            </div>
          ) : (
            <>
              {view === 'week' && renderWeekView()}
              {view === 'day' && renderDayView()}
              {view === 'month' && renderMonthView()}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal création événement */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nouveau rendez-vous</DialogTitle>
            <DialogDescription>
              Créez un nouveau rendez-vous dans votre agenda Google.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="summary">Titre *</Label>
              <Input
                id="summary"
                placeholder="RDV - Jean Dupont"
                value={newEvent.summary}
                onChange={e => setNewEvent(prev => ({ ...prev, summary: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date début *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newEvent.startDate}
                  onChange={e => setNewEvent(prev => ({ ...prev, startDate: e.target.value, endDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Heure début</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newEvent.startTime}
                  onChange={e => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endDate">Date fin *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newEvent.endDate}
                  onChange={e => setNewEvent(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Heure fin</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newEvent.endTime}
                  onChange={e => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Lieu</Label>
              <Input
                id="location"
                placeholder="Visio / Bureau / Adresse..."
                value={newEvent.location}
                onChange={e => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendee">Email participant (optionnel)</Label>
              <Input
                id="attendee"
                type="email"
                placeholder="client@email.com"
                value={newEvent.attendeeEmail}
                onChange={e => setNewEvent(prev => ({ ...prev, attendeeEmail: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Notes sur le rendez-vous..."
                value={newEvent.description}
                onChange={e => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateEvent} disabled={creating || !newEvent.summary || !newEvent.startDate}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal détails événement */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.summary}</DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {new Date(selectedEvent.start.dateTime || selectedEvent.start.date || '').toLocaleString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {selectedEvent.description && (
                <div className="text-sm text-muted-foreground">
                  {selectedEvent.description}
                </div>
              )}

              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-1">Participants :</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedEvent.attendees.map(a => a.email).join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => selectedEvent && handleDeleteEvent(selectedEvent.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
            <Button variant="outline" onClick={() => setSelectedEvent(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
