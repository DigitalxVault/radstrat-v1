'use client'

import {
  Users,
  UserCheck,
  Activity,
  Database,
  Radio,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useOverview, useChartData } from '@/hooks/use-analytics'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
} from 'recharts'
import type { LucideIcon } from 'lucide-react'

// --- Sparkline sub-components ---

function AreaSparkline({
  data,
  color,
  id,
}: {
  data: Array<{ date: string; count: number }>
  color: string
  id: string
}) {
  if (!data?.length) return null
  return (
    <div className="h-[36px] w-[80px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="count"
            stroke={color}
            fill={`url(#spark-${id})`}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function MiniBarChart({
  data,
}: {
  data: Array<{ stage: string; count: number }>
}) {
  if (!data?.length) return null
  return (
    <div className="h-[36px] w-[60px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <Bar
            dataKey="count"
            fill="hsl(var(--chart-1))"
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function ProgressRing({ percentage }: { percentage: number }) {
  const size = 36
  const strokeWidth = 3.5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--chart-1))"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute text-[8px] font-semibold text-muted-foreground rotate-0">
        {percentage}%
      </span>
    </div>
  )
}

// --- Card definitions ---

interface ChartsData {
  dailyActiveUsers: Array<{ date: string; count: number }>
  completionRate: { completed: number; total: number; percentage: number }
  repeatPlayers: { once: number; multiple: number }
  engagementFunnel: Array<{ stage: string; count: number }>
  scoreComparison: { initialAvg: number; currentAvg: number; playerCount: number }
}

interface CardDef {
  title: string
  key: 'totalPlayers' | 'activePlayers' | 'recentlyActive' | 'totalProgressSaves' | 'totalEvents'
  icon: LucideIcon
  description: string
  sparkline: (chartData: ChartsData | undefined) => React.ReactNode
}

const cards: CardDef[] = [
  {
    title: 'Total Players',
    key: 'totalPlayers',
    icon: Users,
    description: 'Registered players',
    sparkline: (d) =>
      d ? <MiniBarChart data={d.engagementFunnel} /> : null,
  },
  {
    title: 'Active Players',
    key: 'activePlayers',
    icon: UserCheck,
    description: 'Currently active accounts',
    sparkline: (d) =>
      d ? (
        <AreaSparkline
          data={d.dailyActiveUsers}
          color="hsl(var(--chart-1))"
          id="active"
        />
      ) : null,
  },
  {
    title: 'Recently Active',
    key: 'recentlyActive',
    icon: Activity,
    description: 'Active in last 7 days',
    sparkline: (d) =>
      d ? (
        <AreaSparkline
          data={d.dailyActiveUsers}
          color="hsl(var(--chart-2))"
          id="recent"
        />
      ) : null,
  },
  {
    title: 'Progress Saves',
    key: 'totalProgressSaves',
    icon: Database,
    description: 'Total progress entries',
    sparkline: (d) =>
      d ? <ProgressRing percentage={d.completionRate.percentage} /> : null,
  },
  {
    title: 'Total Events',
    key: 'totalEvents',
    icon: Radio,
    description: 'Training events logged',
    sparkline: (d) =>
      d ? (
        <AreaSparkline
          data={d.dailyActiveUsers}
          color="hsl(var(--chart-3))"
          id="events"
        />
      ) : null,
  },
]

export function OverviewCards() {
  const { data, isLoading } = useOverview()
  const { data: chartData, isLoading: chartsLoading } = useChartData()

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.key} className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2">
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">
                    {data?.[card.key]?.toLocaleString() ?? '—'}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </div>
              {chartsLoading ? (
                <Skeleton className="h-9 w-20 rounded" />
              ) : (
                card.sparkline(chartData)
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
