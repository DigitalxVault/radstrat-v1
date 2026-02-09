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

interface DailyActiveChartProps {
  data: Array<{ date: string; count: number }>
}

export function DailyActiveChart({ data }: DailyActiveChartProps) {
  if (!data.length || data.every((d) => d.count === 0)) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        No activity data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
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
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip
          labelFormatter={(value: string) => new Date(value).toLocaleDateString()}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--popover))',
          }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="hsl(var(--chart-1))"
          fill="url(#areaGradient)"
          strokeWidth={2}
          name="Active Users"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
