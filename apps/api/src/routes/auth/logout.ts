import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { logoutRequestSchema, messageResponseSchema } from '@repo/shared'
import { revokeFamilyByToken } from '../../services/token.service.js'
import { playerAuth } from '../../middleware/auth.js'

export const logoutRoute: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'POST',
    url: '/logout',
    schema: {
      tags: ['Auth'],
      summary: 'Player logout',
      description: 'Revoke the refresh token family. The access token remains valid until expiry.',
      security: [{ playerBearerAuth: [] }],
      body: logoutRequestSchema,
      response: {
        200: messageResponseSchema,
      },
    },
    preHandler: [playerAuth],
    handler: async (request) => {
      await revokeFamilyByToken(request.body.refreshToken)
      return { message: 'Logged out successfully' }
    },
  })
}
