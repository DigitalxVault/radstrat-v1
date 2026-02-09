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
import { useOverview } from '@/hooks/use-analytics'

const cards = [
  {
    title: 'Total Players',
    key: 'totalPlayers' as const,
    icon: Users,
    description: 'Registered players',
  },
  {
    title: 'Active Players',
    key: 'activePlayers' as const,
    icon: UserCheck,
    description: 'Currently active accounts',
  },
  {
    title: 'Recently Active',
    key: 'recentlyActive' as const,
    icon: Activity,
    description: 'Active in last 7 days',
  },
  {
    title: 'Progress Saves',
    key: 'totalProgressSaves' as const,
    icon: Database,
    description: 'Total progress entries',
  },
  {
    title: 'Total Events',
    key: 'totalEvents' as const,
    icon: Radio,
    description: 'Training events logged',
  },
]

export function OverviewCards() {
  const { data, isLoading } = useOverview()

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
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
