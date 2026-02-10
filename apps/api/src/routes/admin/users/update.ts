import { z } from 'zod/v4'
import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '@repo/database'
import { idParamSchema, updateUserRequestSchema, userResponseSchema } from '@repo/shared'
import { adminAuth } from '../../../middleware/admin-auth.js'
import { revokeAllUserTokens } from '../../../services/token.service.js'

export const adminUpdateUserRoute: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'PATCH',
    url: '/:id',
    schema: {
      tags: ['Admin'],
      summary: 'Update user',
      description: 'Enable/disable user or force password change. Disabling revokes all sessions.',
      security: [{ adminBearerAuth: [] }],
      params: idParamSchema,
      body: updateUserRequestSchema,
      response: {
        200: userResponseSchema,
        404: z.object({ error: z.string(), message: z.string() }),
      },
    },
    preHandler: [adminAuth],
    handler: async (request, reply) => {
      const { id } = request.params
      const updates = request.body

      const existing = await prisma.user.findUnique({ where: { id } })
      if (!existing) {
        return reply.code(404).send({
          error: 'NotFound',
          message: 'User not found',
        })
      }

      const user = await prisma.user.update({
        where: { id },
        data: updates,
      })

      // If user was disabled, revoke all their sessions
      if (updates.isActive === false) {
        await revokeAllUserTokens(id)
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
      }
    },
  })
}
