'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'

interface ImprovementDistributionChartProps {
  data: Array<{ bucket: string; count: number }>
}

const BUCKET_COLORS: Record<string, string> = {
  Declined: 'hsl(var(--chart-4))',
  '0–9': 'hsl(var(--chart-5))',
  '10–19': 'hsl(var(--chart-3))',
  '20–29': 'hsl(var(--chart-2))',
  '30+': 'hsl(var(--chart-1))',
}

export function ImprovementDistributionChart({
  data,
}: ImprovementDistributionChartProps) {
  if (data.every((d) => d.count === 0)) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        No improvement data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            borderRadius: '12px',
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--popover))',
          }}
        />
        <Bar dataKey="count" name="Players" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={BUCKET_COLORS[entry.bucket] ?? 'hsl(var(--chart-1))'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
