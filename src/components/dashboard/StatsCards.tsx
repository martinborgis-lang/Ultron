'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Flame, Sun, Snowflake, Mail } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    chauds: number;
    tiedes: number;
    froids: number;
    mailsEnvoyes: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Prospects Chauds',
      value: stats.chauds,
      icon: Flame,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-100',
    },
    {
      title: 'Prospects Tiedes',
      value: stats.tiedes,
      icon: Sun,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
    },
    {
      title: 'Prospects Froids',
      value: stats.froids,
      icon: Snowflake,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
    },
    {
      title: 'Mails Envoyes',
      value: stats.mailsEnvoyes,
      icon: Mail,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className={`border ${card.borderColor} shadow-sm`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <p className="text-3xl font-bold mt-2">{card.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
