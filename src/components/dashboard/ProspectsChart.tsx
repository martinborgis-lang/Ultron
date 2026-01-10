'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
  ComposedChart,
} from 'recharts';
import type { ChartDataPoint } from '@/types';

interface ProspectsChartProps {
  data: ChartDataPoint[];
}

export function ProspectsChart({ data }: ProspectsChartProps) {
  // Transformer les données pour afficher Total (cumulé) et Nouveaux (par jour)
  const chartData = data.map((d) => ({
    date: d.date,
    total: d.chauds, // On utilise chauds comme total cumulé
    nouveaux: d.tiedes, // On utilise tiedes comme nouveaux du jour
  }));

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Evolution des prospects (30 jours)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="total"
                name="Total prospects"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
              />
              <Bar
                yAxisId="right"
                dataKey="nouveaux"
                name="Nouveaux du jour"
                fill="#22c55e"
                opacity={0.6}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
