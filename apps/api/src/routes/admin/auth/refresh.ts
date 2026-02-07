import { z } from 'zod/v4'
import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { refreshRequestSchema, tokenResponseSchema } from '@repo/shared'
import { refreshTokenPair, TokenError } from '../../../services/token.service.js'

export const adminRefreshRoute: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'POST',
    url: '/refresh',
    schema: {
      tags: ['Admin'],
      summary: 'Admin refresh tokens',
      description: 'Exchange a valid admin refresh token for a new token pair.',
      body: refreshRequestSchema,
      response: {
        200: tokenResponseSchema,
        401: z.object({ error: z.string(), message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const { accessToken, refreshToken } = await refreshTokenPair(
          request.body.refreshToken,
          true,
        )
        return { accessToken, refreshToken }
      } catch (error) {
        const message =
          error instanceof TokenError ? error.message : 'Token refresh failed'
        return reply.code(401).send({
          error: 'Unauthorized',
          message,
        })
      }
    },
  })
}
