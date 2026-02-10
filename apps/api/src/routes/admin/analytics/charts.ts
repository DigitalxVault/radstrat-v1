import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma, Prisma } from '@repo/database'
import { chartsResponseSchema, EVENT_TYPES } from '@repo/shared'
import { adminAuth } from '../../../middleware/admin-auth.js'

export const adminChartsRoute: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'GET',
    url: '/charts',
    schema: {
      tags: ['Analytics'],
      summary: 'Dashboard chart data',
      description:
        'Returns chart data: daily active users, completion rate, repeat players, engagement funnel, and score comparison.',
      security: [{ adminBearerAuth: [] }],
      response: {
        200: chartsResponseSchema,
      },
    },
    preHandler: [adminAuth],
    handler: async () => {
      const [
        dauRows,
        completedResult,
        totalPlayers,
        repeatResult,
        distinctEventUsers,
        distinctCompletedUsers,
        initialAvgResult,
        currentAvgResult,
        playerCountResult,
        scoreTrendRows,
        improvementDistRows,
        topImproversRows,
      ] = await Promise.all([
        // 1. Daily active users — last 7 days
        prisma.$queryRaw<{ date: string; count: number }[]>(
          Prisma.sql`SELECT DATE("createdAt")::text as date, COUNT(DISTINCT "userId")::int as count
            FROM events WHERE "createdAt" >= NOW() - INTERVAL '7 days'
            GROUP BY DATE("createdAt") ORDER BY date ASC`,
        ),

        // 2a. Completion rate — completed count
        prisma.$queryRaw<{ count: number }[]>(
          Prisma.sql`SELECT COUNT(DISTINCT "userId")::int as count
            FROM events WHERE "eventType" = ${EVENT_TYPES.GAME_COMPLETE}`,
        ),

        // 2b. Completion rate — total players
        prisma.user.count({ where: { role: 'PLAYER' } }),

        // 3. Repeat players
        prisma.$queryRaw<{ once: number; multiple: number }[]>(
          Prisma.sql`SELECT
            COUNT(*) FILTER (WHERE completions = 1)::int as once,
            COUNT(*) FILTER (WHERE completions > 1)::int as multiple
          FROM (
            SELECT "userId", COUNT(*)::int as completions
            FROM events WHERE "eventType" = ${EVENT_TYPES.GAME_COMPLETE}
            GROUP BY "userId"
          ) player_completions`,
        ),

        // 4a. Engagement funnel — started (any event)
        prisma.$queryRaw<{ count: number }[]>(
          Prisma.sql`SELECT COUNT(DISTINCT "userId")::int as count FROM events`,
        ),

        // 4b. Engagement funnel — completed
        prisma.$queryRaw<{ count: number }[]>(
          Prisma.sql`SELECT COUNT(DISTINCT "userId")::int as count
            FROM events WHERE "eventType" = ${EVENT_TYPES.GAME_COMPLETE}`,
        ),

        // 5a. Score comparison — initial assessment average
        prisma.$queryRaw<{ avg: number }[]>(
          Prisma.sql`SELECT COALESCE(AVG((payload->>'overallScore')::numeric), 0)::float as avg
            FROM events
            WHERE "eventType" = ${EVENT_TYPES.INITIAL_ASSESSMENT}
            AND payload->>'overallScore' IS NOT NULL`,
        ),

        // 5b. Score comparison — latest game_complete average
        prisma.$queryRaw<{ avg: number }[]>(
          Prisma.sql`SELECT COALESCE(AVG(score), 0)::float as avg
          FROM (
            SELECT DISTINCT ON ("userId") (payload->>'score')::numeric as score
            FROM events
            WHERE "eventType" = ${EVENT_TYPES.GAME_COMPLETE}
            AND payload->>'score' IS NOT NULL
            ORDER BY "userId", "createdAt" DESC
          ) latest`,
        ),

        // 5c. Score comparison — players with both assessment and completion
        prisma.$queryRaw<{ count: number }[]>(
          Prisma.sql`SELECT COUNT(DISTINCT e1."userId")::int as count
          FROM events e1
          INNER JOIN events e2 ON e1."userId" = e2."userId"
          WHERE e1."eventType" = ${EVENT_TYPES.INITIAL_ASSESSMENT}
          AND e2."eventType" = ${EVENT_TYPES.GAME_COMPLETE}`,
        ),

        // 6a. Score trend — daily avg game_complete score (7 days)
        prisma.$queryRaw<{ date: string; avgScore: number }[]>(
          Prisma.sql`SELECT DATE("createdAt")::text AS date,
            ROUND(AVG((payload->>'score')::numeric), 1)::float AS "avgScore"
            FROM events
            WHERE "eventType" = ${EVENT_TYPES.GAME_COMPLETE}
            AND payload->>'score' IS NOT NULL
            AND "createdAt" >= NOW() - INTERVAL '7 days'
            GROUP BY DATE("createdAt")
            ORDER BY date ASC`,
        ),

        // 6b. Improvement distribution — buckets of (currentRT - initialRT)
        prisma.$queryRaw<{ bucket: string; count: number }[]>(
          Prisma.sql`SELECT
            CASE
              WHEN improvement < 0 THEN 'Declined'
              WHEN improvement < 10 THEN '0–9'
              WHEN improvement < 20 THEN '10–19'
              WHEN improvement < 30 THEN '20–29'
              ELSE '30+'
            END AS bucket,
            COUNT(*)::int AS count
          FROM (
            SELECT ia."userId", gc.score - ia."overallScore" AS improvement
            FROM (
              SELECT DISTINCT ON ("userId") "userId",
                (payload->>'overallScore')::numeric AS "overallScore"
              FROM events WHERE "eventType" = ${EVENT_TYPES.INITIAL_ASSESSMENT}
                AND payload->>'overallScore' IS NOT NULL
              ORDER BY "userId", "createdAt" ASC
            ) ia
            INNER JOIN (
              SELECT DISTINCT ON ("userId") "userId",
                (payload->>'score')::numeric AS score
              FROM events WHERE "eventType" = ${EVENT_TYPES.GAME_COMPLETE}
                AND payload->>'score' IS NOT NULL
              ORDER BY "userId", "createdAt" DESC
            ) gc ON ia."userId" = gc."userId"
          ) improvements
          GROUP BY 1`,
        ),

        // 6c. Top 5 improvers — biggest score gains
        prisma.$queryRaw<{
          userId: string
          firstName: string
          lastName: string
          initialScore: number
          currentScore: number
          improvement: number
        }[]>(
          Prisma.sql`SELECT u.id AS "userId", u."firstName", u."lastName",
            ia."overallScore"::float AS "initialScore",
            gc.score::float AS "currentScore",
            (gc.score - ia."overallScore")::float AS improvement
          FROM (
            SELECT DISTINCT ON ("userId") "userId",
              (payload->>'overallScore')::numeric AS "overallScore"
            FROM events WHERE "eventType" = ${EVENT_TYPES.INITIAL_ASSESSMENT}
              AND payload->>'overallScore' IS NOT NULL
            ORDER BY "userId", "createdAt" ASC
          ) ia
          INNER JOIN (
            SELECT DISTINCT ON ("userId") "userId",
              (payload->>'score')::numeric AS score
            FROM events WHERE "eventType" = ${EVENT_TYPES.GAME_COMPLETE}
              AND payload->>'score' IS NOT NULL
            ORDER BY "userId", "createdAt" DESC
          ) gc ON ia."userId" = gc."userId"
          INNER JOIN users u ON u.id = ia."userId"
          WHERE u."isActive" = true
          ORDER BY improvement DESC
          LIMIT 5`,
        ),
      ])

      // 1. Fill missing days with 0 for daily active users
      const dauMap = new Map(dauRows.map((r) => [r.date, r.count]))
      const dailyActiveUsers: { date: string; count: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        const dateStr = d.toISOString().slice(0, 10)
        dailyActiveUsers.push({ date: dateStr, count: dauMap.get(dateStr) ?? 0 })
      }

      // 2. Completion rate
      const completed = completedResult[0]?.count ?? 0
      const completionRate = {
        completed,
        total: totalPlayers,
        percentage: totalPlayers > 0 ? Math.round((completed / totalPlayers) * 10000) / 100 : 0,
      }

      // 3. Repeat players
      const repeatRow = repeatResult[0]
      const repeatPlayers = {
        once: repeatRow?.once ?? 0,
        multiple: repeatRow?.multiple ?? 0,
      }

      // 4. Engagement funnel
      const engagementFunnel = [
        { stage: 'Whitelisted', count: totalPlayers },
        { stage: 'Started', count: distinctEventUsers[0]?.count ?? 0 },
        { stage: 'Completed', count: distinctCompletedUsers[0]?.count ?? 0 },
      ]

      // 5. Score comparison
      const scoreComparison = {
        initialAvg: Math.round((initialAvgResult[0]?.avg ?? 0) * 100) / 100,
        currentAvg: Math.round((currentAvgResult[0]?.avg ?? 0) * 100) / 100,
        playerCount: playerCountResult[0]?.count ?? 0,
      }

      // 6a. Score trend — fill missing days with 0
      const trendMap = new Map(scoreTrendRows.map((r) => [r.date, r.avgScore]))
      const scoreTrend: { date: string; avgScore: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        const dateStr = d.toISOString().slice(0, 10)
        scoreTrend.push({ date: dateStr, avgScore: trendMap.get(dateStr) ?? 0 })
      }

      // 6b. Improvement distribution — ensure all buckets present
      const bucketOrder = ['Declined', '0–9', '10–19', '20–29', '30+']
      const distMap = new Map(improvementDistRows.map((r) => [r.bucket, r.count]))
      const improvementDistribution = bucketOrder.map((bucket) => ({
        bucket,
        count: distMap.get(bucket) ?? 0,
      }))

      // 6c. Top improvers — round scores
      const topImprovers = topImproversRows.map((r) => ({
        ...r,
        initialScore: Math.round(r.initialScore * 10) / 10,
        currentScore: Math.round(r.currentScore * 10) / 10,
        improvement: Math.round(r.improvement * 10) / 10,
      }))

      return {
        dailyActiveUsers,
        completionRate,
        repeatPlayers,
        engagementFunnel,
        scoreComparison,
        scoreTrend,
        improvementDistribution,
        topImprovers,
      }
    },
  })
}
