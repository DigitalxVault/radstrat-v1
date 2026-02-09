'use client'

import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface CompletionRateChartProps {
  data: { completed: number; total: number; percentage: number }
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-3))']

export function CompletionRateChart({ data }: CompletionRateChartProps) {
  if (data.total === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        No completion data yet
      </div>
    )
  }

  const chartData = [
    { name: 'Completed', value: data.completed },
    { name: 'Not Completed', value: data.total - data.completed },
  ]

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            dataKey="value"
            strokeWidth={2}
            stroke="hsl(var(--background))"
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold">{data.percentage}%</div>
          <div className="text-xs text-muted-foreground">Complete</div>
        </div>
      </div>
    </div>
  )
}
