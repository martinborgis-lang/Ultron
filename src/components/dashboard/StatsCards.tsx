'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Flame, Sun, Snowflake, Mail, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  stats: {
    chauds: number;
    tiedes: number;
    froids: number;
    mailsEnvoyes: number;
  };
  previousStats?: {
    chauds: number;
    tiedes: number;
    froids: number;
    mailsEnvoyes: number;
  };
}

// Generate sparkline data based on current value
function generateSparklineData(currentValue: number, trend: 'up' | 'down' | 'stable' = 'up') {
  const baseValue = Math.max(1, currentValue - Math.floor(currentValue * 0.3));
  const data = [];

  for (let i = 0; i < 7; i++) {
    let value;
    if (trend === 'up') {
      value = baseValue + ((currentValue - baseValue) * (i / 6)) + (Math.random() * 2 - 1);
    } else if (trend === 'down') {
      value = currentValue - ((currentValue - baseValue) * (i / 6)) + (Math.random() * 2 - 1);
    } else {
      value = currentValue + (Math.random() * 4 - 2);
    }
    data.push({ value: Math.max(0, Math.round(value)) });
  }

  return data;
}

function getTrend(current: number, previous?: number): 'up' | 'down' | 'stable' {
  if (!previous) return 'stable';
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'stable';
}

function TrendIndicator({ trend, change }: { trend: 'up' | 'down' | 'stable'; change?: number }) {
  if (trend === 'up') {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-emerald-500">
        <TrendingUp className="w-3 h-3" />
        {change !== undefined && `+${change}`}
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-red-500">
        <TrendingDown className="w-3 h-3" />
        {change !== undefined && change}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
      <Minus className="w-3 h-3" />
    </span>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  }),
};

export function StatsCards({ stats, previousStats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Prospects Chauds',
      value: stats.chauds,
      previousValue: previousStats?.chauds,
      icon: Flame,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      chartColor: '#ef4444',
      gradientFrom: '#ef4444',
      gradientTo: '#ef444420',
    },
    {
      title: 'Prospects Tiedes',
      value: stats.tiedes,
      previousValue: previousStats?.tiedes,
      icon: Sun,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      chartColor: '#f59e0b',
      gradientFrom: '#f59e0b',
      gradientTo: '#f59e0b20',
    },
    {
      title: 'Prospects Froids',
      value: stats.froids,
      previousValue: previousStats?.froids,
      icon: Snowflake,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      chartColor: '#3b82f6',
      gradientFrom: '#3b82f6',
      gradientTo: '#3b82f620',
    },
    {
      title: 'Mails Envoyes',
      value: stats.mailsEnvoyes,
      previousValue: previousStats?.mailsEnvoyes,
      icon: Mail,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      chartColor: '#6366f1',
      gradientFrom: '#6366f1',
      gradientTo: '#6366f120',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const trend = getTrend(card.value, card.previousValue);
        const change = card.previousValue !== undefined ? card.value - card.previousValue : undefined;
        const sparklineData = generateSparklineData(card.value, trend);

        return (
          <motion.div
            key={card.title}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card
              className={cn(
                'relative overflow-hidden border shadow-sm hover:shadow-md transition-all duration-300',
                'bg-gradient-to-br from-card to-card/80',
                'dark:from-card dark:to-card/50',
                card.borderColor
              )}
            >
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn('p-2 rounded-lg', card.bgColor)}>
                      <card.icon className={cn('h-4 w-4', card.color)} />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {card.title}
                    </p>
                  </div>
                  <TrendIndicator trend={trend} change={change} />
                </div>

                {/* Value */}
                <div className="flex items-end justify-between">
                  <motion.p
                    className="text-3xl font-bold tracking-tight"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
                  >
                    {card.value}
                  </motion.p>

                  {/* Sparkline */}
                  <div className="w-20 h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sparklineData}>
                        <defs>
                          <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={card.gradientFrom} stopOpacity={0.4} />
                            <stop offset="100%" stopColor={card.gradientTo} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={card.chartColor}
                          strokeWidth={2}
                          fill={`url(#gradient-${index})`}
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>

              {/* Subtle gradient overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-5"
                style={{
                  background: `radial-gradient(circle at top right, ${card.chartColor}, transparent 50%)`,
                }}
              />
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
