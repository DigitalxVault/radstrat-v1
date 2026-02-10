import { z } from 'zod/v4'
import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma, Prisma } from '@repo/database'
import { saveProgressRequestSchema, progressResponseSchema } from '@repo/shared'
import { playerAuth } from '../../middleware/auth.js'
import { requirePasswordChanged } from '../../middleware/require-password-changed.js'

export const saveProgressRoute: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'PUT',
    url: '/',
    schema: {
      tags: ['Progress'],
      summary: 'Save player progress',
      description: 'Save progress data with optimistic concurrency. Send version=1 for first save, or the current version for updates. Returns 409 if version is stale.',
      security: [{ playerBearerAuth: [] }],
      body: saveProgressRequestSchema,
      response: {
        200: progressResponseSchema,
        409: z.object({ error: z.string(), message: z.string(), currentVersion: z.number() }),
      },
    },
    preHandler: [playerAuth, requirePasswordChanged],
    handler: async (request, reply) => {
      const { progressData, version } = request.body
      const userId = request.user.id

      const existing = await prisma.playerProgress.findUnique({
        where: { userId },
      })

      if (!existing) {
        // First save
        const created = await prisma.playerProgress.create({
          data: {
            userId,
            progressData: progressData as Prisma.InputJsonValue,
            version: 1,
            savedAt: new Date(),
          },
        })

        return {
          id: created.id,
          progressData: created.progressData,
          version: created.version,
          savedAt: created.savedAt.toISOString(),
        }
      }

      // Optimistic concurrency check
      if (version !== existing.version) {
        return reply.code(409).send({
          error: 'Conflict',
          message: 'Progress has been modified since your last read. Reload and retry.',
          currentVersion: existing.version,
        })
      }

      const updated = await prisma.playerProgress.update({
        where: { id: existing.id },
        data: {
          progressData: progressData as Prisma.InputJsonValue,
          version: existing.version + 1,
          savedAt: new Date(),
        },
      })

      return {
        id: updated.id,
        progressData: updated.progressData,
        version: updated.version,
        savedAt: updated.savedAt.toISOString(),
      }
    },
  })
}
