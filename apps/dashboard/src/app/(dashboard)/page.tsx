import { OverviewCards } from '@/components/overview-cards'
import { AnalyticsCharts } from '@/components/analytics-charts'

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">
          Training analytics at a glance
        </p>
      </div>
      <OverviewCards />
      <AnalyticsCharts />
    </div>
  )
}
