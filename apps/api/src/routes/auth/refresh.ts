import { z } from 'zod/v4'
import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { refreshRequestSchema, tokenResponseSchema } from '@repo/shared'
import { refreshTokenPair, TokenError } from '../../services/token.service.js'

export const refreshRoute: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'POST',
    url: '/refresh',
    schema: {
      tags: ['Auth'],
      summary: 'Refresh tokens',
      description: 'Exchange a valid refresh token for a new access/refresh token pair. The old refresh token is revoked.',
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
          false,
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
