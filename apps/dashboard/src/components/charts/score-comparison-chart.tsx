'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

interface ScoreComparisonChartProps {
  data: { initialAvg: number; currentAvg: number; playerCount: number }
}

export function ScoreComparisonChart({ data }: ScoreComparisonChartProps) {
  if (data.playerCount === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        No score data yet
      </div>
    )
  }

  const chartData = [
    {
      name: 'Avg Response Time',
      'Initial RT': data.initialAvg,
      'Current RT': data.currentAvg,
    },
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            borderRadius: '12px',
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--popover))',
          }}
        />
        <Legend />
        <Bar
          dataKey="Initial RT"
          fill="hsl(var(--chart-4))"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="Current RT"
          fill="hsl(var(--chart-2))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
