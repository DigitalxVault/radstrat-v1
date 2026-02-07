import { z } from 'zod/v4'
import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '@repo/database'
import { idParamSchema, paginationSchema } from '@repo/shared'
import { adminAuth } from '../../../middleware/admin-auth.js'

const userAnalyticsSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    lastLoginAt: z.string().nullable(),
  }),
  progress: z
    .object({
      version: z.number(),
      savedAt: z.string(),
      progressData: z.unknown(),
    })
    .nullable(),
  recentEvents: z.array(
    z.object({
      id: z.string(),
      eventType: z.string(),
      payload: z.unknown(),
      createdAt: z.string(),
    }),
  ),
  eventCount: z.number(),
})

export const adminUserAnalyticsRoute: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'GET',
    url: '/users/:id',
    schema: {
      tags: ['Analytics'],
      summary: 'Per-user analytics',
      description: 'User progress data and recent events.',
      params: idParamSchema,
      querystring: paginationSchema,
      response: {
        200: userAnalyticsSchema,
        404: z.object({ error: z.string(), message: z.string() }),
      },
    },
    preHandler: [adminAuth],
    handler: async (request, reply) => {
      const { id } = request.params
      const { page, limit } = request.query

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          lastLoginAt: true,
        },
      })

      if (!user) {
        return reply.code(404).send({
          error: 'NotFound',
          message: 'User not found',
        })
      }

      const [progress, recentEvents, eventCount] = await Promise.all([
        prisma.playerProgress.findUnique({
          where: { userId: id },
        }),
        prisma.event.findMany({
          where: { userId: id },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: (page - 1) * limit,
        }),
        prisma.event.count({ where: { userId: id } }),
      ])

      return {
        user: {
          ...user,
          lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        },
        progress: progress
          ? {
              version: progress.version,
              savedAt: progress.savedAt.toISOString(),
              progressData: progress.progressData,
            }
          : null,
        recentEvents: recentEvents.map((e) => ({
          id: e.id,
          eventType: e.eventType,
          payload: e.payload,
          createdAt: e.createdAt.toISOString(),
        })),
        eventCount,
      }
    },
  })
}
