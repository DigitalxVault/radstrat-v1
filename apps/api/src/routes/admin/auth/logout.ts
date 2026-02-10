import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { logoutRequestSchema, messageResponseSchema } from '@repo/shared'
import { revokeFamilyByToken } from '../../../services/token.service.js'
import { adminAuth } from '../../../middleware/admin-auth.js'

export const adminLogoutRoute: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'POST',
    url: '/logout',
    schema: {
      tags: ['Admin'],
      summary: 'Admin logout',
      description: 'Revoke the admin refresh token family.',
      security: [{ adminBearerAuth: [] }],
      body: logoutRequestSchema,
      response: {
        200: messageResponseSchema,
      },
    },
    preHandler: [adminAuth],
    handler: async (request) => {
      await revokeFamilyByToken(request.body.refreshToken)
      return { message: 'Logged out successfully' }
    },
  })
}
