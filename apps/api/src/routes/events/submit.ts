import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma, Prisma } from '@repo/database'
import { submitEventsRequestSchema, eventsResponseSchema } from '@repo/shared'
import { playerAuth } from '../../middleware/auth.js'
import { requirePasswordChanged } from '../../middleware/require-password-changed.js'

export const submitEventsRoute: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'POST',
    url: '/',
    schema: {
      tags: ['Events'],
      summary: 'Submit gameplay events',
      description: 'Submit a batch of gameplay events (up to 100). Events are stored for analytics.',
      security: [{ playerBearerAuth: [] }],
      body: submitEventsRequestSchema,
      response: {
        200: eventsResponseSchema,
      },
    },
    preHandler: [playerAuth, requirePasswordChanged],
    handler: async (request) => {
      const { events } = request.body
      const userId = request.user.id

      await prisma.event.createMany({
        data: events.map((e) => ({
          userId,
          eventType: e.eventType,
          payload: (e.payload ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        })),
      })

      return { submitted: events.length }
    },
  })
}
