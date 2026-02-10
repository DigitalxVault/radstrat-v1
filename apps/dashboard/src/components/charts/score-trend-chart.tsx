'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

interface ScoreTrendChartProps {
  data: Array<{ date: string; avgScore: number }>
}

export function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  if (!data.length || data.every((d) => d.avgScore === 0)) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        No score trend data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="scoreTrendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(value: string) => {
            const d = new Date(value)
            return `${d.getDate()}/${d.getMonth() + 1}`
          }}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          labelFormatter={(value: string) => new Date(value).toLocaleDateString()}
          contentStyle={{
            borderRadius: '12px',
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--popover))',
          }}
          formatter={(value: number) => [value.toFixed(1), 'Avg Score']}
        />
        <Area
          type="monotone"
          dataKey="avgScore"
          stroke="hsl(var(--chart-2))"
          fill="url(#scoreTrendGradient)"
          strokeWidth={2}
          name="Avg Score"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
