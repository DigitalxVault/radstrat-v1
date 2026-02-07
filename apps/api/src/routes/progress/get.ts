import { z } from 'zod/v4'
import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '@repo/database'
import { progressResponseSchema } from '@repo/shared'
import { playerAuth } from '../../middleware/auth.js'
import { requirePasswordChanged } from '../../middleware/require-password-changed.js'

export const getProgressRoute: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'GET',
    url: '/',
    schema: {
      tags: ['Progress'],
      summary: 'Get player progress',
      description: 'Load the latest saved progress for the authenticated player.',
      response: {
        200: z.union([
          progressResponseSchema,
          z.object({
            progressData: z.null(),
            version: z.literal(0),
            message: z.string(),
          }),
        ]),
      },
    },
    preHandler: [playerAuth, requirePasswordChanged],
    handler: async (request) => {
      const progress = await prisma.playerProgress.findUnique({
        where: { userId: request.user.id },
      })

      if (!progress) {
        return {
          progressData: null,
          version: 0,
          message: 'No progress saved yet',
        } as const
      }

      return {
        id: progress.id,
        progressData: progress.progressData,
        version: progress.version,
        savedAt: progress.savedAt.toISOString(),
      } as const
    },
  })
}
