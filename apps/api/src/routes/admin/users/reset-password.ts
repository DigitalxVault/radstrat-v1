import { z } from 'zod/v4'
import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { idParamSchema, resetPasswordResponseSchema } from '@repo/shared'
import { adminAuth } from '../../../middleware/admin-auth.js'
import { resetPassword } from '../../../services/user.service.js'

export const adminResetPasswordRoute: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'POST',
    url: '/:id/reset-password',
    schema: {
      tags: ['Admin'],
      summary: 'Reset user password',
      description: 'Generate a new temporary password. User must change it on next login. Revokes all sessions.',
      params: idParamSchema,
      response: {
        200: resetPasswordResponseSchema,
        404: z.object({ error: z.string(), message: z.string() }),
      },
    },
    preHandler: [adminAuth],
    handler: async (request, reply) => {
      try {
        return await resetPassword(request.params.id)
      } catch {
        return reply.code(404).send({
          error: 'NotFound',
          message: 'User not found',
        })
      }
    },
  })
}
