'use client'

import { Badge } from '@/components/ui/badge'
import { TrendingUp } from 'lucide-react'

interface TopImproversListProps {
  data: Array<{
    userId: string
    firstName: string
    lastName: string
    initialScore: number
    currentScore: number
    improvement: number
  }>
}

const RANK_STYLES = [
  'text-yellow-500 font-bold',
  'text-gray-400 font-bold',
  'text-amber-600 font-bold',
  'text-muted-foreground',
  'text-muted-foreground',
]

export function TopImproversList({ data }: TopImproversListProps) {
  if (!data.length) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        No improvement data yet
      </div>
    )
  }

  return (
    <div className="min-h-[300px] space-y-3">
      {data.map((player, index) => (
        <div
          key={player.userId}
          className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
        >
          <span
            className={`w-6 text-center text-sm ${RANK_STYLES[index] ?? 'text-muted-foreground'}`}
          >
            #{index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {player.firstName} {player.lastName}
            </p>
            <p className="text-xs text-muted-foreground">
              {player.initialScore} → {player.currentScore}
            </p>
          </div>
          <Badge
            variant={player.improvement >= 0 ? 'default' : 'destructive'}
            className="flex items-center gap-1"
          >
            <TrendingUp className="size-3" />
            +{player.improvement}
          </Badge>
        </div>
      ))}
    </div>
  )
}
