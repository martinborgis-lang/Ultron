'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, UserPlus, Calendar, FileText, CheckCircle } from 'lucide-react';
import type { Activity } from '@/types';

interface ActivityFeedProps {
  activities: Activity[];
}

const actionIcons: Record<string, typeof Mail> = {
  mail: Mail,
  nouveau: UserPlus,
  rdv: Calendar,
  plaquette: FileText,
  default: CheckCircle,
};

function getIcon(action: string) {
  const lowerAction = action.toLowerCase();
  if (lowerAction.includes('mail')) return actionIcons.mail;
  if (lowerAction.includes('nouveau') || lowerAction.includes('qualifie')) return actionIcons.nouveau;
  if (lowerAction.includes('rdv')) return actionIcons.rdv;
  if (lowerAction.includes('plaquette')) return actionIcons.plaquette;
  return actionIcons.default;
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Activite recente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getIcon(activity.action);
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-50">
                  <Icon className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900">
                    {activity.action}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activity.target}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {activity.time}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
