'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Mail,
  UserPlus,
  Calendar,
  FileText,
  CheckCircle,
  Flame,
  Sun,
  Snowflake,
  Send,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Activity } from '@/types';
import { cn } from '@/lib/utils';

interface ActivityFeedProps {
  activities: Activity[];
}

interface ActionConfig {
  icon: typeof Mail;
  bgColor: string;
  iconColor: string;
  borderColor: string;
}

function getActionConfig(action: string): ActionConfig {
  const lowerAction = action.toLowerCase();

  if (lowerAction.includes('mail') && lowerAction.includes('synthese')) {
    return {
      icon: Send,
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-500/20',
    };
  }
  if (lowerAction.includes('mail') && lowerAction.includes('rappel')) {
    return {
      icon: Clock,
      bgColor: 'bg-purple-500/10',
      iconColor: 'text-purple-500',
      borderColor: 'border-purple-500/20',
    };
  }
  if (lowerAction.includes('plaquette')) {
    return {
      icon: FileText,
      bgColor: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      borderColor: 'border-emerald-500/20',
    };
  }
  if (lowerAction.includes('chaud')) {
    return {
      icon: Flame,
      bgColor: 'bg-red-500/10',
      iconColor: 'text-red-500',
      borderColor: 'border-red-500/20',
    };
  }
  if (lowerAction.includes('tiede')) {
    return {
      icon: Sun,
      bgColor: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
      borderColor: 'border-amber-500/20',
    };
  }
  if (lowerAction.includes('froid')) {
    return {
      icon: Snowflake,
      bgColor: 'bg-blue-400/10',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-400/20',
    };
  }
  if (lowerAction.includes('rdv')) {
    return {
      icon: Calendar,
      bgColor: 'bg-indigo-500/10',
      iconColor: 'text-indigo-500',
      borderColor: 'border-indigo-500/20',
    };
  }
  if (lowerAction.includes('nouveau') || lowerAction.includes('qualifie')) {
    return {
      icon: UserPlus,
      bgColor: 'bg-green-500/10',
      iconColor: 'text-green-500',
      borderColor: 'border-green-500/20',
    };
  }
  if (lowerAction.includes('mail')) {
    return {
      icon: Mail,
      bgColor: 'bg-indigo-500/10',
      iconColor: 'text-indigo-500',
      borderColor: 'border-indigo-500/20',
    };
  }

  return {
    icon: CheckCircle,
    bgColor: 'bg-slate-500/10',
    iconColor: 'text-slate-500',
    borderColor: 'border-slate-500/20',
  };
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  }),
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Activite recente
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune activite recente
            </p>
          ) : (
            activities.map((activity, index) => {
              const config = getActionConfig(activity.action);
              const Icon = config.icon;

              return (
                <motion.div
                  key={activity.id}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={itemVariants}
                  className={cn(
                    'flex items-start gap-3 p-2 rounded-lg',
                    'hover:bg-muted/50 transition-colors duration-200',
                    'border border-transparent hover:border-muted'
                  )}
                >
                  {/* Timeline dot and line */}
                  <div className="relative flex flex-col items-center">
                    <div
                      className={cn(
                        'p-2 rounded-lg border',
                        config.bgColor,
                        config.borderColor
                      )}
                    >
                      <Icon className={cn('h-4 w-4', config.iconColor)} />
                    </div>
                    {index < activities.length - 1 && (
                      <div className="w-px h-full bg-border absolute top-10 left-1/2 -translate-x-1/2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm font-medium text-foreground leading-tight">
                      {activity.action}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {activity.target}
                    </p>
                  </div>

                  {/* Time */}
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted/50 px-2 py-1 rounded-full">
                    {activity.time}
                  </span>
                </motion.div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
