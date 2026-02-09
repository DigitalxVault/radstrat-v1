import { z } from 'zod/v4'
import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '@repo/database'
import { idParamSchema } from '@repo/shared'
import { adminAuth } from '../../../middleware/admin-auth.js'
import { revokeAllUserTokens } from '../../../services/token.service.js'

export const adminDeleteUserRoute: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      tags: ['Admin'],
      summary: 'Delete user (soft)',
      description: 'Soft-delete a user by setting isActive to false. Revokes all sessions.',
      params: idParamSchema,
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ error: z.string(), message: z.string() }),
      },
    },
    preHandler: [adminAuth],
    handler: async (request, reply) => {
      const { id } = request.params

      const existing = await prisma.user.findUnique({ where: { id } })
      if (!existing) {
        return reply.code(404).send({
          error: 'NotFound',
          message: 'User not found',
        })
      }

      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      })

      await revokeAllUserTokens(id)

      return { message: `User ${existing.email} has been deactivated` }
    },
  })
}
