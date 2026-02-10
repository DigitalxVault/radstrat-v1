'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useChartData } from '@/hooks/use-analytics'
import { DailyActiveChart } from '@/components/charts/daily-active-chart'
import { CompletionRateChart } from '@/components/charts/completion-rate-chart'
import { EngagementFunnelChart } from '@/components/charts/engagement-funnel-chart'
import { ScoreComparisonChart } from '@/components/charts/score-comparison-chart'
import { RepeatPlayersChart } from '@/components/charts/repeat-players-chart'
import { ScoreTrendChart } from '@/components/charts/score-trend-chart'
import { ImprovementDistributionChart } from '@/components/charts/improvement-distribution-chart'
import { TopImproversList } from '@/components/charts/top-improvers-list'

function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  )
}

export function AnalyticsCharts() {
  const { data, isLoading } = useChartData()

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Training Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Active Users</CardTitle>
            <CardDescription>Player activity over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : data ? (
              <DailyActiveChart data={data.dailyActiveUsers} />
            ) : null}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Completion Rate</CardTitle>
            <CardDescription>Training completion percentage</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : data ? (
              <CompletionRateChart data={data.completionRate} />
            ) : null}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Engagement Funnel</CardTitle>
            <CardDescription>Player progression through stages</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : data ? (
              <EngagementFunnelChart data={data.engagementFunnel} />
            ) : null}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Score Comparison</CardTitle>
            <CardDescription>Initial vs current response times</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : data ? (
              <ScoreComparisonChart data={data.scoreComparison} />
            ) : null}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Repeat Players</CardTitle>
            <CardDescription>Single vs multiple session players</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : data ? (
              <RepeatPlayersChart data={data.repeatPlayers} />
            ) : null}
          </CardContent>
        </Card>
      </div>

      <h2 className="text-lg font-semibold">Player Improvement</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Score Trend</CardTitle>
            <CardDescription>Average game score over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : data ? (
              <ScoreTrendChart data={data.scoreTrend} />
            ) : null}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Top Improvers</CardTitle>
            <CardDescription>Biggest score gains (initial vs current)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : data ? (
              <TopImproversList data={data.topImprovers} />
            ) : null}
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Improvement Distribution</CardTitle>
            <CardDescription>Score improvement spread across all players</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : data ? (
              <ImprovementDistributionChart data={data.improvementDistribution} />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
