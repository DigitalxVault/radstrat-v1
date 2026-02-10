import { z } from 'zod/v4'
import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '@repo/database'
import { idParamSchema, userResponseSchema } from '@repo/shared'
import { adminAuth } from '../../../middleware/admin-auth.js'

const userDetailResponseSchema = userResponseSchema.extend({
  progress: z
    .object({
      version: z.number(),
      savedAt: z.string(),
    })
    .nullable(),
  deviceCount: z.number(),
  eventCount: z.number(),
})

export const adminUserDetailRoute: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'GET',
    url: '/:id',
    schema: {
      tags: ['Admin'],
      summary: 'Get user detail',
      description: 'Get detailed user information including progress summary and counts.',
      security: [{ adminBearerAuth: [] }],
      params: idParamSchema,
      response: {
        200: userDetailResponseSchema,
        404: z.object({ error: z.string(), message: z.string() }),
      },
    },
    preHandler: [adminAuth],
    handler: async (request, reply) => {
      const { id } = request.params

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          playerProgress: { select: { version: true, savedAt: true } },
          _count: { select: { devices: true, events: true } },
        },
      })

      if (!user) {
        return reply.code(404).send({
          error: 'NotFound',
          message: 'User not found',
        })
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
        progress: user.playerProgress
          ? {
              version: user.playerProgress.version,
              savedAt: user.playerProgress.savedAt.toISOString(),
            }
          : null,
        deviceCount: user._count.devices,
        eventCount: user._count.events,
      }
    },
  })
}
