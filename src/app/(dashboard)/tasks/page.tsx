'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CrmTask } from '@/types/crm';
import {
  Plus,
  Calendar,
  RefreshCw,
  Loader2,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isTomorrow, isPast, isThisWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

type FilterType = 'all' | 'today' | 'overdue' | 'week' | 'completed';

const priorityConfig: Record<string, { label: string; color: string; icon: string }> = {
  urgent: { label: 'Urgent', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '' },
  high: { label: 'Haute', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: '' },
  medium: { label: 'Moyenne', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: '' },
  low: { label: 'Basse', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: '' },
};

const typeConfig: Record<string, { label: string; icon: string }> = {
  task: { label: 'Tache', icon: 'T' },
  call: { label: 'Appel', icon: 'A' },
  email: { label: 'Email', icon: 'E' },
  meeting: { label: 'RDV', icon: 'R' },
  follow_up: { label: 'Relance', icon: 'F' },
};

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    type: 'task',
    priority: 'medium',
    due_date: '',
  });
  const [creating, setCreating] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === 'completed') {
        params.set('is_completed', 'true');
      } else {
        params.set('is_completed', 'false');
      }

      const response = await fetch(`/api/crm/tasks?${params}`);
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const toggleTask = async (task: CrmTask) => {
    try {
      await fetch(`/api/crm/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !task.is_completed }),
      });
      fetchTasks();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    setCreating(true);
    try {
      await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title,
          type: newTask.type,
          priority: newTask.priority,
          due_date: newTask.due_date || null,
        }),
      });
      setNewTask({ title: '', type: 'task', priority: 'medium', due_date: '' });
      setShowForm(false);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setCreating(false);
    }
  };

  // Filter and group tasks
  const filteredTasks = tasks.filter((task) => {
    if (filter === 'completed') return task.is_completed;
    if (task.is_completed) return false;

    if (filter === 'today') {
      return task.due_date && isToday(new Date(task.due_date));
    }
    if (filter === 'overdue') {
      return task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
    }
    if (filter === 'week') {
      return task.due_date && isThisWeek(new Date(task.due_date), { weekStartsOn: 1 });
    }
    return true;
  });

  // Group by status
  const overdueTasks = filteredTasks.filter(
    (t) => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))
  );
  const todayTasks = filteredTasks.filter((t) => t.due_date && isToday(new Date(t.due_date)));
  const tomorrowTasks = filteredTasks.filter((t) => t.due_date && isTomorrow(new Date(t.due_date)));
  const laterTasks = filteredTasks.filter(
    (t) =>
      !t.due_date ||
      (!isPast(new Date(t.due_date)) &&
        !isToday(new Date(t.due_date)) &&
        !isTomorrow(new Date(t.due_date)))
  );

  // Stats
  const stats = {
    total: tasks.filter((t) => !t.is_completed).length,
    overdue: tasks.filter(
      (t) =>
        !t.is_completed && t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))
    ).length,
    today: tasks.filter((t) => !t.is_completed && t.due_date && isToday(new Date(t.due_date))).length,
    week: tasks.filter(
      (t) => !t.is_completed && t.due_date && isThisWeek(new Date(t.due_date), { weekStartsOn: 1 })
    ).length,
  };

  const TaskItem = ({ task }: { task: CrmTask }) => {
    const isOverdue =
      task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
    const priority = priorityConfig[task.priority] || priorityConfig.medium;
    const type = typeConfig[task.type] || typeConfig.task;

    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors',
          isOverdue && !task.is_completed && 'border-red-500/50 bg-red-500/5'
        )}
      >
        <Checkbox checked={task.is_completed} onCheckedChange={() => toggleTask(task)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">[{type.icon}]</span>
            <p
              className={cn(
                'font-medium text-sm',
                task.is_completed && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </p>
          </div>
          {task.prospect && (
            <p
              className="text-xs text-muted-foreground mt-0.5 cursor-pointer hover:text-primary"
              onClick={() => router.push(`/prospects/${task.prospect_id}`)}
            >
              <Building2 className="w-3 h-3 inline mr-1" />
              {task.prospect.first_name} {task.prospect.last_name}
              {task.prospect.company && ` - ${task.prospect.company}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {task.due_date && (
            <span
              className={cn(
                'text-xs flex items-center gap-1',
                isOverdue && !task.is_completed && 'text-red-400',
                isToday(new Date(task.due_date)) && !task.is_completed && 'text-orange-400'
              )}
            >
              <Calendar className="w-3 h-3" />
              {isToday(new Date(task.due_date))
                ? "Aujourd'hui"
                : isTomorrow(new Date(task.due_date))
                  ? 'Demain'
                  : format(new Date(task.due_date), 'dd MMM', { locale: fr })}
            </span>
          )}
          <Badge variant="outline" className={cn('text-[10px]', priority.color)}>
            {priority.label}
          </Badge>
        </div>
      </div>
    );
  };

  const TaskGroup = ({
    title,
    icon,
    tasks,
    variant,
  }: {
    title: string;
    icon: React.ReactNode;
    tasks: CrmTask[];
    variant?: 'danger' | 'warning' | 'default';
  }) => {
    if (tasks.length === 0) return null;

    return (
      <div className="space-y-2">
        <h3
          className={cn(
            'text-sm font-semibold flex items-center gap-2',
            variant === 'danger' && 'text-red-400',
            variant === 'warning' && 'text-orange-400'
          )}
        >
          {icon}
          {title}
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </h3>
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Taches</h1>
          <p className="text-muted-foreground">
            {stats.total} taches en cours
            {stats.overdue > 0 && <span className="text-red-400"> - {stats.overdue} en retard</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchTasks} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle tache
          </Button>
        </div>
      </div>

      {/* Quick Add Form */}
      {showForm && (
        <Card className="p-4">
          <form onSubmit={createTask} className="space-y-3">
            <Input
              placeholder="Titre de la tache..."
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              autoFocus
            />
            <div className="flex gap-2 flex-wrap">
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
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                className="w-40"
              />
              <div className="flex-1" />
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={creating || !newTask.title.trim()}>
                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Creer
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
        <TabsList>
          <TabsTrigger value="all">Toutes ({stats.total})</TabsTrigger>
          <TabsTrigger value="overdue" className={stats.overdue > 0 ? 'text-red-400' : ''}>
            En retard ({stats.overdue})
          </TabsTrigger>
          <TabsTrigger value="today">Aujourd&apos;hui ({stats.today})</TabsTrigger>
          <TabsTrigger value="week">Cette semaine ({stats.week})</TabsTrigger>
          <TabsTrigger value="completed">Completees</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {filter === 'completed' ? 'Aucune tache completee' : 'Aucune tache a afficher'}
          </p>
        </div>
      ) : filter === 'completed' ? (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <TaskGroup
            title="En retard"
            icon={<AlertTriangle className="w-4 h-4" />}
            tasks={overdueTasks}
            variant="danger"
          />
          <TaskGroup
            title="Aujourd'hui"
            icon={<Clock className="w-4 h-4" />}
            tasks={todayTasks}
            variant="warning"
          />
          <TaskGroup
            title="Demain"
            icon={<Calendar className="w-4 h-4" />}
            tasks={tomorrowTasks}
          />
          <TaskGroup title="Plus tard" icon={<Calendar className="w-4 h-4" />} tasks={laterTasks} />
        </div>
      )}
    </div>
  );
}
