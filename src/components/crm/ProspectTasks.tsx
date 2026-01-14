'use client';

import { useState } from 'react';
import { CrmTask } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Calendar, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProspectTasksProps {
  tasks: CrmTask[];
  prospectId: string;
  onTasksChanged: () => void;
}

export function ProspectTasks({ tasks, prospectId, onTasksChanged }: ProspectTasksProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    type: 'task',
    priority: 'medium',
    due_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospect_id: prospectId,
          title: newTask.title,
          type: newTask.type,
          priority: newTask.priority,
          due_date: newTask.due_date || null,
        }),
      });

      if (!response.ok) throw new Error('Erreur');

      setNewTask({ title: '', type: 'task', priority: 'medium', due_date: '' });
      setShowForm(false);
      onTasksChanged();
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (task: CrmTask) => {
    try {
      await fetch(`/api/crm/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !task.is_completed }),
      });
      onTasksChanged();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const pendingTasks = tasks.filter((t) => !t.is_completed);
  const completedTasks = tasks.filter((t) => t.is_completed);

  const getDueStatus = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) return 'overdue';
    if (isToday(date)) return 'today';
    return 'upcoming';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Taches ({pendingTasks.length})</h3>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1" />
          Tache
        </Button>
      </div>

      {/* Add Task Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-2 p-3 border border-dashed rounded-lg">
          <Input
            placeholder="Titre de la tache..."
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          />
          <div className="flex gap-2">
            <Select
              value={newTask.type}
              onValueChange={(v) => setNewTask({ ...newTask, type: v })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="task">Tache</SelectItem>
                <SelectItem value="call">Appel</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="meeting">RDV</SelectItem>
                <SelectItem value="follow_up">Relance</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={newTask.priority}
              onValueChange={(v) => setNewTask({ ...newTask, priority: v })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Basse</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={newTask.due_date}
              onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
              className="w-40"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={loading || !newTask.title.trim()}>
              {loading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Ajouter
            </Button>
          </div>
        </form>
      )}

      {/* Pending Tasks */}
      <div className="space-y-2">
        {pendingTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune tache en cours
          </p>
        ) : (
          pendingTasks.map((task) => {
            const dueStatus = getDueStatus(task.due_date);
            return (
              <div
                key={task.id}
                className={cn(
                  'flex items-start gap-3 p-2 rounded-lg border',
                  dueStatus === 'overdue' && 'border-red-500/50 bg-red-500/5',
                  dueStatus === 'today' && 'border-orange-500/50 bg-orange-500/5'
                )}
              >
                <Checkbox
                  checked={task.is_completed}
                  onCheckedChange={() => toggleTask(task)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{task.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {task.due_date && (
                      <span className={cn(
                        'flex items-center gap-1',
                        dueStatus === 'overdue' && 'text-red-400',
                        dueStatus === 'today' && 'text-orange-400'
                      )}>
                        <Calendar className="w-3 h-3" />
                        {isToday(new Date(task.due_date))
                          ? "Aujourd'hui"
                          : format(new Date(task.due_date), 'dd MMM', { locale: fr })}
                      </span>
                    )}
                    <span className={cn(
                      'px-1.5 py-0.5 rounded text-[10px]',
                      task.priority === 'urgent' && 'bg-red-500/20 text-red-400',
                      task.priority === 'high' && 'bg-orange-500/20 text-orange-400',
                      task.priority === 'medium' && 'bg-blue-500/20 text-blue-400',
                      task.priority === 'low' && 'bg-gray-500/20 text-gray-400'
                    )}>
                      {task.priority === 'urgent' ? 'Urgent' :
                       task.priority === 'high' ? 'Haute' :
                       task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <p className="text-xs text-muted-foreground">Completees ({completedTasks.length})</p>
          {completedTasks.slice(0, 3).map((task) => (
            <div key={task.id} className="flex items-center gap-3 p-2 opacity-50">
              <Checkbox checked={true} onCheckedChange={() => toggleTask(task)} />
              <span className="text-sm line-through">{task.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
