import { z } from 'zod/v4'

export const chartsResponseSchema = z.object({
  dailyActiveUsers: z.array(z.object({ date: z.string(), count: z.number() })),
  completionRate: z.object({
    completed: z.number(),
    total: z.number(),
    percentage: z.number(),
  }),
  repeatPlayers: z.object({
    once: z.number(),
    multiple: z.number(),
  }),
  engagementFunnel: z.array(z.object({
    stage: z.string(),
    count: z.number(),
  })),
  scoreComparison: z.object({
    initialAvg: z.number(),
    currentAvg: z.number(),
    playerCount: z.number(),
  }),
  scoreTrend: z.array(z.object({ date: z.string(), avgScore: z.number() })),
  improvementDistribution: z.array(z.object({ bucket: z.string(), count: z.number() })),
  topImprovers: z.array(z.object({
    userId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    initialScore: z.number(),
    currentScore: z.number(),
    improvement: z.number(),
  })),
})
