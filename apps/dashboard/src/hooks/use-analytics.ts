'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

interface OverviewData {
  totalPlayers: number
  activePlayers: number
  recentlyActive: number
  totalProgressSaves: number
  totalEvents: number
}

interface UserAnalytics {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
  progress: Record<string, unknown> | null
  events: {
    data: Array<{
      id: string
      eventType: string
      payload: Record<string, unknown>
      createdAt: string
    }>
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

interface ChartsData {
  dailyActiveUsers: Array<{ date: string; count: number }>
  completionRate: { completed: number; total: number; percentage: number }
  repeatPlayers: { once: number; multiple: number }
  engagementFunnel: Array<{ stage: string; count: number }>
  scoreComparison: { initialAvg: number; currentAvg: number; playerCount: number }
  scoreTrend: Array<{ date: string; avgScore: number }>
  improvementDistribution: Array<{ bucket: string; count: number }>
  topImprovers: Array<{
    userId: string
    firstName: string
    lastName: string
    initialScore: number
    currentScore: number
    improvement: number
  }>
}

export function useOverview() {
  return useQuery<OverviewData>({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api('/api/admin/analytics/overview'),
  })
}

export function useChartData() {
  return useQuery<ChartsData>({
    queryKey: ['analytics', 'charts'],
    queryFn: () => api('/api/admin/analytics/charts'),
    refetchInterval: 60_000,
  })
}

export function useUserAnalytics(userId: string) {
  return useQuery<UserAnalytics>({
    queryKey: ['analytics', 'user', userId],
    queryFn: () => api(`/api/admin/analytics/users/${userId}`),
    enabled: !!userId,
  })
}
