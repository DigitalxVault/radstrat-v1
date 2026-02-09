'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

interface RepeatPlayersChartProps {
  data: { once: number; multiple: number }
}

export function RepeatPlayersChart({ data }: RepeatPlayersChartProps) {
  if (data.once === 0 && data.multiple === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        No replay data yet
      </div>
    )
  }

  const chartData = [
    { name: 'Single Play', value: data.once },
    { name: 'Repeat Players', value: data.multiple },
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12 }}
          width={100}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--popover))',
          }}
        />
        <Bar
          dataKey="value"
          fill="hsl(var(--chart-2))"
          radius={[0, 4, 4, 0]}
          name="Players"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
