import { z } from 'zod/v4'
import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '@repo/database'
import { adminAuth } from '../../../middleware/admin-auth.js'

const analyticsOverviewSchema = z.object({
  totalPlayers: z.number(),
  activePlayers: z.number(),
  recentlyActive: z.number(),
  totalProgressSaves: z.number(),
  totalEvents: z.number(),
})

export const adminAnalyticsOverviewRoute: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'GET',
    url: '/overview',
    schema: {
      tags: ['Analytics'],
      summary: 'Analytics overview',
      description: 'Aggregate metrics: total players, active players, recently active (7 days), progress saves, events.',
      security: [{ adminBearerAuth: [] }],
      response: {
        200: analyticsOverviewSchema,
      },
    },
    preHandler: [adminAuth],
    handler: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      const [totalPlayers, activePlayers, recentlyActive, totalProgressSaves, totalEvents] =
        await Promise.all([
          prisma.user.count({ where: { role: 'PLAYER' } }),
          prisma.user.count({ where: { role: 'PLAYER', isActive: true } }),
          prisma.user.count({
            where: {
              role: 'PLAYER',
              lastLoginAt: { gte: sevenDaysAgo },
            },
          }),
          prisma.playerProgress.count(),
          prisma.event.count(),
        ])

      return {
        totalPlayers,
        activePlayers,
        recentlyActive,
        totalProgressSaves,
        totalEvents,
      }
    },
  })
}
