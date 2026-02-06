import { z } from 'zod/v4'
import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '@repo/database'

export const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'GET',
    url: '/health',
    schema: {
      tags: ['Health'],
      response: {
        200: z.object({
          status: z.string(),
          timestamp: z.string(),
          database: z.string(),
          uptime: z.number(),
        }),
      },
    },
    handler: async (_request, _reply) => {
      let dbStatus = 'disconnected'
      try {
        await prisma.$queryRaw`SELECT 1`
        dbStatus = 'connected'
      } catch {
        dbStatus = 'error'
      }
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        uptime: process.uptime(),
      }
    },
  })
}
